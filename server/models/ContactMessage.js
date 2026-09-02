import mongoose from "mongoose";

const contactMessageSchema = new mongoose.Schema(
    {
        // Optional — set if the sender was logged in, but the contact
        // form works for guests too (e.g. someone locked out of login).
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },

        subject: {
            type: String,
            required: true,
            trim: true,
        },

        message: {
            type: String,
            required: true,
            trim: true,
        },

        status: {
            type: String,
            enum: ["open", "resolved"],
            default: "open",
        },
    },
    {
        timestamps: true,
    }
);

const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);

export default ContactMessage;
