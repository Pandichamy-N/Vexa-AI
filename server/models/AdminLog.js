import mongoose from "mongoose";

// Every sensitive admin action (role change, user delete, video delete)
// gets a row here — who did it, to whom/what, and when. This is what
// turns "an admin *can* touch user data" into "we can see exactly who
// touched what", which matters a lot once more than one admin account
// exists. Nothing here is exposed outside the admin-only routes.
const adminLogSchema = new mongoose.Schema(
    {
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        action: {
            type: String,
            required: true,
            enum: [
                "role_change",
                "user_delete",
                "video_delete",
                "video_category_change",
                "sync_channel_add",
                "sync_channel_remove",
                "sync_channel_toggle",
                "manual_sync_trigger",
            ],
        },

        // Free-form snapshot of what changed — kept small (ids + labels,
        // never full documents) since this is an audit trail, not a
        // backup.
        target: {
            type: String, // human-readable label, e.g. a user's email or a video's title
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        details: {
            type: String,
        },

        ip: {
            type: String,
        },
    },
    { timestamps: true }
);

adminLogSchema.index({ createdAt: -1 });

export default mongoose.model("AdminLog", adminLogSchema);
