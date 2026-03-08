import express from "express";
const router = express.Router();
import {
    register,
    verifyOTP,
    resendOTP,
    login,
    googleAuth,
    getGoogleClientId,
    forgotPassword,
    verifyResetOTP,
    resetPassword,
    refreshToken,
    logout,
    getMe,
    updateProfile,
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import {
    authLimiter,
    otpLimiter,
} from "../middlewares/rateLimit.middleware.js";

router.post("/register", authLimiter, register);
router.post("/verify-otp", otpLimiter, verifyOTP);
router.post("/resend-otp", otpLimiter, resendOTP);
router.post("/login", authLimiter, login);
router.get("/google-client-id", getGoogleClientId);
router.post("/google", googleAuth);
router.post("/forgot-password", otpLimiter, forgotPassword);
router.post("/verify-reset-otp", otpLimiter, verifyResetOTP);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/refresh", refreshToken);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.patch("/update-profile", protect, updateProfile);

export default router;
