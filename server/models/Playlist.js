import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        videos: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video",
            },
        ],

        // VEXA Music playlists hold Track refs instead — kept as a
        // separate array (not mixed into `videos`) since they're a
        // different content type with different licensing.
        tracks: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Track",
            },
        ],
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Playlist", playlistSchema);