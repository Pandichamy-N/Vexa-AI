import Track from "../models/Track.js";
import User from "../models/User.js";
import { searchYoutubeVideos } from "../services/youtubeService.js";
import { pickNextTracks } from "../services/aiService.js";

// A single "key" that uniquely identifies a track — used for both the
// upsert filter and for de-duping/ordering below.
const trackKey = (t) => `youtube:${t.youtubeId}`;

// Normalizes one YouTube search result into our Track shape.
// Stream-only by design — downloadAllowed is always false, per
// YouTube's Terms of Service (see MusicCard.jsx / RingtoneTrimmerModal).
const normalizeYoutubeTrack = (v) => ({
    source: "youtube",
    youtubeId: v.videoId,
    title: v.title,
    artist: v.channel,
    album: "",
    cover: v.thumbnail,
    duration: 0,
    streamUrl: "",
    downloadUrl: "",
    downloadAllowed: false,
    licenseUrl: "",
    genres: [],
});

// Upserts a batch of normalized tracks into our Track cache and returns
// the corresponding Mongo docs, in the same order they were given —
// order matters, it's the relevance ranking.
const upsertTracks = async (normalizedTracks) => {

    if (normalizedTracks.length === 0) return [];

    // De-dupe by youtubeId first — YouTube search can occasionally
    // return the same video twice in one page, and two upserts against
    // the same not-yet-existing document in one unordered bulkWrite can
    // race and throw a duplicate-key (E11000) error.
    const seen = new Set();
    const uniqueTracks = normalizedTracks.filter((t) => {
        if (seen.has(t.youtubeId)) return false;
        seen.add(t.youtubeId);
        return true;
    });

    const ops = uniqueTracks.map((t) => ({
        updateOne: {
            filter: { source: "youtube", youtubeId: t.youtubeId },
            update: { $set: t },
            upsert: true,
        },
    }));

    try {
        await Track.bulkWrite(ops, { ordered: false });
    } catch (error) {
        // Duplicate-key races on upsert are harmless here — the doc
        // ends up existing either way. Anything else, rethrow.
        if (error.code !== 11000 && !(error.writeErrors?.every((e) => e.code === 11000))) {
            throw error;
        }
    }

    const youtubeIds = uniqueTracks.map((t) => t.youtubeId);

    const docs = await Track.find({ source: "youtube", youtubeId: { $in: youtubeIds } });

    const byKey = new Map(docs.map((d) => [trackKey(d), d]));

    return normalizedTracks.map((t) => byKey.get(trackKey(t))).filter(Boolean);

};

// ================= SEARCH (YouTube) =================
export const searchMusic = async (req, res) => {
    try {

        const q = req.query.q?.trim();
        const pageToken = req.query.pageToken || null;

        if (!q) {
            return res.status(400).json({ success: false, message: "Query is required" });
        }

        const youtubeResult = await searchYoutubeVideos(q, 25, pageToken, "10").catch((error) => {
            console.error("YouTube music search failed:", error.message);
            return { videos: [], nextPageToken: null };
        });

        const normalizedYoutube = youtubeResult.videos.map(normalizeYoutubeTrack);

        const tracks = await upsertTracks(normalizedYoutube);

        res.status(200).json({
            success: true,
            tracks,
            hasMore: Boolean(youtubeResult.nextPageToken),
            nextPageToken: youtubeResult.nextPageToken,
        });

    } catch (error) {
        console.error("Music search failed:", error.message);
        res.status(500).json({ success: false, message: "Search failed. Try again." });
    }
};

// ================= AI-BASED "UP NEXT" (VEXA Music auto-continue) =================
// When a person plays a track straight from search results and it ends
// (or they hit skip), this is what decides what plays next — instead of
// just marching down the search-results list in whatever order they
// happened to appear in. It pulls a fresh pool of same-artist/style
// candidates from YouTube, then asks the LLM to curate + sequence them
// the way a human "radio" curator would (mood/style/energy), the same
// approach used for the main video platform's "AI Up Next". Falls back
// to the plain candidate order if the AI call fails or returns nothing.
export const getMusicNextTracks = async (req, res) => {

    try {

        const { id } = req.params;

        const currentTrack = await Track.findById(id);

        if (!currentTrack) {
            return res.status(404).json({ success: false, message: "Track not found" });
        }

        // Recently-played track ids from this listening session (sent by
        // the player) — without this, "similar songs" for track B could
        // easily resurface track A right after it, causing an A→B→A→B
        // loop instead of an actually-continuing mix.
        const recentIds = typeof req.query.excludeIds === "string"
            ? req.query.excludeIds.split(",").filter(Boolean)
            : [];

        const recentTracks = recentIds.length
            ? await Track.find({ _id: { $in: recentIds } }).select("youtubeId")
            : [];

        const excludedYoutubeIds = new Set([
            currentTrack.youtubeId,
            ...recentTracks.map((t) => t.youtubeId),
        ]);

        const searchTerm = currentTrack.artist || currentTrack.title;

        // No videoCategoryId restriction here (unlike searchMusic above) —
        // that filter is what keeps typed searches on-topic, but for
        // blending it narrows the pool so much for many artists that
        // only 1-2 candidates survive, which is what was causing
        // playback to loop between the same couple of songs. A wider,
        // unrestricted pool plus the excludedYoutubeIds filter below is
        // what actually keeps the mix varied.
        const youtubeResult = await searchYoutubeVideos(searchTerm, 40).catch((error) => {
            console.error("Music next-up candidate search failed:", error.message);
            return { videos: [] };
        });

        const normalized = youtubeResult.videos
            .map(normalizeYoutubeTrack)
            .filter((t) => !excludedYoutubeIds.has(t.youtubeId));

        if (normalized.length === 0) {
            return res.status(200).json({ success: true, tracks: [], source: "none" });
        }

        const candidateTracks = await upsertTracks(normalized);

        try {

            const orderedIds = await pickNextTracks(
                { title: currentTrack.title, channel: currentTrack.artist, tags: currentTrack.genres },
                candidateTracks.map((t) => ({ id: t._id.toString(), title: t.title, channel: t.artist, tags: t.genres }))
            );

            const byId = new Map(candidateTracks.map((t) => [t._id.toString(), t]));
            const aiOrdered = orderedIds.map((tid) => byId.get(tid)).filter(Boolean);

            if (aiOrdered.length > 0) {
                return res.status(200).json({ success: true, tracks: aiOrdered.slice(0, 8), source: "ai" });
            }

        } catch (aiError) {
            console.error("AI next-up (music) failed, using search-order fallback:", aiError.message);
        }

        res.status(200).json({ success: true, tracks: candidateTracks.slice(0, 8), source: "search" });

    } catch (error) {

        console.error("Music next-up failed:", error.message);
        res.status(500).json({ success: false, message: error.message });

    }

};

