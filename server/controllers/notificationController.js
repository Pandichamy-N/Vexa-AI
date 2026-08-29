import Notification from "../models/Notification.js";

// ================= GET MY NOTIFICATIONS =================
export const getMyNotifications = async (req, res) => {
    try {

        const notifications = await Notification.find({ user: req.user._id })
            .populate("video", "title thumbnail")
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({
            user: req.user._id,
            read: false,
        });

        res.status(200).json({
            success: true,
            notifications,
            unreadCount,
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= MARK ONE AS READ =================
export const markNotificationRead = async (req, res) => {
    try {

        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        res.status(200).json({ success: true, notification });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ================= MARK ALL AS READ =================
export const markAllNotificationsRead = async (req, res) => {
    try {

        await Notification.updateMany(
            { user: req.user._id, read: false },
            { read: true }
        );

        res.status(200).json({ success: true });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
