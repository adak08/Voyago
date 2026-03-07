import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/user.model.js";
import OTP from "../models/otp.model.js";
import { generateOTP } from "../utils/otpGenerator.js";
import {
    sendOTPEmail,
    sendPasswordResetOTPEmail,
} from "../services/email.service.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @GET /api/auth/google-client-id
export const getGoogleClientId = async (req, res, next) => {
    try {
        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(503).json({
                success: false,
                message: "Google auth is not configured on server",
            });
        }

        res.json({ success: true, clientId: process.env.GOOGLE_CLIENT_ID });
    } catch (err) {
        next(err);
    }
};

// Generate tokens
const generateTokens = (userId, name) => {
    const accessToken = jwt.sign({ id: userId, name }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || "15m",
    });
    const refreshToken = jwt.sign(
        { id: userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d" }
    );
    return { accessToken, refreshToken };
};

// @POST /api/auth/register
export const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        const existing = await User.findOne({ email });
        if (existing) {
            return res
                .status(409)
                .json({ success: false, message: "Email already registered" });
        }

        const user = await User.create({
            name,
            email,
            password,
            authProvider: "local",
        });

        // Generate and send OTP
        const otp = generateOTP();
        await OTP.deleteMany({ email, purpose: "signup" }); // clear old OTPs
        await OTP.create({ email, otp, purpose: "signup" });
        console.log(`OTP for ${email}: ${otp}`);
        await sendOTPEmail(email, name, otp);

        res.status(201).json({
            success: true,
            message:
                "Registration successful. Please verify your email with the OTP sent.",
            userId: user._id,
        });
    } catch (err) {
        next(err);
    }
};

// @POST /api/auth/verify-otp
export const verifyOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        const otpDoc = await OTP.findOne({
            email,
            otp,
            verified: false,
            purpose: "signup",
        });
        if (!otpDoc) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid or expired OTP" });
        }

        if (otpDoc.expiresAt < new Date()) {
            return res
                .status(400)
                .json({ success: false, message: "OTP expired" });
        }

        await User.findOneAndUpdate({ email }, { isVerified: true });
        await OTP.findByIdAndUpdate(otpDoc._id, { verified: true });

        const user = await User.findOne({ email });
        const { accessToken, refreshToken } = generateTokens(
            user._id,
            user.name
        );

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        res.json({
            success: true,
            message: "Email verified successfully",
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
            },
        });
    } catch (err) {
        next(err);
    }
};

// @POST /api/auth/resend-otp
export const resendOTP = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user)
            return res
                .status(404)
                .json({ success: false, message: "User not found" });

        const otp = generateOTP();
        await OTP.deleteMany({ email, purpose: "signup" });
        await OTP.create({ email, otp, purpose: "signup" });
        try {
            await sendOTPEmail(email, user.name, otp);
        } catch (error) {
            if (process.env.NODE_ENV === "development") {
                console.log(`OTP for ${email}: ${otp}`);
            }
            return res.status(error.statusCode || 503).json({
                success: false,
                message:
                    error.message ||
                    "Unable to send OTP email right now. Please try again shortly.",
            });
        }

        res.json({ success: true, message: "OTP resent successfully" });
    } catch (err) {
        next(err);
    }
};

// @POST /api/auth/forgot-password
export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        // Keep response generic for better account privacy.
        if (!user) {
            return res.json({
                success: true,
                message:
                    "If an account exists with this email, an OTP has been sent.",
            });
        }

        const otp = generateOTP();
        await OTP.deleteMany({ email, purpose: "password_reset" });
        await OTP.create({ email, otp, purpose: "password_reset" });

        try {
            await sendPasswordResetOTPEmail(email, user.name, otp);
        } catch (error) {
            if (process.env.NODE_ENV === "development") {
                console.log(`Password reset OTP for ${email}: ${otp}`);
            }
            return res.status(error.statusCode || 503).json({
                success: false,
                message:
                    error.message ||
                    "Unable to send reset OTP right now. Please try again shortly.",
            });
        }

        res.json({
            success: true,
            message: "OTP sent to your email for password reset",
        });
    } catch (err) {
        next(err);
    }
};

