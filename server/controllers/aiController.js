import Video from "../models/Video.js";
import {
    generateSummary,
    generateUploadSuggestions,
    generateVideoDescription,
    chatWithAssistant,
    answerVideoQuestion,
    moderateComment,
} from "../services/aiService.js";
import { fetchYoutubeMetadata } from "../services/youtubeService.js";

// ================= AI VIDEO SUMMARY =================
// Accepts either { videoId } (preferred — result is cached on the video
// so it's only generated once) or { title, description } (used when the
// video doesn't exist yet, e.g. a live preview). Pass { force: true }
// to bypass the cache and regenerate.
export const getSummary = async (req, res) => {

    try {

        const { videoId, title, description, force } = req.body;

        // ----- Case 1: existing video, cache-aware -----
        if (videoId) {

            const video = await Video.findById(videoId);

            if (!video) {
                return res.status(404).json({
                    success: false,
                    message: "Video not found",
                });
            }

            if (!force && video.aiSummary?.length) {
                return res.status(200).json({
                    success: true,
                    cached: true,
                    summary: video.aiSummary,
                    keyConcepts: video.aiKeyConcepts,
                    tags: video.aiTags,
                    difficulty: video.aiDifficulty,
                });
            }

            const result = await generateSummary(video.title, video.description);

            video.aiSummary = result.summary;
            video.aiKeyConcepts = result.keyConcepts;
            video.aiTags = result.tags;
            video.aiDifficulty = result.difficulty;
            video.aiSummaryGeneratedAt = new Date();

            await video.save();

            return res.status(200).json({
                success: true,
                cached: false,
                ...result,
            });
        }

        // ----- Case 2: no video yet, generate ad-hoc (not persisted) -----
        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: "Provide either videoId, or title and description",
            });
        }

        const result = await generateSummary(title, description);

        res.status(200).json({
            success: true,
            cached: false,
            ...result,
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message:
                typeof error.response?.data?.error?.message === "string"
                    ? error.response.data.error.message
                    : typeof error.message === "string"
                        ? error.message
                        : "Something went wrong.",
        });

    }

};

// ================= AI UPLOAD SUGGESTIONS (tags/category) =================
export const suggestTags = async (req, res) => {

    try {

        const { title, description } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Title is required",
            });
        }

        const suggestions = await generateUploadSuggestions(title, description);

        res.status(200).json({
            success: true,
            ...suggestions,
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message:
                typeof error.response?.data?.error?.message === "string"
                    ? error.response.data.error.message
                    : typeof error.message === "string"
                        ? error.message
                        : "Something went wrong.",
        });

    }

};

// ================= AI YOUTUBE IMPORT (upload without manual files) =================
// Given a YouTube link, pulls real metadata (title/channel/thumbnail) via
// oEmbed — no API key needed — then has AI draft a description and
// suggest a category + tags. Nothing is persisted here; the client shows
// an editable preview and the creator publishes via the normal addVideo
// endpoint once they're happy with it.
export const importFromYoutube = async (req, res) => {

    try {

        const { youtubeUrl } = req.body;

        if (!youtubeUrl?.trim()) {
            return res.status(400).json({
                success: false,
                message: "A YouTube link is required",
            });
        }

        const meta = await fetchYoutubeMetadata(youtubeUrl);

        const [description, suggestions] = await Promise.all([
            generateVideoDescription(meta.title, meta.channel),
            generateUploadSuggestions(meta.title, ""),
        ]);

        res.status(200).json({
            success: true,
            videoId: meta.videoId,
            videoUrl: meta.videoUrl,
            title: meta.title,
            channel: meta.channel,
            thumbnail: meta.thumbnail,
            description,
            category: suggestions.category,
            tags: suggestions.tags,
        });

    } catch (error) {

        console.error(error);

        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "AI import failed",
        });

    }

};

// ================= AI VIDEO Q&A =================
export const askAboutVideo = async (req, res) => {

    try {

        const { videoId, question } = req.body;

        if (!videoId || !question?.trim()) {
            return res.status(400).json({
                success: false,
                message: "videoId and question are required",
            });
        }

        const video = await Video.findById(videoId);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found",
            });
        }

        const answer = await answerVideoQuestion(
            {
                title: video.title,
                description: video.description,
                summary: video.aiSummary,
            },
            question
        );

        res.status(200).json({
            success: true,
            answer,
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message:
                typeof error.response?.data?.error?.message === "string"
                    ? error.response.data.error.message
                    : typeof error.message === "string"
                        ? error.message
                        : "Something went wrong.",
        });

    }

};

// ================= SITE-WIDE AI CHATBOT =================
export const chatbotReply = async (req, res) => {

    try {

        const { message, history } = req.body;

        if (!message?.trim()) {
            return res.status(400).json({
                success: false,
                message: "A message is required",
            });
        }

        // Small grounding set so the assistant can recommend real videos
        // instead of inventing titles.
        const videos = await Video.find({})
            .select("title category channel")
            .sort({ createdAt: -1 })
            .limit(25);

        const reply = await chatWithAssistant(
            message,
            Array.isArray(history) ? history : [],
            videos
        );

        res.status(200).json({
            success: true,
            reply,
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message:
                typeof error.response?.data?.error?.message === "string"
                    ? error.response.data.error.message
                    : typeof error.message === "string"
                        ? error.message
                        : "Something went wrong.",
        });

    }

};

// ================= AI COMMENT MODERATION (standalone check) =================
// Exposed mainly so the client can pre-check text if ever needed; the
// authoritative check also runs server-side inside addComment.
export const checkComment = async (req, res) => {

    try {

        const { text } = req.body;

        if (!text?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Text is required",
            });
        }

        const result = await moderateComment(text);

        res.status(200).json({
            success: true,
            ...result,
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message:
                typeof error.response?.data?.error?.message === "string"
                    ? error.response.data.error.message
                    : typeof error.message === "string"
                        ? error.message
                        : "Something went wrong.",
        });

    }

};
