import Video from "../models/Video.js";
import User from "../models/User.js";
import SearchLog from "../models/SearchLog.js";
import Notification from "../models/Notification.js";
import { moderateComment, generateTrendingInsight, expandSearchQuery, generateVideoDescription, generateUploadSuggestions, pickNextTracks } from "../services/aiService.js";
import { runYoutubeSync, runYoutubeShortsSync, getOrCreateSyncUser } from "../services/syncService.js";
import { searchYoutubeVideos } from "../services/youtubeService.js";
import { buildInterestProfile, scoreVideosForProfile } from "../services/recommendationService.js";

// How many top-ranked videos get an AI-written "why it's trending" note.
// Kept small so a page load never triggers more than a handful of AI
// calls, and each note is cached on the video document afterward.
const TRENDING_INSIGHT_COUNT = 6;
const TRENDING_INSIGHT_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

// Reddit/HN-style "hot" ranking, extended with two extra signals beyond
// raw engagement: growth rate (are views accelerating right now, not just
// accumulated?) and search popularity (are people actively searching for
// this kind of content?) — both requested explicitly as trending inputs.
const computeTrendingScore = (video, searchPopularityByCategory = {}) => {

    const hoursSinceUpload =
        (Date.now() - new Date(video.createdAt).getTime()) / (1000 * 60 * 60);

    const commentCount = video.comments?.filter((c) => !c.flagged).length || 0;

    const engagement =
        (video.views || 0) * 1 +
        (video.likes || 0) * 4 +
        commentCount * 3;

    // Growth rate: views in the last 24h vs the 24h before that. A video
    // that's accelerating scores a bonus even if its total views are low.
    const events = video.viewEvents || [];
    const now = Date.now();
    const last24h = events.filter((d) => now - new Date(d).getTime() <= 24 * 60 * 60 * 1000).length;
    const prev24h = events.filter((d) => {
        const age = now - new Date(d).getTime();
        return age > 24 * 60 * 60 * 1000 && age <= 48 * 60 * 60 * 1000;
    }).length;
    const growthRate = last24h - prev24h; // can be negative; that's fine, it's additive below

    // Search popularity: how often this video's category is being
    // actively searched for right now.
    const searchPopularity = searchPopularityByCategory[video.category] || 0;

    const score =
        (engagement + growthRate * 10 + searchPopularity * 5) /
        Math.pow(hoursSinceUpload + 2, 1.3);

    return { score, hoursSinceUpload, commentCount, growthRate, last24h };
};

