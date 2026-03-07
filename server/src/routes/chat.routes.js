import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { chatUpload } from "../config/cloudinary.config.js";
import { uploadChatMedia } from "../controllers/chat.controller.js";

const router = express.Router();

const chatUploadMiddleware = (req, res, next) => {
	chatUpload.single("file")(req, res, (err) => {
		if (err) return next(err);
		next();
	});
};

router.post("/upload", protect, chatUploadMiddleware, uploadChatMedia);

export default router;
