import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    getSummary,
    suggestTags,
    importFromYoutube,
    askAboutVideo,
    chatbotReply,
    checkComment,
} from "../controllers/aiController.js";

const router = express.Router();

// ================= AI VIDEO SUMMARY =================
// Body: { videoId } (cached) OR { title, description } (ad-hoc)
router.post(
    "/summary",
    protect,
    getSummary
);

// ================= AI UPLOAD SUGGESTIONS (tags/category) =================
// Body: { title, description }
router.post(
    "/suggest-tags",
    protect,
    suggestTags
);

// ================= AI YOUTUBE IMPORT (no manual file upload) =================
// Body: { youtubeUrl }
router.post(
    "/import-youtube",
    protect,
    importFromYoutube
);

// ================= AI VIDEO Q&A =================
// Body: { videoId, question }
router.post(
    "/ask",
    protect,
    askAboutVideo
);

// ================= AI COMMENT MODERATION CHECK =================
// Body: { text }
router.post(
    "/moderate-comment",
    protect,
    checkComment
);

// ================= SITE-WIDE AI CHATBOT =================
// Body: { message, history: [{ role: "user"|"assistant", text }] }
router.post(
    "/chatbot",
    protect,
    chatbotReply
);

export default router;