// @POST /api/auth/verify-reset-otp
export const verifyResetOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        const otpDoc = await OTP.findOne({
            email,
            otp,
            verified: false,
            purpose: "password_reset",
        });

        if (!otpDoc) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid or expired OTP" });
        }

        if (otpDoc.expiresAt < new Date()) {
            return res
                .status(400)
                .json({ success: false, message: "OTP expired" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }

        await OTP.findByIdAndUpdate(otpDoc._id, { verified: true });

        const resetToken = jwt.sign(
            { email, purpose: "password_reset" },
            process.env.JWT_RESET_SECRET || process.env.JWT_SECRET,
            { expiresIn: "10m" }
        );

        res.json({
            success: true,
            message: "OTP verified successfully",
            resetToken,
        });
    } catch (err) {
        next(err);
    }
};

// @POST /api/auth/reset-password
export const resetPassword = async (req, res, next) => {
    try {
        const { resetToken, password, confirmPassword } = req.body;

        if (!resetToken) {
            return res
                .status(400)
                .json({ success: false, message: "Reset token is required" });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters",
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password and confirm password do not match",
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(
                resetToken,
                process.env.JWT_RESET_SECRET || process.env.JWT_SECRET
            );
        } catch {
            return res
                .status(400)
                .json({ success: false, message: "Invalid or expired reset token" });
        }

        if (decoded.purpose !== "password_reset") {
            return res
                .status(400)
                .json({ success: false, message: "Invalid reset token" });
        }

        const user = await User.findOne({ email: decoded.email }).select(
            "+password"
        );
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }

        user.password = password;
        user.authProvider = user.authProvider || "local";
        user.refreshToken = null;
        await user.save();

        await OTP.deleteMany({ email: decoded.email, purpose: "password_reset" });

        res.json({
            success: true,
            message: "Password reset successful. Please login again.",
        });
    } catch (err) {
        next(err);
    }
};

// @POST /api/auth/login
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select("+password");
        if (!user || !(await user.comparePassword(password))) {
            return res
                .status(401)
                .json({ success: false, message: "Invalid credentials" });
        }

        if (!user.isVerified) {
            return res
                .status(403)
                .json({
                    success: false,
                    message: "Please verify your email first",
                });
        }

        const { accessToken, refreshToken } = generateTokens(
            user._id,
            user.name
        );
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        res.json({
            success: true,
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
            },
        });
    } catch (err) {
        next(err);
    }
};

// @POST /api/auth/google
export const googleAuth = async (req, res, next) => {
    try {
        const { credential } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { sub: googleId, name, email, picture } = ticket.getPayload();

        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({
                name,
                email,
                googleId,
                avatar: picture,
                isVerified: true,
                authProvider: "google",
            });
        } else if (!user.googleId) {
            user.googleId = googleId;
            user.isVerified = true;
            if (!user.avatar) user.avatar = picture;
            await user.save();
        }

        const { accessToken, refreshToken } = generateTokens(
            user._id,
            user.name
        );
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        res.json({
            success: true,
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
            },
        });
    } catch (err) {
        next(err);
    }
};

// @POST /api/auth/refresh
export const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken)
            return res
                .status(401)
                .json({ success: false, message: "No refresh token" });

        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        );
        const user = await User.findById(decoded.id).select("+refreshToken");

        if (!user || user.refreshToken !== refreshToken) {
            return res
                .status(403)
                .json({ success: false, message: "Invalid refresh token" });
        }

        const tokens = generateTokens(user._id, user.name);
        user.refreshToken = tokens.refreshToken;
        await user.save({ validateBeforeSave: false });

        res.json({ success: true, ...tokens });
    } catch (err) {
        if (err.name === "JsonWebTokenError") {
            return res
                .status(403)
                .json({ success: false, message: "Invalid token" });
        }
        next(err);
    }
};

// @POST /api/auth/logout
export const logout = async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
        res.json({ success: true, message: "Logged out successfully" });
    } catch (err) {
        next(err);
    }
};

// @GET /api/auth/me
export const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).populate(
            "trips",
            "title destination coverImage status"
        );
        res.json({ success: true, user });
    } catch (err) {
        next(err);
    }
};