// ================= FAVORITES (Track) =================
export const toggleFavoriteTrack = async (req, res) => {
    try {

        const { trackId } = req.params;

        const track = await Track.findById(trackId);
        if (!track) {
            return res.status(404).json({ success: false, message: "Track not found" });
        }

        const user = await User.findById(req.user._id);
        const already = user.favoriteTracks.some((id) => id.toString() === trackId);

        if (already) {
            user.favoriteTracks = user.favoriteTracks.filter((id) => id.toString() !== trackId);
        } else {
            user.favoriteTracks.push(trackId);
        }

        await user.save();

        res.status(200).json({ success: true, favorited: !already });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const checkFavoriteTrack = async (req, res) => {
    try {

        const user = await User.findById(req.user._id).select("favoriteTracks");
        const favorited = user.favoriteTracks.some((id) => id.toString() === req.params.trackId);

        res.status(200).json({ success: true, favorited });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getFavoriteTracks = async (req, res) => {
    try {

        const user = await User.findById(req.user._id).populate("favoriteTracks");

        res.status(200).json({ success: true, tracks: user.favoriteTracks });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= RECENTLY PLAYED =================
const MAX_RECENTLY_PLAYED = 50;

export const recordRecentlyPlayed = async (req, res) => {
    try {

        const { trackId } = req.params;

        const track = await Track.findById(trackId);
        if (!track) {
            return res.status(404).json({ success: false, message: "Track not found" });
        }

        const user = await User.findById(req.user._id);

        // Move-to-front semantics — remove any existing entry for this
        // track, then add a fresh one at the front.
        user.recentlyPlayedTracks = user.recentlyPlayedTracks.filter(
            (entry) => entry.track.toString() !== trackId
        );
        user.recentlyPlayedTracks.unshift({ track: trackId, playedAt: new Date() });
        user.recentlyPlayedTracks = user.recentlyPlayedTracks.slice(0, MAX_RECENTLY_PLAYED);

        await user.save();

        res.status(200).json({ success: true });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getRecentlyPlayed = async (req, res) => {
    try {

        const user = await User.findById(req.user._id).populate("recentlyPlayedTracks.track");

        const tracks = user.recentlyPlayedTracks
            .filter((entry) => entry.track)
            .map((entry) => entry.track);

        res.status(200).json({ success: true, tracks });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= VEXA MUSIC: SOCIAL (Follow) =================
// A separate social graph from the video-side subscribe/subscriber
// system — following someone's music taste is its own relationship.

export const toggleFollowMusicUser = async (req, res) => {
    try {

        const { userId } = req.params;

        if (userId === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: "You can't follow yourself" });
        }

        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const me = await User.findById(req.user._id);
        const alreadyFollowing = me.musicFollowing.some((id) => id.toString() === userId);

        if (alreadyFollowing) {
            me.musicFollowing = me.musicFollowing.filter((id) => id.toString() !== userId);
            targetUser.musicFollowers = targetUser.musicFollowers.filter(
                (id) => id.toString() !== req.user._id.toString()
            );
        } else {
            me.musicFollowing.push(userId);
            targetUser.musicFollowers.push(req.user._id);
        }

        await Promise.all([me.save(), targetUser.save()]);

        res.status(200).json({
            success: true,
            following: !alreadyFollowing,
            followersCount: targetUser.musicFollowers.length,
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Public-ish VEXA Music profile — followers/following counts, whether
// the requester follows them, and their public liked-songs count. No
// private data (email, playlists contents, etc.) is exposed here.
export const getMusicProfile = async (req, res) => {
    try {

        const { userId } = req.params;

        const user = await User.findById(userId).select(
            "name profilePic musicFollowers musicFollowing favoriteTracks"
        );

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const isFollowing = req.user
            ? user.musicFollowers.some((id) => id.toString() === req.user._id.toString())
            : false;

        res.status(200).json({
            success: true,
            profile: {
                _id: user._id,
                name: user.name,
                profilePic: user.profilePic,
                followersCount: user.musicFollowers.length,
                followingCount: user.musicFollowing.length,
                likedSongsCount: user.favoriteTracks.length,
                isFollowing,
                isSelf: req.user ? req.user._id.toString() === userId : false,
            },
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lists of who follows / who they follow — basic info only.
export const getMusicFollowers = async (req, res) => {
    try {

        const user = await User.findById(req.params.userId)
            .select("musicFollowers")
            .populate("musicFollowers", "name profilePic");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, users: user.musicFollowers });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMusicFollowing = async (req, res) => {
    try {

        const user = await User.findById(req.params.userId)
            .select("musicFollowing")
            .populate("musicFollowing", "name profilePic");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, users: user.musicFollowing });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
