import express from "express";
import { submitContactMessage } from "../controllers/contactController.js";
import { optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public — works for guests too, not just logged-in users (someone
// locked out of their account still needs to be able to reach support).
router.post("/", optionalAuth, submitContactMessage);

export default router;
