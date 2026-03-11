import express from "express";
import { body } from "express-validator";
import { protect } from "../middlewares/auth.middleware.js";
import { chatUpload } from "../config/cloudinary.config.js";
import { uploadChatMedia } from "../controllers/chat.controller.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = express.Router();

const uploadValidation = [
	body("file").custom((value, { req }) => {
		if (!req.file) {
			throw new Error("File is required");
		}

		return true;
	}),
];

const chatUploadMiddleware = (req, res, next) => {
	chatUpload.single("file")(req, res, (err) => {
		if (err) return next(err);
		next();
	});
};

router.post("/upload", protect, chatUploadMiddleware, uploadValidation, validate, uploadChatMedia);

export default router;