// ================= AUTO-FETCH VIDEOS FROM YOUTUBE (on demand) =================
// Also runs automatically once in the background when the server starts
// (see server.js) — this endpoint lets the client trigger a fresh sync
// too, e.g. from a "Sync Now" button.
export const autoFetchVideos = async (req, res) => {

    try {

        const result = await runYoutubeSync();

        res.status(200).json({
            success: true,
            ...result,
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }

};

// ================= AUTO-FETCH SHORTS FROM YOUTUBE (search-based) =================
export const autoFetchShorts = async (req, res) => {

    try {

        const result = await runYoutubeShortsSync();

        res.status(200).json({
            success: true,
            ...result,
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }

};

// Counts recent searches (last 48h) whose AI-expanded likely category
// matches each category — a proxy for "what are people searching for
// right now" that feeds into the trending score above.
const getSearchPopularityByCategory = async () => {

    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const logs = await SearchLog.find({ createdAt: { $gte: since } }).select("likelyCategory");

    const counts = {};
    for (const log of logs) {
        if (!log.likelyCategory) continue;
        counts[log.likelyCategory] = (counts[log.likelyCategory] || 0) + 1;
    }

    return counts;

};

// ================= AI-RANKED TRENDING =================
export const getTrendingVideos = async (req, res) => {

    try {

        const videos = await Video.find({}).populate(
            "user",
            "name email subscribers"
        );

        const searchPopularity = await getSearchPopularityByCategory();

        const ranked = videos
            .map((video) => {
                const { score, hoursSinceUpload, commentCount, growthRate } = computeTrendingScore(video, searchPopularity);
                return { video, score, hoursSinceUpload, commentCount, growthRate };
            })
            .sort((a, b) => b.score - a.score);

        const top = ranked.slice(0, 30);

        // Refresh AI insights for the current top few, only if missing
        // or stale — keeps this fast and cheap on repeat visits.
        const needsInsight = top
            .slice(0, TRENDING_INSIGHT_COUNT)
            .filter(({ video }) => {
                const isStale =
                    !video.trendingInsightGeneratedAt ||
                    Date.now() - new Date(video.trendingInsightGeneratedAt).getTime() > TRENDING_INSIGHT_TTL_MS;
                return !video.trendingInsight || isStale;
            });

        await Promise.all(
            needsInsight.map(async ({ video, hoursSinceUpload, commentCount }) => {
                try {
                    const insight = await generateTrendingInsight({
                        title: video.title,
                        category: video.category,
                        views: video.views,
                        likes: video.likes,
                        commentCount,
                        hoursSinceUpload,
                    });

                    video.trendingInsight = insight;
                    video.trendingInsightGeneratedAt = new Date();
                    await video.save();
                } catch (error) {
                    console.error("Trending insight failed for", video._id, error.message);
                }
            })
        );

        const result = top.map(({ video, score, growthRate }, index) => ({
            ...video.toObject(),
            trendingScore: score,
            trendingRank: index + 1,
            rising: growthRate > 0,
        }));

        res.status(200).json(result);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }

};

// ================= VIDEOS GROUPED BY CATEGORY =================
export const getCategorizedVideos = async (req, res) => {

    try {

        const videos = await Video.find({}).populate(
            "user",
            "name email subscribers"
        );

        const searchPopularity = await getSearchPopularityByCategory();

        const grouped = {};

        for (const video of videos) {
            const { score } = computeTrendingScore(video, searchPopularity);
            const category = video.category || "General";

            if (!grouped[category]) {
                grouped[category] = [];
            }

            grouped[category].push({
                ...video.toObject(),
                trendingScore: score,
            });
        }

        // Rank each category's videos so the frontend can badge the top pick
        for (const category of Object.keys(grouped)) {
            grouped[category].sort((a, b) => b.trendingScore - a.trendingScore);
        }

        res.status(200).json(grouped);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }

};

// ================= LATEST VIDEOS =================
export const getLatestVideos = async (req, res) => {
    try {

        const videos = await Video.find({})
            .populate("user", "name email subscribers")
            .sort({ createdAt: -1 })
            .limit(20);

        res.status(200).json(videos);

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= MOST VIEWED VIDEOS =================
export const getMostViewedVideos = async (req, res) => {
    try {

        const videos = await Video.find({})
            .populate("user", "name email subscribers")
            .sort({ views: -1 })
            .limit(20);

        res.status(200).json(videos);

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= VEXA MUSIC: ARTIST LIST (for the "pick 3+" picker) =================
export const getMusicArtists = async (req, res) => {

    try {

        const artists = await Video.aggregate([
            { $match: { category: "Music" } },
            {
                $group: {
                    _id: "$channel",
                    trackCount: { $sum: 1 },
                    thumbnail: { $first: "$thumbnail" },
                    totalViews: { $sum: "$views" },
                },
            },
            { $sort: { totalViews: -1 } },
            { $limit: 24 },
        ]);

        res.status(200).json(
            artists.map((a) => ({
                name: a._id,
                trackCount: a.trackCount,
                thumbnail: a.thumbnail,
            }))
        );

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }

};

// ================= VEXA MUSIC: MADE FOR YOU (favorite-artist AI mix) =================
// Direct tracks from picked artists first, then fills the rest with
// AI/tag-scored similar tracks so the mix doesn't feel thin even with
// only a few favorite artists in the catalog.
export const getMusicForYou = async (req, res) => {

    try {

        const user = await User.findById(req.user._id).select("favoriteArtists");

        if (!user?.favoriteArtists?.length) {
            return res.status(200).json({ tracks: [], needsArtistPick: true });
        }

        const directTracks = await Video.find({
            category: "Music",
            channel: { $in: user.favoriteArtists },
        }).populate("user", "name email subscribers").limit(30);

        const directIds = new Set(directTracks.map((v) => v._id.toString()));

        let filler = [];

        if (directTracks.length < 15) {

            const searchPopularity = await getSearchPopularityByCategory();
            const otherMusic = await Video.find({
                category: "Music",
                _id: { $nin: [...directIds] },
            }).limit(100);

            filler = otherMusic
                .map((video) => ({ video, score: computeTrendingScore(video, searchPopularity).score }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 15 - directTracks.length)
                .map((s) => s.video);

        }

        res.status(200).json({
            tracks: [...directTracks, ...filler],
            needsArtistPick: false,
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }

};

// ================= TOP PICKS (interest-category trending) =================
// Spotify/Pinterest-style: filtered strictly to the categories the user
// picked during onboarding, ranked by the same trending algorithm.
// Distinct from /recommended, which is broader behavior-based scoring.
export const getTopPicks = async (req, res) => {
    try {

        const user = await User.findById(req.user._id).select("interests");

        if (!user?.interests?.length) {
            return res.status(200).json({ videos: [], needsOnboarding: true });
        }

        const candidates = await Video.find({ category: { $in: user.interests } })
            .populate("user", "name email subscribers")
            .limit(300);

        const searchPopularity = await getSearchPopularityByCategory();

        // Rank within each selected category separately, then interleave
        // (round-robin) across categories instead of pooling everything
        // into one global sort. A pure global sort lets whichever
        // category happens to have the most videos in the DB (usually
        // Music, since that's what most synced channels produce) crowd
        // out every other category someone picked — so two people who
        // picked completely different categories could end up seeing an
        // almost identical, Music-heavy feed. Interleaving guarantees
        // every category the person actually selected shows up, as long
        // as at least one video exists for it.
        const byCategory = {};
        for (const category of user.interests) {
            byCategory[category] = candidates
                .filter((video) => video.category === category)
                .map((video) => ({ video, score: computeTrendingScore(video, searchPopularity).score }))
                .sort((a, b) => b.score - a.score)
                .map((s) => s.video);
        }

        const ranked = [];
        let addedInRound = true;
        while (ranked.length < 20 && addedInRound) {
            addedInRound = false;
            for (const category of user.interests) {
                const bucket = byCategory[category];
                if (bucket && bucket.length) {
                    ranked.push(bucket.shift());
                    addedInRound = true;
                    if (ranked.length >= 20) break;
                }
            }
        }

        res.status(200).json({
            videos: ranked,
            needsOnboarding: false,
            categoriesWithNoContent: user.interests.filter((c) => !candidates.some((v) => v.category === c)),
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= PERSONALIZED RECOMMENDATIONS =================
// Content-based: scores videos by category/tag overlap with the user's
// recent history, likes, and searches, with a light trending tiebreaker.
// Falls back to trending order for users with no activity yet (cold start).
export const getRecommendedVideos = async (req, res) => {
    try {

        const profile = await buildInterestProfile(req.user._id);

        const watchedIds = (await User.findById(req.user._id).select("history")).history.map((id) => id.toString());

        const candidates = await Video.find({ _id: { $nin: watchedIds } })
            .populate("user", "name email subscribers")
            .limit(200);

        if (!profile.hasHistory) {
            // Cold start — no signal yet, so surface what's trending instead
            // of an arbitrary/empty list.
            const searchPopularity = await getSearchPopularityByCategory();
            const ranked = candidates
                .map((video) => ({ video, score: computeTrendingScore(video, searchPopularity).score }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 20)
                .map(({ video }) => video);

            return res.status(200).json({ videos: ranked, coldStart: true });
        }

        const searchPopularity = await getSearchPopularityByCategory();
        const trendingScoreById = {};
        candidates.forEach((video) => {
            trendingScoreById[video._id.toString()] = computeTrendingScore(video, searchPopularity).score;
        });

        const scored = scoreVideosForProfile(candidates, profile, trendingScoreById);

        res.status(200).json({
            videos: scored.slice(0, 20).map((s) => s.video),
            coldStart: false,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= AI SEMANTIC SEARCH =================
// AI query-expansion search: turns the natural-language query into
// keywords + a likely category via the LLM, then matches against
// title/description/tags/category with those expanded terms — not true
// vector-embedding search (that needs a stored embedding index), but it
// meaningfully outperforms a literal substring match on vague queries.
export const semanticSearch = async (req, res) => {
    try {

        const query = req.query.q?.trim();
        // Optional scope filter — e.g. "Music" for VEXA Music search,
        // so results only come back from that category.
        const scopeCategory = req.query.category?.trim();
        // Pagination — pass the nextPageToken from a previous response
        // to fetch the next batch of live YouTube results ("Load More"),
        // same as scrolling YouTube's own search results.
        const pageToken = req.query.pageToken || null;

        if (!query) {
            return res.status(400).json({ success: false, message: "Query is required" });
        }

        const { keywords, likelyCategory } = await expandSearchQuery(query);

        const terms = [query, ...keywords].filter(Boolean);
        const orConditions = terms.map((term) => ({
            $or: [
                { title: { $regex: term, $options: "i" } },
                { description: { $regex: term, $options: "i" } },
                { tags: { $regex: term, $options: "i" } },
                { category: { $regex: term, $options: "i" } },
                { channel: { $regex: term, $options: "i" } },
            ],
        }));

        const localFilter = scopeCategory
            ? { $and: [{ category: scopeCategory }, { $or: orConditions }] }
            : { $or: orConditions };

        const localCandidates = await Video.find(localFilter)
            .populate("user", "name email subscribers")
            .limit(150);

        // ================= LIVE YOUTUBE RESULTS =================
        // Like YouTube/Instagram search: whatever you type gets fetched
        // live, not just what's already in our DB. New videos are
        // auto-imported (title/channel/thumbnail only, kept fast) so
        // they're immediately watchable; AI description/tags fill in a
        // few seconds later in the background. Fetches YouTube's max of
        // 50 per request so results feel as full as YouTube's own search.
        const knownVideoIds = new Set(localCandidates.map((v) => v.videoId).filter(Boolean));
        const { videos: liveResults, nextPageToken } = await searchYoutubeVideos(
            scopeCategory ? `${query} ${scopeCategory}` : query,
            50,
            pageToken
        );
        const newFromYoutube = liveResults.filter((r) => !knownVideoIds.has(r.videoId));

        let imported = [];

        if (newFromYoutube.length > 0) {

            const syncUser = await getOrCreateSyncUser();

            imported = await Promise.all(
                newFromYoutube.map(async (r) => {
                    try {
                        return await Video.create({
                            user: syncUser._id,
                            title: r.title,
                            description: r.snippetDescription?.slice(0, 300) || "",
                            tags: [],
                            channel: r.channel,
                            thumbnail: r.thumbnail,
                            videoUrl: `https://www.youtube.com/watch?v=${r.videoId}`,
                            videoId: r.videoId,
                            views: 0,
                            likes: 0,
                            time: "Found via search",
                            duration: "",
                            category: scopeCategory || likelyCategory || "General",
                        });
                    } catch (error) {
                        console.error("Auto-import from search failed:", error.message);
                        return null;
                    }
                })
            );

            imported = imported.filter(Boolean);

            // Fire-and-forget AI enrichment — don't make the person wait
            // on 2N extra AI calls just to see search results.
            imported.forEach((video) => {
                (async () => {
                    try {
                        const [desc, suggestions] = await Promise.all([
                            generateVideoDescription(video.title, video.channel),
                            generateUploadSuggestions(video.title, ""),
                        ]);
                        video.description = video.description || desc;
                        video.category = suggestions.category || video.category;
                        video.tags = suggestions.tags || [];
                        await video.save();
                    } catch (error) {
                        console.error("Background enrichment failed for", video._id, error.message);
                    }
                })();
            });

        }

        const candidates = [...localCandidates, ...imported];

        // Relevance = how many expanded terms actually match this video,
        // with a bonus if it's in the AI-guessed likely category, and a
        // bonus for videos YouTube itself ranked highly for this query.
        const youtubeRank = new Map(liveResults.map((r, i) => [r.videoId, liveResults.length - i]));

        const scored = candidates.map((video) => {
            const haystack = `${video.title} ${video.description} ${(video.tags || []).join(" ")} ${video.category} ${video.channel}`.toLowerCase();
            let matchCount = 0;
            terms.forEach((term) => {
                if (haystack.includes(term.toLowerCase())) matchCount += 1;
            });
            if (likelyCategory && video.category === likelyCategory) matchCount += 2;
            matchCount += (youtubeRank.get(video.videoId) || 0) * 0.5;
            return { video, matchCount };
        }).sort((a, b) => b.matchCount - a.matchCount);

        const results = scored.slice(0, 80).map((s) => s.video);

        // Log for "Most Searched" + trending search-popularity signal.
        // Only log the first page of a search, not every "Load More".
        if (!pageToken) {
            try {
                await SearchLog.create({
                    query,
                    normalizedQuery: query.toLowerCase().trim(),
                    user: req.user?._id,
                    expandedKeywords: keywords,
                    likelyCategory,
                    resultCount: results.length,
                });
            } catch (logError) {
                console.error("Search log failed:", logError.message);
            }
        }

        res.status(200).json({
            results,
            expandedKeywords: keywords,
            likelyCategory,
            liveResultsCount: newFromYoutube.length,
            nextPageToken,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= MOST SEARCHED =================
export const getMostSearched = async (req, res) => {
    try {

        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const top = await SearchLog.aggregate([
            { $match: { createdAt: { $gte: since } } },
            {
                $group: {
                    _id: "$normalizedQuery",
                    displayQuery: { $first: "$query" },
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 12 },
        ]);

        res.status(200).json(
            top.map((t) => ({ query: t.displayQuery, count: t.count }))
        );

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= QUICK SEARCH (live, as-you-type) =================
// Fast regex match, no AI call — used for the Navbar's live dropdown
// while typing. The full AI semantic search (see semanticSearch below)
// runs on Enter / when landing on the Search Results page.
export const quickSearch = async (req, res) => {
    try {

        const q = req.query.q?.trim();

        if (!q) {
            return res.status(200).json([]);
        }

        const videos = await Video.find({
            $or: [
                { title: { $regex: q, $options: "i" } },
                { channel: { $regex: q, $options: "i" } },
                { tags: { $regex: q, $options: "i" } },
            ],
        })
            .select("title thumbnail channel duration")
            .limit(6);

        res.status(200).json(videos);

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= GET ALL VIDEOS =================
export const getVideos = async (req, res) => {
    try {

        const keyword = req.query.search
            ? {
                title: {
                    $regex: req.query.search,
                    $options: "i",
                },
            }
            : {};

        const videos = await Video.find(keyword).populate(
            "user",
            "name email subscribers"
        );

        res.status(200).json(videos);

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

// ================= GET SHORTS (vertical short-form feed) =================
// Logged-in: ranked by the same watch-history/likes/search interest
// profile "Recommended for You" uses — the more a category/tag gets
// watched, the more that kind of Short surfaces. Guests (or a user with
// no history yet) just get a random shuffle, YouTube Shorts-style.
export const getShorts = async (req, res) => {
    try {

        const excludeId = req.query.exclude;

        const filter = { isShort: true };
        if (excludeId) {
            filter._id = { $ne: excludeId };
        }

        if (req.user) {

            const profile = await buildInterestProfile(req.user._id);

            if (profile.hasHistory) {

                const watchedIds = (await User.findById(req.user._id).select("history")).history.map((id) => id.toString());

                const candidates = await Video.find({
                    ...filter,
                    _id: { $nin: excludeId ? [...watchedIds, excludeId] : watchedIds },
                })
                    .populate("user", "name email subscribers")
                    .limit(200);

                const scored = scoreVideosForProfile(candidates, profile);

                // A little shuffle within the top matches so the feed
                // doesn't play the exact same order every single time.
                const top = scored.slice(0, 40).map((s) => s.video);
                for (let i = top.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [top[i], top[j]] = [top[j], top[i]];
                }

                return res.status(200).json(top.slice(0, 25));
            }
        }

        // Random order — guests, or a logged-in user with no watch
        // history/likes/searches yet to personalize from.
        const shorts = await Video.aggregate([
            { $match: filter },
            { $sample: { size: 25 } },
        ]);

        const populated = await Video.populate(shorts, {
            path: "user",
            select: "name email subscribers",
        });

        res.status(200).json(populated);

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

// ================= GET SINGLE VIDEO =================
export const getVideoById = async (req, res) => {
    try {

        const video = await Video.findById(req.params.id).populate(
            "user",
            "name email subscribers"
        );

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found",
            });
        }

        res.status(200).json(video);

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

// Extracts an 11-char YouTube video ID from common URL formats.
// Returns "" for non-YouTube sources (e.g. a Cloudinary file URL),
// which signals VideoPage to use a native <video> player instead.
const extractYoutubeIdFromUrl = (url = "") => {

    try {

        if (url.includes("youtu.be/")) {
            return url.split("youtu.be/")[1].split("?")[0];
        }

        if (url.includes("youtube.com/watch") && url.includes("v=")) {
            return url.split("v=")[1].split("&")[0];
        }

        if (url.includes("youtube.com/shorts/")) {
            return url.split("shorts/")[1].split("?")[0];
        }

    } catch (error) {
        // Malformed URL — fall through to "" (native file playback)
    }

    return "";
};

// ================= ADD VIDEO =================
export const addVideo = async (req, res) => {
    try {

        const {
            title,
            description,
            tags,
            channel,
            thumbnail,
            videoUrl,
            videoId,
            time,
            duration,
            category,
            isShort,
        } = req.body;

        const newVideo = new Video({
            user: req.user._id,
            title,
            description: description || "",
            tags: Array.isArray(tags) ? tags : [],
            channel,
            thumbnail,
            videoUrl,
            // Prefer an explicit videoId (e.g. from the AI YouTube Import
            // flow); otherwise derive it from the URL if it's YouTube,
            // otherwise "" for a native file upload.
            videoId: videoId || extractYoutubeIdFromUrl(videoUrl),
            views: 0,
            likes: 0,
            time,
            duration,
            category,
            isShort: Boolean(isShort),
        });

        await newVideo.save();

        // Notify subscribers that this channel just posted — best-effort,
        // never blocks the upload response if it fails.
        try {

            const uploader = await User.findById(req.user._id).select("subscribers name");

            if (uploader?.subscribers?.length) {
                await Notification.insertMany(
                    uploader.subscribers.map((subscriberId) => ({
                        user: subscriberId,
                        type: "new_upload",
                        message: `${uploader.name} uploaded "${newVideo.title}"`,
                        video: newVideo._id,
                    }))
                );
            }

        } catch (notifyError) {
            console.error("Notify subscribers failed:", notifyError.message);
        }

        res.status(201).json({
            success: true,
            message: "Video Uploaded Successfully",
            video: newVideo,
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

// ================= LIKE VIDEO (toggle, per-user) =================
export const likeVideo = async (req, res) => {
    try {

        const video = await Video.findById(req.params.id);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found",
            });
        }

        // Anonymous/no-auth fallback: keep old increment-only behavior so
        // this route still works without a token, just without per-user
        // toggling or the recommendation signal.
        if (!req.user) {
            video.likes += 1;
            await video.save();
            return res.status(200).json(video);
        }

        const user = await User.findById(req.user._id);
        const alreadyLiked = user.likedVideos.some((id) => id.toString() === video._id.toString());

        if (alreadyLiked) {
            user.likedVideos = user.likedVideos.filter((id) => id.toString() !== video._id.toString());
            video.likes = Math.max(0, video.likes - 1);
        } else {
            user.likedVideos.push(video._id);
            video.likes += 1;
        }

        await user.save();
        await video.save();

        res.status(200).json({ ...video.toObject(), liked: !alreadyLiked });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

// ================= ADD COMMENT (AI-moderated) =================
export const addComment = async (req, res) => {
    try {

        const { username, text } = req.body;

        if (!text?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Comment text is required",
            });
        }

        const video = await Video.findById(req.params.id);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found",
            });
        }

        // AI moderation check runs before anything is persisted.
        // Fails open (flagged: false) on service errors so an AI outage
        // never blocks commenting entirely — see aiService.moderateComment.
        const { flagged, reason } = await moderateComment(text);

        if (flagged) {
            return res.status(400).json({
                success: false,
                blocked: true,
                message:
                    "This comment was blocked by AI moderation" +
                    (reason ? `: ${reason}` : "."),
            });
        }

        video.comments.push({
            username,
            text,
            flagged: false,
        });

        await video.save();

        res.status(200).json(video);

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};
// ================= MY UPLOADS =================
export const getMyVideos = async (req, res) => {
    try {

        const videos = await Video.find({
            user: req.user._id,
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            videos,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

// ================= DELETE VIDEO =================
export const deleteVideo = async (req, res) => {
    try {

        const video = await Video.findById(req.params.id);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found",
            });
        }

        if (video.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized",
            });
        }

        await Video.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Video deleted successfully",
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};


// ================= INCREMENT VIEWS =================
export const incrementViews = async (req, res) => {
    try {

        const video = await Video.findById(req.params.id);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found",
            });
        }

        const currentViews = parseInt(video.views) || 0;

        video.views = currentViews + 1;

        await video.save();

        res.status(200).json({
            success: true,
            views: video.views,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

// ================= CHANNEL VIDEOS =================
export const getChannelVideos = async (req, res) => {
    try {

        const videos = await Video.find({
            user: req.params.userId,
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            videos,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

// ================= CREATOR DASHBOARD =================

export const getDashboard = async (req, res) => {

    try {

        const videos = await Video.find({
            user: req.user._id
        });

        const totalVideos = videos.length;

        const totalLikes = videos.reduce(
            (sum, video) => sum + (video.likes || 0),
            0
        );

        const totalViews = videos.reduce(
            (sum, video) => sum + (Number(video.views) || 0),
            0
        );

        const user = await User.findById(req.user._id);

        const subscribers =
            user?.subscribers?.length || 0;

        res.json({
            success: true,
            totalVideos,
            totalLikes,
            totalViews,
            subscribers,
            videos,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }

};

// ================= RELATED VIDEOS =================
// Actually scores by relatedness now — same category and overlapping
// tags score highest, with a small popularity tiebreaker. This also
// powers VEXA Music's auto-next "radio" continuation.
// Shared scoring used by both the plain "related videos" sidebar and
// the AI next-up candidate pool below — same category + overlapping
// tags score highest, with a small popularity tiebreaker.
const scoreRelatedCandidates = (currentVideo, candidates) => {

    const currentTags = (currentVideo.tags || []).map((t) => t.toLowerCase());

    return candidates.map((video) => {

        let score = 0;

        if (video.category && video.category === currentVideo.category) {
            score += 5;
        }

        const overlap = (video.tags || []).filter((t) =>
            currentTags.includes(t.toLowerCase())
        ).length;
        score += overlap * 2;

        score += Math.min((video.views || 0) / 1000, 3);

        return { video, score };

    }).sort((a, b) => b.score - a.score);

};

export const getRelatedVideos = async (req, res) => {

    try {

        const { id } = req.params;

        const currentVideo = await Video.findById(id);

        if (!currentVideo) {
            return res.status(404).json({
                message: "Video not found",
            });
        }

        const candidates = await Video.find({ _id: { $ne: id } }).limit(200);

        const scored = scoreRelatedCandidates(currentVideo, candidates);

        const relatedVideos = scored.slice(0, 8).map((s) => s.video);

        res.json(relatedVideos);

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }

};

// ================= AI-BASED "UP NEXT" (VEXA Music auto-continue) =================
// The tag/category scoring above generates a reasonable candidate pool
// fast and deterministically — this layer then asks the LLM to actually
// listen to that shortlist (title/tags only, it can't hear audio) and
// pick + order the ones that best continue the mood/style, the same way
// a human curator would sequence a "radio" queue. Falls back to the
// plain scored order if the AI call fails or returns nothing usable.
export const getAiNextTracks = async (req, res) => {

    try {

        const { id } = req.params;

        const currentVideo = await Video.findById(id);

        if (!currentVideo) {
            return res.status(404).json({ success: false, message: "Video not found" });
        }

        const candidates = await Video.find({
            _id: { $ne: id },
            category: currentVideo.category || "Music",
        }).limit(60);

        const scored = scoreRelatedCandidates(currentVideo, candidates);
        const shortlist = scored.slice(0, 20).map((s) => s.video);

        if (shortlist.length === 0) {
            return res.status(200).json({ success: true, tracks: [], source: "none" });
        }

        try {

            const orderedIds = await pickNextTracks(
                { title: currentVideo.title, channel: currentVideo.channel, tags: currentVideo.tags },
                shortlist.map((v) => ({ id: v._id.toString(), title: v.title, channel: v.channel, tags: v.tags }))
            );

            const byId = new Map(shortlist.map((v) => [v._id.toString(), v]));
            const aiOrdered = orderedIds.map((vid) => byId.get(vid)).filter(Boolean);

            if (aiOrdered.length > 0) {
                return res.status(200).json({ success: true, tracks: aiOrdered.slice(0, 8), source: "ai" });
            }

        } catch (aiError) {
            console.error("AI next-up picking failed, using scored fallback:", aiError.message);
        }

        res.status(200).json({ success: true, tracks: shortlist.slice(0, 8), source: "scored" });

    } catch (error) {

        res.status(500).json({ success: false, message: error.message });

    }

};

// ================= INCREASE VIEW =================
const MAX_VIEW_EVENTS = 500;

export const increaseView = async (req, res) => {

    try {

        const video = await Video.findById(req.params.id);

        if (!video) {
            return res.status(404).json({
                message: "Video not found",
            });
        }

        video.views = (parseInt(video.views) || 0) + 1;

        // Cap the recent-events log so it stays cheap to store/query —
        // only the last MAX_VIEW_EVENTS timestamps are kept, which is
        // plenty to compare 24h-vs-24h growth rate.
        video.viewEvents.push(new Date());
        if (video.viewEvents.length > MAX_VIEW_EVENTS) {
            video.viewEvents = video.viewEvents.slice(-MAX_VIEW_EVENTS);
        }

        await video.save();

        res.json({
            success: true,
            views: video.views,
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }

};

// ================= update VIDEO =================
export const updateVideo = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            title,
            category,
            duration,
            time,
            videoUrl,
            isShort,
        } = req.body;

        const video = await Video.findById(id);

        if (!video) {
            return res.status(404).json({
                message: "Video not found",
            });
        }


        if (video.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "Unauthorized",
            });
        }

        video.title = title;
        video.category = category;
        video.duration = duration;
        video.time = time;

        // Only touched when explicitly sent — lets the quick "Mark as
        // Short" toggle flip just this one field without clobbering the
        // rest of the video's data.
        if (isShort !== undefined) {
            video.isShort = Boolean(isShort);
        }

        if (videoUrl && videoUrl !== video.videoUrl) {

            let videoId = "";

            if (videoUrl.includes("youtu.be/")) {
                videoId = videoUrl.split("youtu.be/")[1].split("?")[0];
            } else if (videoUrl.includes("watch?v=")) {
                videoId = videoUrl.split("v=")[1].split("&")[0];
            }

            video.videoUrl = videoUrl;
            video.videoId = videoId;
            video.thumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
        }
        await video.save();

        res.json({
            success: true,
            video,
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }

};

export const getDashboardStats = async (req, res) => {

    try {

        const videos = await Video.find({
            user: req.user._id,
        });

        const totalVideos = videos.length;

        const totalViews = videos.reduce(
            (sum, video) => sum + (video.views || 0),
            0
        );

        const totalLikes = videos.reduce(
            (sum, video) => sum + (video.likes || 0),
            0
        );

        const totalComments = videos.reduce(
            (sum, video) => sum + (video.comments?.length || 0),
            0
        );

        res.json({
            totalVideos,
            totalViews,
            totalLikes,
            totalComments,
        });

    } catch (err) {

        res.status(500).json({
            message: err.message,
        });

    }

};