import express from "express";
const router = express.Router();
import { body } from "express-validator";
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
import { validate } from "../middlewares/validate.middleware.js";

const registerValidation = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required"),
    body("email")
        .trim()
        .isEmail()
        .withMessage("Valid email is required"),
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),
];

const loginValidation = [
    body("email")
        .trim()
        .isEmail()
        .withMessage("Valid email is required"),
    body("password")
        .notEmpty()
        .withMessage("Password is required"),
];

const otpValidation = [
    body("email")
        .trim()
        .isEmail()
        .withMessage("Valid email is required"),
    body("otp")
        .trim()
        .matches(/^\d{6}$/)
        .withMessage("OTP must be 6 digits"),
];

const emailOnlyValidation = [
    body("email")
        .trim()
        .isEmail()
        .withMessage("Valid email is required"),
];

const resetPasswordValidation = [
    body("resetToken")
        .notEmpty()
        .withMessage("Reset token is required"),
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),
    body("confirmPassword")
        .custom((value, { req }) => value === req.body.password)
        .withMessage("Password and confirm password do not match"),
];

const refreshValidation = [
    body("refreshToken")
        .notEmpty()
        .withMessage("Refresh token is required"),
];

const googleValidation = [
    body("credential")
        .notEmpty()
        .withMessage("Credential is required"),
];

const updateProfileValidation = [
    body("name")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Name cannot be empty"),
    body("avatar")
        .optional()
        .isString()
        .withMessage("Avatar must be a string"),
];

router.post("/register", authLimiter, registerValidation, validate, register);
router.post("/verify-otp", otpLimiter, otpValidation, validate, verifyOTP);
router.post("/resend-otp", otpLimiter, emailOnlyValidation, validate, resendOTP);
router.post("/login", authLimiter, loginValidation, validate, login);
router.get("/google-client-id", getGoogleClientId);
router.post("/google", googleValidation, validate, googleAuth);
router.post("/forgot-password", otpLimiter, emailOnlyValidation, validate, forgotPassword);
router.post("/verify-reset-otp", otpLimiter, otpValidation, validate, verifyResetOTP);
router.post("/reset-password", authLimiter, resetPasswordValidation, validate, resetPassword);
router.post("/refresh", refreshValidation, validate, refreshToken);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.patch("/update-profile", protect, updateProfileValidation, validate, updateProfile);

export default router;
