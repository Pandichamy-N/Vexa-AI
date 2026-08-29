import mongoose from "mongoose";

// Admin-managed list of YouTube channels the auto-sync pulls from.
// Falls back to defaults in syncService.js if this collection is empty.
const syncChannelSchema = new mongoose.Schema(
    {
        channelId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        label: {
            type: String,
            default: "",
            trim: true,
        },

        fallbackCategory: {
            type: String,
            default: "General",
        },

        active: {
            type: Boolean,
            default: true,
        },

        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("SyncChannel", syncChannelSchema);
