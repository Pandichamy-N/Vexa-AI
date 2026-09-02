import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
    getProfile,
    updateChannelInfo,
    getChannelFollowers,
    getWatchLater,
    addToWatchLater,
    removeFromWatchLater,
    getFavorites,
    toggleFavorite,
    checkFavorite,
    getHistory,
    addToHistory,
    subscribeChannel,
    unsubscribeFromChannel,
    checkSubscription,
    uploadProfilePic,
    updateInterests,
    updateLanguage,
    setPremium,
    updateFavoriteArtists,
} from "../controllers/userController.js";

const router = express.Router();

// Profile
router.get("/profile", protect, getProfile);
router.put("/channel-info", protect, updateChannelInfo);
router.get("/:userId/followers", getChannelFollowers);

// Onboarding interests (Spotify/Pinterest-style category pick)
router.put("/interests", protect, updateInterests);

// VEXA Music: favorite artists (Spotify-style pick)
router.put("/favorite-artists", protect, updateFavoriteArtists);

// UI language preference
router.put("/language", protect, updateLanguage);

// VEXA Music Premium (mock upgrade/downgrade — see userController.js)
router.put("/premium", protect, setPremium);

// Upload Profile Picture
router.put(
    "/profile/upload",
    protect,
    upload.single("profilePic"),
    uploadProfilePic
);

// Watch Later
router.get("/watchlater", protect, getWatchLater);
router.put("/watchlater/:videoId", protect, addToWatchLater);
router.delete("/watchlater/:videoId", protect, removeFromWatchLater);

// Favorites
router.get("/favorites", protect, getFavorites);
router.put("/favorites/:videoId", protect, toggleFavorite);
router.get("/favorites/:videoId", protect, checkFavorite);

router.put("/subscribe/:channelId", protect, subscribeChannel);
router.delete("/subscribe/:channelId", protect, unsubscribeFromChannel);
router.get(
    "/subscribe/:channelId",
    protect,
    checkSubscription
);

// History
router.get("/history", protect, getHistory);
router.put("/history/:videoId", protect, addToHistory);
router.post("/history/:videoId", protect, addToHistory);

export default router;