import axios from "axios";

// Accepts youtu.be, youtube.com/watch?v=, youtube.com/shorts/, or a bare ID.
export const extractYoutubeId = (input) => {

    if (!input) return null;

    const trimmed = input.trim();

    // Bare 11-char video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
        return trimmed;
    }

    const patterns = [
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match) return match[1];
    }

    return null;
};

// ================= CHANNEL AUTO-SYNC (no API key needed) =================
// YouTube exposes a public RSS feed per channel — no key required, unlike
// the Data API. Used to power automatic catalog growth (see syncService.js).

const decodeHtmlEntities = (text = "") =>
    text
        .replace(/&amp;/g, "&")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");

export const fetchChannelLatestVideos = async (channelId, limit = 5) => {

    const { data: xml } = await axios.get(
        "https://www.youtube.com/feeds/videos.xml",
        {
            params: { channel_id: channelId },
            timeout: 10000,
        }
    );

    // Lightweight regex parse — the feed format is stable and simple
    // enough that pulling in a full XML parser dependency isn't needed.
    const entries = xml.split("<entry>").slice(1);

    const videos = entries.slice(0, limit).map((chunk) => {

        const videoId = (chunk.match(/<yt:videoId>(.*?)<\/yt:videoId>/) || [])[1];
        const rawTitle = (chunk.match(/<title>(.*?)<\/title>/) || [])[1];
        const published = (chunk.match(/<published>(.*?)<\/published>/) || [])[1];
        const thumbnail = (chunk.match(/<media:thumbnail url="([^"]+)"/) || [])[1];
        const rawChannel = (chunk.match(/<name>(.*?)<\/name>/) || [])[1];

        return {
            videoId,
            title: decodeHtmlEntities(rawTitle || ""),
            published,
            thumbnail,
            channel: decodeHtmlEntities(rawChannel || ""),
        };

    });

    return videos.filter((v) => v.videoId && v.title);

};

// ================= LIVE YOUTUBE SEARCH (powers real-time AI search) =================
// Uses the official YouTube Data API v3 — the only legitimate way to
// search across all of YouTube (unlike oEmbed/RSS, which only work for a
// video/channel you already know). Requires a free YOUTUBE_API_KEY from
// Google Cloud Console (enable "YouTube Data API v3"). Returns [] with a
// console warning if the key is missing or the call fails, so search
// degrades to local-only results rather than breaking.
// maxResults: YouTube's hard cap is 50 per request (quota cost is the
// same 100 units regardless of maxResults, so there's no reason not to
// ask for the max). pageToken lets the caller page through more results
// ("Load More"), same as scrolling YouTube's own search results.
export const searchYoutubeVideos = async (query, maxResults = 50, pageToken = null) => {

    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
        console.warn("YOUTUBE_API_KEY not set — live YouTube search is skipped, only local videos are searched.");
        return { videos: [], nextPageToken: null };
    }

    try {

        const { data } = await axios.get(
            "https://www.googleapis.com/youtube/v3/search",
            {
                params: {
                    part: "snippet",
                    q: query,
                    type: "video",
                    maxResults: Math.min(maxResults, 50),
                    safeSearch: "moderate",
                    key: apiKey,
                    ...(pageToken ? { pageToken } : {}),
                },
                timeout: 8000,
            }
        );

        const videos = (data.items || [])
            .filter((item) => item.id?.videoId)
            .map((item) => ({
                videoId: item.id.videoId,
                title: decodeHtmlEntities(item.snippet.title),
                channel: decodeHtmlEntities(item.snippet.channelTitle),
                thumbnail:
                    item.snippet.thumbnails?.high?.url ||
                    item.snippet.thumbnails?.medium?.url ||
                    item.snippet.thumbnails?.default?.url,
                publishedAt: item.snippet.publishedAt,
                snippetDescription: decodeHtmlEntities(item.snippet.description || ""),
            }));

        return { videos, nextPageToken: data.nextPageToken || null };

    } catch (error) {
        console.error("Live YouTube search failed:", error.response?.data?.error?.message || error.message);
        return { videos: [], nextPageToken: null };
    }

};

// ================= DURATION LOOKUP (shared) =================
// Fetches exact ISO 8601 durations for a batch of video IDs in one
// call. Used to tell real songs/videos apart from YouTube Shorts,
// which search.list's videoDuration filter can't do precisely (its
// "short" bucket means "under 4 minutes", not "is a Short").
export const getVideoDurationsSeconds = async (videoIds) => {

    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey || videoIds.length === 0) return {};

    try {

        const { data } = await axios.get(
            "https://www.googleapis.com/youtube/v3/videos",
            {
                params: {
                    part: "contentDetails",
                    id: videoIds.join(","),
                    key: apiKey,
                },
                timeout: 8000,
            }
        );

        const durationById = {};
        (data.items || []).forEach((item) => {
            durationById[item.id] = parseIsoDurationToSeconds(item.contentDetails?.duration);
        });

        return durationById;

    } catch (error) {
        console.error("Video duration lookup failed:", error.response?.data?.error?.message || error.message);
        return {};
    }

};

