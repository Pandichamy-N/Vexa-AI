import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

// Both keys come from your Razorpay Dashboard (Settings -> API Keys).
// Test mode keys work immediately with no KYC and no real money — use
// Razorpay's published test UPI ID / test card numbers to try a full,
// real payment flow end-to-end before ever going live.
let razorpayInstance = null;

export const getRazorpay = () => {

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return null;
    }

    if (!razorpayInstance) {
        razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }

    return razorpayInstance;

};
