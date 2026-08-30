import express from "express";
import { registerUser, loginUser, verifyEmailOtp, resendOtp } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-email", verifyEmailOtp);
router.post("/resend-otp", resendOtp);

export default router;