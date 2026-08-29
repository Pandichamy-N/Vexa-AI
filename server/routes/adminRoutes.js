import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import {
    getAdminOverview,
    getAllUsers,
    setUserRole,
    deleteUser,
    getAllVideosForAdmin,
    adminDeleteVideo,
    adminUpdateVideoCategory,
    getSyncChannels,
    addSyncChannel,
    toggleSyncChannel,
    removeSyncChannel,
    triggerSync,
} from "../controllers/adminController.js";

const router = express.Router();

// Every route here requires a valid token AND an admin role.
router.use(protect, adminOnly);

router.get("/overview", getAdminOverview);

router.get("/users", getAllUsers);
router.put("/users/:id/role", setUserRole);
router.delete("/users/:id", deleteUser);

router.get("/videos", getAllVideosForAdmin);
router.delete("/videos/:id", adminDeleteVideo);
router.put("/videos/:id/category", adminUpdateVideoCategory);

router.get("/sync-channels", getSyncChannels);
router.post("/sync-channels", addSyncChannel);
router.put("/sync-channels/:id/toggle", toggleSyncChannel);
router.delete("/sync-channels/:id", removeSyncChannel);
router.post("/sync-now", triggerSync);

export default router;
