import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

// ================= GET PROFILE =================
export const getProfile = async (req, res) => {
    try {

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                profilePic: user.profilePic,
                bio: user.bio,
                channelLinks: user.channelLinks,
                role: user.role,
                watchLaterCount: user.watchLater.length,
                historyCount: user.history.length,
                subscriptionsCount: user.subscriptions.length,
                subscribersCount: user.subscribers.length,
                likedCount: user.likedVideos.length,
                favoritesCount: user.favorites.length,
                interests: user.interests,
                onboardingCompleted: user.onboardingCompleted,
                language: user.language,
                isPremium: user.isPremium,
                favoriteArtists: user.favoriteArtists,
                musicFollowersCount: user.musicFollowers.length,
                musicFollowingCount: user.musicFollowing.length,
            },
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

// ================= UPDATE CHANNEL INFO (name, bio, links) =================
export const updateChannelInfo = async (req, res) => {
    try {

        const { name, bio, channelLinks } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (typeof name === "string" && name.trim()) {
            user.name = name.trim();
        }

        if (typeof bio === "string") {
            user.bio = bio.slice(0, 500);
        }

        if (Array.isArray(channelLinks)) {
            // Keep only well-formed, non-empty entries — up to 5, same
            // as YouTube's channel links cap.
            user.channelLinks = channelLinks
                .filter((l) => l && typeof l.url === "string" && l.url.trim())
                .slice(0, 5)
                .map((l) => ({
                    label: (l.label || "").trim().slice(0, 40) || l.url.trim(),
                    url: l.url.trim(),
                }));
        }

        await user.save();

        res.status(200).json({
            success: true,
            user: {
                name: user.name,
                bio: user.bio,
                channelLinks: user.channelLinks,
            },
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

// ================= CHANNEL FOLLOWERS LIST (public) =================
export const getChannelFollowers = async (req, res) => {
    try {

        const channel = await User.findById(req.params.userId)
            .select("subscribers")
            .populate("subscribers", "name profilePic");

        if (!channel) {
            return res.status(404).json({
                success: false,
                message: "Channel not found",
            });
        }

        res.status(200).json({
            success: true,
            followers: channel.subscribers,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

// ================= UPDATE INTERESTS (onboarding) =================
const ALLOWED_INTERESTS = [
    "Education", "Programming", "Gaming", "Music",
    "Technology", "Entertainment", "Sports", "General",
];

export const updateInterests = async (req, res) => {
    try {

        const { interests } = req.body;

        if (!Array.isArray(interests) || interests.length < 3) {
            return res.status(400).json({
                success: false,
                message: "Pick at least 3 categories",
            });
        }

        const cleaned = [...new Set(interests)].filter((i) => ALLOWED_INTERESTS.includes(i));

        if (cleaned.length < 3) {
            return res.status(400).json({
                success: false,
                message: "Pick at least 3 valid categories",
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { interests: cleaned, onboardingCompleted: true },
            { new: true }
        );

        res.status(200).json({
            success: true,
            interests: user.interests,
            onboardingCompleted: user.onboardingCompleted,
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= UPDATE LANGUAGE PREFERENCE =================
export const updateLanguage = async (req, res) => {
    try {

        const { language } = req.body;

        if (!["en", "ta", "hi", "ml", "te"].includes(language)) {
            return res.status(400).json({ success: false, message: "Unsupported language" });
        }

        await User.findByIdAndUpdate(req.user._id, { language });

        res.status(200).json({ success: true, language });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// ================= GET WATCH LATER =================
export const getWatchLater = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("watchLater");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            watchLater: user.watchLater,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ================= ADD TO WATCH LATER =================
export const addToWatchLater = async (req, res) => {
    try {
        const { videoId } = req.params;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const exists = user.watchLater.some(
            (id) => id.toString() === videoId
        );

        if (exists) {
            return res.status(400).json({
                success: false,
                message: "Video already in Watch Later",
            });
        }

        user.watchLater.push(videoId);

        await user.save();

        res.status(200).json({
            success: true,
            message: "Added to Watch Later",
            watchLater: user.watchLater,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ================= REMOVE FROM WATCH LATER =================
export const removeFromWatchLater = async (req, res) => {
    try {
        const { videoId } = req.params;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        user.watchLater = user.watchLater.filter(
            (id) => id.toString() !== videoId
        );

        await user.save();

        res.status(200).json({
            success: true,
            message: "Removed from Watch Later",
            watchLater: user.watchLater,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ================= FAVORITES =================
export const getFavorites = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("favorites");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            favorites: user.favorites,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Toggle — one endpoint adds or removes depending on current state, which
// is what the Favorite button on the video page calls.
export const toggleFavorite = async (req, res) => {
    try {
        const { videoId } = req.params;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const exists = user.favorites.some(
            (id) => id.toString() === videoId
        );

        if (exists) {
            user.favorites = user.favorites.filter(
                (id) => id.toString() !== videoId
            );
        } else {
            user.favorites.push(videoId);
        }

        await user.save();

        res.status(200).json({
            success: true,
            favorited: !exists,
            favorites: user.favorites,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const checkFavorite = async (req, res) => {
    try {
        const { videoId } = req.params;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const favorited = user.favorites.some(
            (id) => id.toString() === videoId
        );

        res.status(200).json({
            success: true,
            favorited,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ================= ADD TO HISTORY =================
export const addToHistory = async (req, res) => {
    try {
        const { videoId } = req.params;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        user.history = user.history.filter(
            (id) => id.toString() !== videoId
        );

        user.history.unshift(videoId);

        await user.save();

        res.status(200).json({
            success: true,
            message: "Added to History",
            history: user.history,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ================= GET HISTORY =================
export const getHistory = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("history");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            history: user.history,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ================= SUBSCRIBE =================
export const subscribeChannel = async (req, res) => {
    try {
        const { channelId } = req.params;

        if (req.user._id.toString() === channelId) {
            return res.status(400).json({
                success: false,
                message: "You cannot subscribe to yourself",
            });
        }

        const user = await User.findById(req.user._id);
        const channel = await User.findById(channelId);

        if (!channel) {
            return res.status(404).json({
                success: false,
                message: "Channel not found",
            });
        }

        if (user.subscriptions.some((id) => id.toString() === channelId)) {
            return res.status(400).json({
                success: false,
                message: "Already subscribed",
            });
        }

        user.subscriptions.push(channelId);
        channel.subscribers.push(user._id);

        await user.save();
        await channel.save();

        res.status(200).json({
            success: true,
            message: "Subscribed successfully",
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ================= UNSUBSCRIBE =================
export const unsubscribeFromChannel = async (req, res) => {
    try {
        const { channelId } = req.params;

        const user = await User.findById(req.user._id);
        const channel = await User.findById(channelId);

        if (!channel) {
            return res.status(404).json({
                success: false,
                message: "Channel not found",
            });
        }

        user.subscriptions = user.subscriptions.filter(
            (id) => id.toString() !== channelId
        );

        channel.subscribers = channel.subscribers.filter(
            (id) => id.toString() !== req.user._id.toString()
        );

        await user.save();
        await channel.save();

        res.status(200).json({
            success: true,
            message: "Unsubscribed successfully",
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ================= CHECK SUBSCRIPTION =================
export const checkSubscription = async (req, res) => {
    try {
        const { channelId } = req.params;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const subscribed = user.subscriptions.some(
            (id) => id.toString() === channelId
        );

        res.status(200).json({
            success: true,
            subscribed,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const uploadProfilePic = async (req, res) => {

    try {

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded",
            });
        }

        // Cloudinary instead of local disk — most cloud hosts (Render,
        // Railway, etc.) wipe local files on every redeploy/restart, so
        // profile pictures saved to disk would randomly disappear in
        // production. Cloudinary storage persists regardless of deploys.
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "vexa-profile-pics",
            resource_type: "image",
        });

        fs.unlinkSync(req.file.path); // clean up the temp local copy

        user.profilePic = result.secure_url;

        await user.save();

        res.json({
            success: true,
            profilePic: user.profilePic,
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message,
        });

    }

};
// ================= VEXA MUSIC PREMIUM (mock — no payment gateway) =================
// Sets the premium flag directly. There's no Stripe/payment integration
// here — this is the subscription *state machine* (what actually gates
// ads off), ready to be triggered by a real payment webhook later.
export const setPremium = async (req, res) => {
    try {

        const { isPremium } = req.body;

        const update = { isPremium: Boolean(isPremium) };

        if (isPremium) {
            update.premiumSince = new Date();
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            update,
            { new: true }
        );

        res.status(200).json({
            success: true,
            isPremium: user.isPremium,
            premiumSince: user.premiumSince,
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= VEXA MUSIC: FAVORITE ARTISTS (Spotify-style pick) =================
export const updateFavoriteArtists = async (req, res) => {
    try {

        const { artists } = req.body;

        if (!Array.isArray(artists) || artists.length < 3) {
            return res.status(400).json({
                success: false,
                message: "Pick at least 3 artists",
            });
        }

        const cleaned = [...new Set(artists.map((a) => a.trim()).filter(Boolean))];

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { favoriteArtists: cleaned },
            { new: true }
        );

        res.status(200).json({
            success: true,
            favoriteArtists: user.favoriteArtists,
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
