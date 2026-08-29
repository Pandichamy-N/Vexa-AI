import User from "../models/User.js";
import Video from "../models/Video.js";
import SyncChannel from "../models/SyncChannel.js";
import { runYoutubeSync } from "../services/syncService.js";

// ================= OVERVIEW STATS =================
export const getAdminOverview = async (req, res) => {
    try {

        const [userCount, videoCount, totalViewsAgg, totalLikesAgg] = await Promise.all([
            User.countDocuments({}),
            Video.countDocuments({}),
            Video.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]),
            Video.aggregate([{ $group: { _id: null, total: { $sum: "$likes" } } }]),
        ]);

        res.status(200).json({
            success: true,
            userCount,
            videoCount,
            totalViews: totalViewsAgg[0]?.total || 0,
            totalLikes: totalLikesAgg[0]?.total || 0,
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= USERS =================
export const getAllUsers = async (req, res) => {
    try {

        const users = await User.find({}).select("-password").sort({ createdAt: -1 });

        res.status(200).json({ success: true, users });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const setUserRole = async (req, res) => {
    try {

        const { role } = req.body;

        if (!["user", "admin"].includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role" });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, user });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {

        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: "You can't delete your own account here" });
        }

        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, message: "User deleted" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= VIDEOS (admin can manage any video) =================
export const getAllVideosForAdmin = async (req, res) => {
    try {

        const videos = await Video.find({})
            .populate("user", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, videos });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const adminDeleteVideo = async (req, res) => {
    try {

        const video = await Video.findByIdAndDelete(req.params.id);

        if (!video) {
            return res.status(404).json({ success: false, message: "Video not found" });
        }

        res.status(200).json({ success: true, message: "Video deleted" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const adminUpdateVideoCategory = async (req, res) => {
    try {

        const { category } = req.body;

        const video = await Video.findByIdAndUpdate(
            req.params.id,
            { category },
            { new: true }
        );

        if (!video) {
            return res.status(404).json({ success: false, message: "Video not found" });
        }

        res.status(200).json({ success: true, video });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= SYNC CHANNELS (automatic fetching config) =================
export const getSyncChannels = async (req, res) => {
    try {

        const channels = await SyncChannel.find({}).sort({ createdAt: -1 });

        res.status(200).json({ success: true, channels });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addSyncChannel = async (req, res) => {
    try {

        const { channelId, label, fallbackCategory } = req.body;

        if (!channelId?.trim()) {
            return res.status(400).json({ success: false, message: "channelId is required" });
        }

        const channel = await SyncChannel.create({
            channelId: channelId.trim(),
            label: label || "",
            fallbackCategory: fallbackCategory || "General",
            addedBy: req.user._id,
        });

        res.status(201).json({ success: true, channel });

    } catch (error) {

        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "That channel is already in the list" });
        }

        res.status(500).json({ success: false, message: error.message });

    }
};

export const toggleSyncChannel = async (req, res) => {
    try {

        const channel = await SyncChannel.findById(req.params.id);

        if (!channel) {
            return res.status(404).json({ success: false, message: "Channel not found" });
        }

        channel.active = !channel.active;
        await channel.save();

        res.status(200).json({ success: true, channel });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const removeSyncChannel = async (req, res) => {
    try {

        const channel = await SyncChannel.findByIdAndDelete(req.params.id);

        if (!channel) {
            return res.status(404).json({ success: false, message: "Channel not found" });
        }

        res.status(200).json({ success: true, message: "Channel removed" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= TRIGGER SYNC MANUALLY =================
export const triggerSync = async (req, res) => {
    try {

        const result = await runYoutubeSync();

        res.status(200).json({ success: true, ...result });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
