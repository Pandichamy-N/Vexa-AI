import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        // Who this notification is for
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        type: {
            type: String,
            enum: ["new_upload", "system"],
            default: "new_upload",
        },

        message: {
            type: String,
            required: true,
        },

        video: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
        },

        read: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Notification", notificationSchema);
