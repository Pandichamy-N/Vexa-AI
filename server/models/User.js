import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
        },
        
        profilePic: {
            type: String,
            default: "",
        },

        avatar: {
            type: String,
            default: "",
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
        watchLater: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video",
            },
        ],
        history: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video",
            },
        ],

        // Videos this user has liked — powers per-user like/unlike toggling
        // and feeds the recommendation engine's interest profile.
        likedVideos: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video",
            },
        ],

        // Separate from likes/watch-later — an explicit "save to favorites"
        // list, toggled from a Favorite button on the video page.
        favorites: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video",
            },
        ],

        // ================= VEXA MUSIC (tracks) =================
        favoriteTracks: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Track",
            },
        ],

        // Capped, most-recent-first. Kept separate from video "history"
        // since it's a different content/data type (Track, not Video).
        recentlyPlayedTracks: [
            {
                track: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Track",
                },
                playedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        // VEXA Music social graph — kept separate from the video-side
        // subscribers/subscriptions above, since following someone's
        // music taste is a distinct relationship from subscribing to
        // their channel.
        musicFollowers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        musicFollowing: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        subscribers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        subscriptions: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        // Onboarding category picks (Spotify/Pinterest-style "pick 3+").
        // Strongly weights the recommendation engine and powers the
        // "Top Picks For You" homepage section.
        interests: {
            type: [String],
            default: [],
        },

        onboardingCompleted: {
            type: Boolean,
            default: false,
        },

        // VEXA Music: Spotify-style "pick your favorite artists" —
        // stores channel names. Powers the "Made For You" AI mix.
        favoriteArtists: {
            type: [String],
            default: [],
        },

        // UI language preference — kept server-side too so it's remembered
        // across devices, not just localStorage.
        language: {
            type: String,
            enum: ["en", "ta", "hi", "ml", "te"],
            default: "en",
        },

        // ================= VEXA MUSIC — PREMIUM =================
        // Real Razorpay integration (payment/verify) sets isPremium once
        // a payment signature has been verified server-side — see
        // paymentController.js. setUserRole/setPremium in userController.js
        // still exist for admin overrides and cancellation.
        isPremium: {
            type: Boolean,
            default: false,
        },

        premiumSince: {
            type: Date,
        },

        // Razorpay payment id from the most recent successful charge —
        // useful for support/refund lookups.
        lastPaymentId: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

export default User;