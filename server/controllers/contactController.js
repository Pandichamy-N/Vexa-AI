import ContactMessage from "../models/ContactMessage.js";
import { sendAdminNotification } from "../services/emailService.js";

// ================= SUBMIT CONTACT / SUPPORT MESSAGE (public) =================
export const submitContactMessage = async (req, res) => {

    try {

        const { name, email, subject, message } = req.body;

        if (
            typeof name !== "string" || !name.trim() ||
            typeof email !== "string" || !email.trim() ||
            typeof subject !== "string" || !subject.trim() ||
            typeof message !== "string" || !message.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Name, email, subject, and message are all required.",
            });
        }

        const contactMessage = await ContactMessage.create({
            user: req.user?._id, // set only if a valid token was sent — this route works for guests too
            name: name.trim().slice(0, 100),
            email: email.trim().toLowerCase().slice(0, 200),
            subject: subject.trim().slice(0, 150),
            message: message.trim().slice(0, 3000),
        });

        // Best-effort — the message is already saved either way, so a
        // failed notification email shouldn't fail the whole request.
        try {
            await sendAdminNotification(contactMessage);
        } catch (emailError) {
            console.error("Contact notification email failed:", emailError.message);
        }

        res.status(201).json({
            success: true,
            message: "Your message has been sent — we'll get back to you soon.",
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }

};
