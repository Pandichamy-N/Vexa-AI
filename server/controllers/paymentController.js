import crypto from "crypto";
import User from "../models/User.js";
import { getRazorpay } from "../config/razorpay.js";

const PREMIUM_PRICE_PAISE = 3000; // ₹30.00 — Razorpay amounts are in paise

// ================= CREATE ORDER =================
// Called when the person clicks "Continue to Payment". Creates a real
// Razorpay order (or returns a clear error if no API keys are configured
// yet) — the frontend then opens Razorpay's own checkout with this order,
// which natively offers UPI, cards, netbanking, and wallets.
export const createOrder = async (req, res) => {

    try {

        const razorpay = getRazorpay();

        if (!razorpay) {
            return res.status(503).json({
                success: false,
                message: "Payments aren't configured yet — add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to server/.env",
            });
        }

        const order = await razorpay.orders.create({
            amount: PREMIUM_PRICE_PAISE,
            currency: "INR",
            receipt: `vexa_premium_${req.user._id}_${Date.now()}`,
            notes: {
                userId: req.user._id.toString(),
                plan: "VEXA Premium — Monthly",
            },
        });

        res.status(200).json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
        });

    } catch (error) {

        console.error("Razorpay order creation failed:", error.message);

        res.status(500).json({
            success: false,
            message: "Couldn't start the payment. Try again in a moment.",
        });

    }

};

// ================= VERIFY PAYMENT =================
// Razorpay's checkout returns razorpay_order_id, razorpay_payment_id, and
// razorpay_signature after a successful payment. The signature is an
// HMAC-SHA256 of "order_id|payment_id" signed with your key secret — if
// it doesn't match what we compute here, the payment response was
// tampered with or didn't actually come from Razorpay, so it's rejected.
// This check is what makes the flow real rather than a client-side
// "trust me" toggle.
export const verifyPayment = async (req, res) => {

    try {

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Missing payment verification fields",
            });
        }

        if (!process.env.RAZORPAY_KEY_SECRET) {
            return res.status(503).json({
                success: false,
                message: "Payments aren't configured yet",
            });
        }

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed — signature mismatch",
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                isPremium: true,
                premiumSince: new Date(),
                lastPaymentId: razorpay_payment_id,
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            isPremium: user.isPremium,
        });

    } catch (error) {

        console.error("Payment verification failed:", error.message);

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }

};