// Filters a batch of search.list-shaped video results (each with a
// `videoId`) down to ones that AREN'T YouTube Shorts (<=60s) — used to
// keep Shorts-length clips out of the Music search/next-up results,
// which is a plain YouTube search under the hood and would otherwise
// happily return #shorts snippets of a song alongside the real track.
// A video whose duration lookup fails is kept rather than dropped —
// better an occasional Short slips through than a flaky API call
// silently empties someone's search results.
export const excludeYoutubeShorts = async (videos) => {

    const ids = videos.map((v) => v.videoId).filter(Boolean);
    const durationById = await getVideoDurationsSeconds(ids);

    return videos.filter((v) => {
        const seconds = durationById[v.videoId];
        return seconds == null || seconds > 60;
    });

};

// ================= YOUTUBE SHORTS SEARCH (powers Shorts auto-fetch) =================
// search.list's videoDuration=short only guarantees "under 4 minutes",
// not actually Shorts-length — so this does a second call to
// videos.list for exact ISO 8601 durations and keeps only <=60s clips,
// which also gives back the vertical-video ids to store as isShort.
const parseIsoDurationToSeconds = (iso) => {
    const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || "");
    if (!match) return null;
    const [, h, m, s] = match;
    return (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
};

export const searchYoutubeShorts = async (query, maxResults = 15) => {

    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
        console.warn("YOUTUBE_API_KEY not set — Shorts auto-fetch is skipped.");
        return [];
    }

    try {

        const { data: searchData } = await axios.get(
            "https://www.googleapis.com/youtube/v3/search",
            {
                params: {
                    part: "snippet",
                    q: query,
                    type: "video",
                    videoDuration: "short", // YouTube's own "<4 min" bucket — narrowed below
                    maxResults: Math.min(maxResults, 50),
                    safeSearch: "moderate",
                    key: apiKey,
                },
                timeout: 8000,
            }
        );

        const candidateIds = (searchData.items || [])
            .map((item) => item.id?.videoId)
            .filter(Boolean);

        if (!candidateIds.length) return [];

        const { data: detailsData } = await axios.get(
            "https://www.googleapis.com/youtube/v3/videos",
            {
                params: {
                    part: "contentDetails",
                    id: candidateIds.join(","),
                    key: apiKey,
                },
                timeout: 8000,
            }
        );

        const durationById = {};
        (detailsData.items || []).forEach((item) => {
            durationById[item.id] = parseIsoDurationToSeconds(item.contentDetails?.duration);
        });

        return (searchData.items || [])
            .filter((item) => {
                const seconds = durationById[item.id?.videoId];
                return seconds != null && seconds > 0 && seconds <= 60;
            })
            .map((item) => ({
                videoId: item.id.videoId,
                title: decodeHtmlEntities(item.snippet.title),
                channel: decodeHtmlEntities(item.snippet.channelTitle),
                thumbnail:
                    item.snippet.thumbnails?.high?.url ||
                    item.snippet.thumbnails?.medium?.url ||
                    item.snippet.thumbnails?.default?.url,
                publishedAt: item.snippet.publishedAt,
                durationSeconds: durationById[item.id.videoId],
            }));

    } catch (error) {
        console.error("Shorts search failed:", error.response?.data?.error?.message || error.message);
        return [];
    }

};

// Uses YouTube's public oEmbed endpoint — no API key required. Returns
// title, channel name, and thumbnail for any public, embeddable video.
export const fetchYoutubeMetadata = async (youtubeUrlOrId) => {

    const videoId = extractYoutubeId(youtubeUrlOrId);

    if (!videoId) {
        const error = new Error(
            "That doesn't look like a valid YouTube link or video ID."
        );
        error.statusCode = 400;
        throw error;
    }

    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

    try {

        const { data } = await axios.get(
            "https://www.youtube.com/oembed",
            {
                params: {
                    url: watchUrl,
                    format: "json",
                },
                timeout: 8000,
            }
        );

        return {
            videoId,
            videoUrl: watchUrl,
            title: data.title,
            channel: data.author_name,
            thumbnail: data.thumbnail_url,
        };

    } catch (error) {

        const wrapped = new Error(
            "Couldn't fetch this video from YouTube. It may be private, region-locked, or embedding may be disabled."
        );
        wrapped.statusCode = 422;
        throw wrapped;

    }

};
