import axios from "axios";

// Sends mail via Brevo's HTTP API (not SMTP). Render's free tier blocks
// outbound traffic on SMTP ports 25/465/587 as of Sept 2025, so
// nodemailer + Gmail SMTP can never connect from there — this call
// goes out over plain HTTPS (443) instead, which isn't blocked.
// EMAIL_USER must be verified as a "Sender" in the Brevo dashboard
// first (Senders, Domains & Dedicated IPs -> Senders -> Add a sender).
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export const sendOtpEmail = async (toEmail, name, code) => {

    if (!process.env.BREVO_API_KEY || !process.env.EMAIL_USER) {
        console.warn("BREVO_API_KEY / EMAIL_USER not set — verification emails will not be sent.");
        throw new Error("Email sending isn't configured on the server yet.");
    }

    await axios.post(
        BREVO_API_URL,
        {
            sender: { name: "VEXA", email: process.env.EMAIL_USER },
            to: [{ email: toEmail, name: name || undefined }],
            subject: "Your VEXA verification code",
            htmlContent: `
                <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
                    <h2 style="color:#3B82F6;">VEXA</h2>
                    <p>Hi ${name || "there"},</p>
                    <p>Your verification code is:</p>
                    <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px;">${code}</p>
                    <p>This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
                </div>
            `,
        },
        {
            headers: {
                "api-key": process.env.BREVO_API_KEY,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            timeout: 10000,
        }
    );

};
