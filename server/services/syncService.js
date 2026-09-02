import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Video from "../models/Video.js";
import SyncChannel from "../models/SyncChannel.js";
import { fetchChannelLatestVideos, searchYoutubeShorts } from "./youtubeService.js";
import { generateVideoDescription, generateUploadSuggestions } from "./aiService.js";

// Fallback channels — only used if the admin-managed SyncChannel
// collection is empty. Override/extend via YT_SYNC_CHANNEL_IDS in .env,
// or (preferred) manage the list from the Admin Dashboard, which writes
// to the SyncChannel collection.
const DEFAULT_SYNC_CHANNELS = [
    { channelId: "UCsBjURrPoezykLs9EqgamOA", label: "Fireship", fallbackCategory: "Programming" },
    { channelId: "UCsXVk37bltHxD1rDPwtNM8Q", label: "Kurzgesagt – In a Nutshell", fallbackCategory: "Education" },
    { channelId: "UCAuUUnT6oDeKwE6v1NGQxug", label: "TED", fallbackCategory: "Education" },
    { channelId: "UC_aEa8K-EOJ3D6gOs7HcyNg", label: "NoCopyrightSounds (VEXA Music)", fallbackCategory: "Music" },
];

const SYNC_USER_EMAIL = "sync@vexa.app";
const PER_CHANNEL_LIMIT = 5;

// Resolution order: admin-managed DB list > .env override > built-in
// defaults. The DB collection is seeded from defaults the first time
// this runs, so the Admin Dashboard always has something to show/edit.
const getSyncChannels = async () => {

    const dbChannels = await SyncChannel.find({ active: true });

    if (dbChannels.length > 0) {
        return dbChannels.map((c) => ({
            channelId: c.channelId,
            fallbackCategory: c.fallbackCategory || "General",
        }));
    }

    if (process.env.YT_SYNC_CHANNEL_IDS?.trim()) {
        return process.env.YT_SYNC_CHANNEL_IDS
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)
            .map((channelId) => ({ channelId, fallbackCategory: "General" }));
    }

    // Nothing configured anywhere yet — seed the DB from defaults so the
    // Admin Dashboard has real, editable rows from the very first run.
    const anyExist = await SyncChannel.countDocuments({});
    if (anyExist === 0) {
        await SyncChannel.insertMany(
            DEFAULT_SYNC_CHANNELS.map((c) => ({
                channelId: c.channelId,
                label: c.label,
                fallbackCategory: c.fallbackCategory,
            }))
        );
    }

    return DEFAULT_SYNC_CHANNELS;

};

export const getOrCreateSyncUser = async () => {

    let user = await User.findOne({ email: SYNC_USER_EMAIL });

    if (user) return user;

    const randomPassword = await bcrypt.hash(
        Math.random().toString(36).slice(2) + Date.now(),
        10
    );

    user = await User.create({
        name: "VEXA Auto-Sync",
        email: SYNC_USER_EMAIL,
        password: randomPassword,
    });

    return user;

};

// Pulls the latest videos from each configured channel via RSS, skips
// anything already in the DB (matched by videoId), and has AI draft a
// description + category/tags for each genuinely new one before saving.
// Safe to call repeatedly — idempotent thanks to the videoId dedup check.
export const runYoutubeSync = async () => {

    const channels = await getSyncChannels();
    const syncUser = await getOrCreateSyncUser();

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const { channelId, fallbackCategory } of channels) {

        let videos = [];

        try {
            videos = await fetchChannelLatestVideos(channelId, PER_CHANNEL_LIMIT);
        } catch (error) {
            console.error(`Sync: couldn't fetch channel ${channelId}:`, error.message);
            continue;
        }

        for (const v of videos) {

            const exists = await Video.findOne({ videoId: v.videoId });

            if (exists) {
                skipped += 1;
                continue;
            }

            let description = "";
            let category = fallbackCategory;
            let tags = [];

            try {

                const [desc, suggestions] = await Promise.all([
                    generateVideoDescription(v.title, v.channel),
                    generateUploadSuggestions(v.title, ""),
                ]);

                description = desc;
                category = suggestions.category || fallbackCategory;
                tags = suggestions.tags || [];

            } catch (error) {
                // AI enrichment failing shouldn't block the video from
                // being added — it just won't have a description/tags yet.
                console.error(`Sync: AI enrichment failed for ${v.videoId}:`, error.message);
            }

            try {

                await Video.create({
                    user: syncUser._id,
                    title: v.title,
                    description,
                    tags,
                    channel: v.channel,
                    thumbnail: v.thumbnail,
                    videoUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
                    videoId: v.videoId,
                    views: 0,
                    likes: 0,
                    time: "Auto-synced",
                    duration: "",
                    category,
                });

                created += 1;

            } catch (error) {
                console.error(`Sync: couldn't save ${v.videoId}:`, error.message);
                failed += 1;
            }

        }

    }

    return { created, skipped, failed };

};

// ================= SHORTS AUTO-SYNC =================
// A handful of broad, evergreen search terms — Shorts don't come from
// fixed channels the way the main sync does, they come from search
// (videoDuration=short, then narrowed to <=60s in youtubeService.js).
// Requires YOUTUBE_API_KEY (the same key the search feature uses).
const SHORTS_SEARCH_QUERIES = [
    { query: "shorts", category: "Entertainment" },
    { query: "tech shorts", category: "Technology" },
    { query: "life hacks shorts", category: "Education" },
    { query: "comedy shorts", category: "Entertainment" },
    { query: "gaming shorts", category: "Gaming" },
];
const PER_QUERY_LIMIT = 10;

export const runYoutubeShortsSync = async () => {

    const syncUser = await getOrCreateSyncUser();

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const { query, category } of SHORTS_SEARCH_QUERIES) {

        let clips = [];

        try {
            clips = await searchYoutubeShorts(query, PER_QUERY_LIMIT);
        } catch (error) {
            console.error(`Shorts sync: search failed for "${query}":`, error.message);
            continue;
        }

        for (const clip of clips) {

            const exists = await Video.findOne({ videoId: clip.videoId });

            if (exists) {
                skipped += 1;
                continue;
            }

            try {

                await Video.create({
                    user: syncUser._id,
                    title: clip.title,
                    description: "",
                    tags: [],
                    channel: clip.channel,
                    thumbnail: clip.thumbnail,
                    videoUrl: `https://www.youtube.com/watch?v=${clip.videoId}`,
                    videoId: clip.videoId,
                    views: 0,
                    likes: 0,
                    time: "Auto-synced",
                    duration: clip.durationSeconds ? `0:${String(clip.durationSeconds).padStart(2, "0")}` : "",
                    category,
                    isShort: true,
                });

                created += 1;

            } catch (error) {
                console.error(`Shorts sync: couldn't save ${clip.videoId}:`, error.message);
                failed += 1;
            }

        }

    }

    return { created, skipped, failed };

};
