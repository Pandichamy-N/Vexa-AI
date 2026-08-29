import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        // Video Description (used by AI features for context)
        description: {
            type: String,
            default: "",
            trim: true,
        },

        // Manual/AI-accepted tags
        tags: {
            type: [String],
            default: [],
        },

        channel: {
            type: String,
            required: true,
            trim: true,
        },

        thumbnail: {
            type: String,
            required: true,
        },

        videoUrl: {
            type: String,
            required: true,
        },

        videoId: {
            type: String,
            default: "",
        },

        // Total Views
        views: {
            type: Number,
            default: 0,
        },

        // Recent view timestamps (capped) — powers trending growth-rate.
        // Not a full analytics log, just enough recent history to compare
        // "views in the last 24h" vs the 24h before that.
        viewEvents: {
            type: [Date],
            default: [],
        },

        // Uploaded Time
        time: {
            type: String,
            required: true,
        },

        // Video Duration (Example: 10:35)
        duration: {
            type: String,
            default: "0:00",
        },

        // Video Category
        category: {
            type: String,
            default: "General",
        },

        // Short-form vertical video (YouTube Shorts-style) — flagged at
        // upload time so the Shorts feed can pull just these instead of
        // filtering every video's duration string on every request.
        isShort: {
            type: Boolean,
            default: false,
        },

        // Likes
        likes: {
            type: Number,
            default: 0,
        },

        // Comments
        comments: [
            {
                username: {
                    type: String,
                    required: true,
                },

                text: {
                    type: String,
                    required: true,
                },

                // Set by the AI moderation check before a comment is saved
                flagged: {
                    type: Boolean,
                    default: false,
                },

                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        // ================= AI FEATURES =================

        // Cached AI-generated summary (5 bullet points)
        aiSummary: {
            type: [String],
            default: [],
        },

        // Cached AI-extracted key concepts
        aiKeyConcepts: {
            type: [String],
            default: [],
        },

        // Cached AI-suggested tags
        aiTags: {
            type: [String],
            default: [],
        },

        // Cached AI-estimated difficulty level
        aiDifficulty: {
            type: String,
            enum: ["", "Beginner", "Intermediate", "Advanced"],
            default: "",
        },

        // When the cached AI summary was last generated
        aiSummaryGeneratedAt: {
            type: Date,
        },

        // ================= AI TRENDING =================

        // Cached algorithmic trending score (recomputed each /trending request)
        trendingScore: {
            type: Number,
            default: 0,
        },

        // Cached AI-written one-line "why it's trending" note — only
        // generated for the current top videos, refreshed periodically
        trendingInsight: {
            type: String,
            default: "",
        },

        trendingInsightGeneratedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Video", videoSchema);