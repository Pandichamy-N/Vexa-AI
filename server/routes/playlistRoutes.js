import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
    createPlaylist,
    getMyPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    deletePlaylist,
} from "../controllers/playlistController.js";

const router = express.Router();

router.post("/", protect, createPlaylist);

router.get("/", protect, getMyPlaylists);

router.get("/:playlistId", protect, getPlaylistById);

router.put(
    "/:playlistId/:videoId",
    protect,
    addVideoToPlaylist
);

router.delete(
    "/:playlistId/:videoId",
    protect,
    removeVideoFromPlaylist
);

// VEXA Music — track-based playlist entries (distinct path segment so
// these never collide with the video routes above)
router.put("/:playlistId/track/:trackId", protect, addTrackToPlaylist);
router.delete("/:playlistId/track/:trackId", protect, removeTrackFromPlaylist);

router.delete("/:playlistId", protect, deletePlaylist);

export default router;
