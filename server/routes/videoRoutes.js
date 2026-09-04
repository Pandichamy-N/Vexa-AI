import express from "express";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";

import {
    getVideos,
    getShorts,
    getVideoById,
    getMyVideos,
    deleteVideo,
    addVideo,
    likeVideo,
    addComment,
    updateVideo,
    incrementViews,
    getChannelVideos,
    getDashboard,
    getRelatedVideos,
    getAiNextTracks,
    increaseView,
    getDashboardStats,
    getTrendingVideos,
    getCategorizedVideos,
    autoFetchVideos,
    autoFetchShorts,
    getLatestVideos,
    getMostViewedVideos,
    getRecommendedVideos,
    getTopPicks,
    getMusicArtists,
    getMusicForYou,
    semanticSearch,
    getMostSearched,
    quickSearch,
} from "../controllers/videoController.js";

const router = express.Router();

// ================= GET ALL VIDEOS =================
router.get("/", getVideos);


// ================= GET RELATED VIDEOS =================
router.get("/related/:id", getRelatedVideos);

// ================= AI "UP NEXT" (VEXA Music auto-continue) =================
router.get("/next-up/:id", protect, getAiNextTracks);

// ================= AI-RANKED TRENDING =================
router.get("/trending", getTrendingVideos);

// ================= VIDEOS GROUPED BY CATEGORY =================
router.get("/categorized", getCategorizedVideos);

// ================= LATEST / MOST VIEWED =================
router.get("/latest", getLatestVideos);
router.get("/most-viewed", getMostViewedVideos);

// ================= AI RECOMMENDATIONS (personalized) =================
router.get("/recommended", protect, getRecommendedVideos);

// ================= TOP PICKS (onboarding interests) =================
router.get("/top-picks", protect, getTopPicks);

// ================= VEXA MUSIC: ARTIST PICKER + MADE FOR YOU =================
router.get("/music-artists", getMusicArtists);
router.get("/music-for-you", protect, getMusicForYou);

// ================= AI SEMANTIC SEARCH =================
router.get("/search", protect, semanticSearch);
router.get("/most-searched", protect, getMostSearched);
router.get("/quick-search", quickSearch);

// ================= AUTO-FETCH FROM YOUTUBE (AI-enriched) =================
router.post("/auto-fetch", protect, autoFetchVideos);

// ================= AUTO-FETCH SHORTS FROM YOUTUBE (search-based) =================
router.post("/auto-fetch-shorts", protect, autoFetchShorts);

// ================= INCREASE VIEW COUNT =================
router.put(
    "/view/:id",
    increaseView
);

// ================= GET DASHBOARD =================
router.get(
    "/dashboard",
    protect,
    getDashboard
);
router.get("/myvideos", protect, getMyVideos);

router.get("/channel/:userId", getChannelVideos);

// ================= SHORTS FEED =================
// Must stay above the "/:id" route below, or "/shorts" would be parsed
// as a video id lookup instead.
router.get("/shorts", optionalAuth, getShorts);

// ================= GET SINGLE VIDEO =================
router.get("/:id", getVideoById);

// ================= UPDATE VIDEO =================
router.put(
    "/:id",
    protect,
    updateVideo
);

// ================= UPLOAD VIDEO =================
router.post("/", protect, addVideo);

// ================= UPDATE VIDEO =================
router.put("/:id", protect, updateVideo);

// ================= LIKE VIDEO =================
router.put("/:id/like", protect, likeVideo);


router.put("/:id/view", incrementViews);


// ================= ADD COMMENT =================
router.post("/:id/comment", protect, addComment);

router.delete("/:id", protect, deleteVideo);

//================= DASHBOARD STATS =================
router.get(
    "/dashboard/stats",
    protect,
    getDashboardStats
);


export default router;