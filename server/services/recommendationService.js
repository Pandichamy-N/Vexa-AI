import User from "../models/User.js";
import Video from "../models/Video.js";
import SearchLog from "../models/SearchLog.js";

// How much recent history/likes/searches to consider — keeps this fast
// and keeps very old activity from dominating current interests.
const HISTORY_LIMIT = 40;
const LIKES_LIMIT = 40;
const SEARCH_LIMIT = 20;

// Builds a simple content-based interest profile: how often each
// category/tag shows up across the user's recent watch history, likes,
// and searches. This is the same family of approach real recommendation
// systems use as a baseline layer (before deeper collaborative-filtering
// or embedding-based models) — deterministic, fast, and explainable.
export const buildInterestProfile = async (userId) => {

    const user = await User.findById(userId)
        .select("history likedVideos interests")
        .populate({ path: "history", options: { limit: HISTORY_LIMIT, sort: { createdAt: -1 } }, select: "category tags" })
        .populate({ path: "likedVideos", options: { limit: LIKES_LIMIT, sort: { createdAt: -1 } }, select: "category tags" });

    const recentSearches = await SearchLog.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(SEARCH_LIMIT)
        .select("normalizedQuery expandedKeywords");

    const categoryWeight = {};
    const tagWeight = {};

    const addSignal = (video, weight) => {
        if (!video) return;
        if (video.category) {
            categoryWeight[video.category] = (categoryWeight[video.category] || 0) + weight;
        }
        (video.tags || []).forEach((tag) => {
            const key = tag.toLowerCase();
            tagWeight[key] = (tagWeight[key] || 0) + weight;
        });
    };

    // Onboarding picks are an explicit, strong signal — weighted well
    // above a single view, since the user deliberately chose these.
    (user?.interests || []).forEach((category) => {
        categoryWeight[category] = (categoryWeight[category] || 0) + 6;
    });

    (user?.history || []).forEach((v) => addSignal(v, 1));
    (user?.likedVideos || []).forEach((v) => addSignal(v, 2)); // likes signal interest more strongly than a view

    const searchKeywords = new Set();
    recentSearches.forEach((log) => {
        searchKeywords.add(log.normalizedQuery);
        (log.expandedKeywords || []).forEach((k) => searchKeywords.add(k.toLowerCase()));
    });

    const hasHistory =
        (user?.history?.length || 0) +
        (user?.likedVideos?.length || 0) +
        (user?.interests?.length || 0) > 0;

    return { categoryWeight, tagWeight, searchKeywords, hasHistory };

};

// Scores a list of candidate videos against an interest profile. Higher
// is more relevant. Combines category/tag overlap with a light trending
// boost so recommendations aren't purely an echo chamber of old interests.
export const scoreVideosForProfile = (videos, profile, trendingScoreById = {}) => {

    return videos.map((video) => {

        let score = 0;

        if (video.category && profile.categoryWeight[video.category]) {
            score += profile.categoryWeight[video.category] * 3;
        }

        (video.tags || []).forEach((tag) => {
            const key = tag.toLowerCase();
            if (profile.tagWeight[key]) {
                score += profile.tagWeight[key] * 2;
            }
            if (profile.searchKeywords.has(key)) {
                score += 4;
            }
        });

        // Small trending boost so ties lean toward what's currently hot
        const trendingBoost = trendingScoreById[video._id.toString()] || 0;
        score += Math.min(trendingBoost, 5);

        return { video, score };

    }).sort((a, b) => b.score - a.score);

};
