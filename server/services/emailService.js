import nodemailer from "nodemailer";

// Sends mail using a Gmail account (App Password, not the regular
// login password — see .env.example for how to generate one). Any
// other SMTP provider works too by changing the transport config below.
let transporter = null;

const getTransporter = () => {

    if (transporter) return transporter;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
        console.warn("EMAIL_USER / EMAIL_APP_PASSWORD not set — verification emails will not be sent.");
        return null;
    }

    transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD,
        },
    });

    return transporter;
};

export const sendOtpEmail = async (toEmail, name, code) => {

    const mailer = getTransporter();

    if (!mailer) {
        throw new Error("Email sending isn't configured on the server yet.");
    }

    await mailer.sendMail({
        from: `"VEXA" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: "Your VEXA verification code",
        html: `
            <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
                <h2 style="color:#3B82F6;">VEXA</h2>
                <p>Hi ${name || "there"},</p>
                <p>Your verification code is:</p>
                <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px;">${code}</p>
                <p>This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
            </div>
        `,
    });

};
