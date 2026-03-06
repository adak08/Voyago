import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return res
                .status(401)
                .json({ success: false, message: "No token provided" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select(
            "-password -refreshToken"
        );
        if (!user)
            return res
                .status(401)
                .json({ success: false, message: "User not found" });

        req.user = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
        };
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res
                .status(401)
                .json({
                    success: false,
                    message: "Token expired",
                    code: "TOKEN_EXPIRED",
                });
        }
        return res
            .status(401)
            .json({ success: false, message: "Invalid token" });
    }
};
