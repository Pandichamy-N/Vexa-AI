import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    searchMusic,
    getMusicNextTracks,
    toggleFavoriteTrack,
    checkFavoriteTrack,
    getFavoriteTracks,
    recordRecentlyPlayed,
    getRecentlyPlayed,
    toggleFollowMusicUser,
    getMusicProfile,
    getMusicFollowers,
    getMusicFollowing,
} from "../controllers/musicController.js";

const router = express.Router();

// ================= CATALOG (public reads) =================
router.get("/search", searchMusic);
router.get("/next-up/:id", protect, getMusicNextTracks);

// ================= FAVORITES =================
router.get("/favorites", protect, getFavoriteTracks);
router.put("/favorites/:trackId", protect, toggleFavoriteTrack);
router.get("/favorites/:trackId/check", protect, checkFavoriteTrack);

// ================= RECENTLY PLAYED =================
router.get("/recently-played", protect, getRecentlyPlayed);
router.post("/recently-played/:trackId", protect, recordRecentlyPlayed);

// ================= SOCIAL (Follow) =================
router.get("/profile/:userId", protect, getMusicProfile);
router.put("/follow/:userId", protect, toggleFollowMusicUser);
router.get("/followers/:userId", protect, getMusicFollowers);
router.get("/following/:userId", protect, getMusicFollowing);

export default router;
