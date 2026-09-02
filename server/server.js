import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import path from "path";
import playlistRoutes from "./routes/playlistRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import musicRoutes from "./routes/musicRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import { runYoutubeSync } from "./services/syncService.js";
import {
    securityHeaders,
    sanitizeInput,
    apiLimiter,
    authLimiter,
    errorHandler,
    notFoundHandler,
} from "./middleware/security.js";



dotenv.config();

const app = express();

// Connect Database, then automatically pull in fresh videos from YouTube
// in the background — the app has real content without anyone manually
// uploading anything. Non-blocking: the server starts serving requests
// immediately, this just fills the catalog in behind the scenes.
connectDB().then(() => {

    runYoutubeSync()
        .then(({ created, skipped, failed }) => {
            if (created > 0) {
                console.log(`✅ Auto-sync: added ${created} new video(s) from YouTube (${skipped} already existed${failed ? `, ${failed} failed` : ""}).`);
            } else {
                console.log(`ℹ️  Auto-sync: no new videos (${skipped} already up to date).`);
            }
        })
        .catch((error) => {
            console.error("⚠️  Startup YouTube auto-sync failed (non-fatal):", error.message);
        });

});

// Middleware
// CORS — only the app's own frontend(s) can call this API from a
// browser. Falls back to common local dev ports when CLIENT_URL isn't
// set, so this doesn't break local development out of the box.
const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://localhost:3000",
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow same-origin/non-browser requests (curl, mobile apps, etc.)
        // where there's no Origin header at all.
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));

app.use(securityHeaders);
app.use(express.json({ limit: "2mb" })); // caps request body size — blocks payload-flood DoS attempts
app.use(sanitizeInput);
app.use(apiLimiter);

app.use("/uploads", express.static("uploads"));
app.use("/api/upload", uploadRoutes);
app.use("/api/ai", aiRoutes);

// Auth routes get their own tighter rate limit on top of the general one
app.use("/api/auth", authLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/music", musicRoutes);
app.use("/api/contact", contactRoutes);

// Test Route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "🚀 VEXA Backend Running Successfully",
    });
});

// Unmatched routes and unhandled errors — must stay last, after every
// other app.use()/route registration above.
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});