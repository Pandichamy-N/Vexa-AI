import User from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import validator from "validator";
import generateToken from "../utils/generateToken.js";
import { sendOtpEmail } from "../services/emailService.js";

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

const generateAndSendOtp = async (user) => {
    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
    user.otpCodeHash = crypto.createHash("sha256").update(code).digest("hex");
    user.otpExpires = new Date(Date.now() + OTP_EXPIRY_MS);
    await user.save();
    await sendOtpEmail(user.email, user.name, code);
};

// ================= REGISTER =================
export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all fields",
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email",
            });
        }

        // Minimum password strength — blocks trivially guessable
        // passwords ("1", "password") that would otherwise sail through.
        if (
            typeof password !== "string" ||
            password.length < 8 ||
            !/[A-Za-z]/.test(password) ||
            !/[0-9]/.test(password)
        ) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters and include both letters and numbers.",
            });
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase().trim(),
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name,
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            emailVerified: false,
        });

        try {
            await generateAndSendOtp(user);
        } catch (emailError) {
            console.error("Failed to send verification email:", emailError.message);
            // Registration still succeeds — they can use "Resend code"
            // once email sending is fixed/configured, rather than
            // losing the account they just created.
        }

        res.status(201).json({
            success: true,
            message: "Verification code sent to your email.",
            requiresVerification: true,
            email: user.email,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ================= VERIFY EMAIL (OTP) =================
export const verifyEmailOtp = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (typeof email !== "string" || typeof code !== "string" || !email || !code) {
            return res.status(400).json({
                success: false,
                message: "Email and code are required",
            });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user || !user.otpCodeHash || !user.otpExpires) {
            return res.status(400).json({
                success: false,
                message: "No pending verification for this email — please register or resend the code.",
            });
        }

        if (user.otpExpires < new Date()) {
            return res.status(400).json({
                success: false,
                message: "This code has expired — please request a new one.",
            });
        }

        const codeHash = crypto.createHash("sha256").update(code).digest("hex");

        if (codeHash !== user.otpCodeHash) {
            return res.status(400).json({
                success: false,
                message: "Incorrect code",
            });
        }

        user.emailVerified = true;
        user.otpCodeHash = undefined;
        user.otpExpires = undefined;
        await user.save();

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: "Email verified",
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ================= RESEND OTP =================
export const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (typeof email !== "string" || !email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        // Same response whether or not the account exists — avoids
        // leaking which emails are registered.
        if (!user || user.emailVerified) {
            return res.status(200).json({
                success: true,
                message: "If that email needs verification, a new code has been sent.",
            });
        }

        await generateAndSendOtp(user);

        res.status(200).json({
            success: true,
            message: "A new code has been sent to your email.",
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ================= LOGIN =================
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim(),
        });

        // Same message whether the email doesn't exist or the password
        // is wrong — telling them apart lets an attacker enumerate which
        // emails have accounts on VEXA.
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        if (!user.emailVerified) {
            return res.status(403).json({
                success: false,
                requiresVerification: true,
                email: user.email,
                message: "Please verify your email before logging in.",
            });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: "Login Successful",
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};