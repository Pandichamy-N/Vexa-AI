import mongoose from "mongoose";

// A cached copy of one track's METADATA only — no audio file is ever
// stored here or on our server. Tracks are sourced via YouTube
// embedding — stream-only, download NEVER offered, per YouTube's
// Terms of Service.
const trackSchema = new mongoose.Schema(
    {
        source: {
            type: String,
            enum: ["youtube"],
            required: true,
            default: "youtube",
        },

        youtubeId: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
        },

        title: {
            type: String,
            required: true,
        },

        artist: {
            type: String,
            required: true,
        },

        artistId: {
            type: String,
        },

        album: {
            type: String,
            default: "",
        },

        cover: {
            type: String,
            default: "",
        },

        // Seconds. Not always known for YouTube-sourced tracks (the
        // search endpoint doesn't return it) — 0 means "unknown".
        duration: {
            type: Number,
            default: 0,
        },

        // Unused for YouTube-sourced tracks — playback goes through the
        // YouTube IFrame Player instead (see youtubeId).
        streamUrl: {
            type: String,
            default: "",
        },

        // Never set for YouTube-sourced tracks — download is never
        // offered, per YouTube's Terms of Service.
        downloadUrl: {
            type: String,
            default: "",
        },

        downloadAllowed: {
            type: Boolean,
            default: false,
        },

        // Creative Commons license URL, if ever applicable.
        licenseUrl: {
            type: String,
            default: "",
        },

        genres: {
            type: [String],
            default: [],
        },

        releaseDate: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Track", trackSchema);
