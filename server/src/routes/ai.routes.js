import express from "express";
import { body } from "express-validator";
import { planTripHandler, agentStatusHandler } from "../controllers/ai.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { apiLimiter } from "../middlewares/rateLimit.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = express.Router();

// Apply auth protection to all AI routes
router.use(protect);

const planTripValidation = [
	body("destination")
		.trim()
		.notEmpty()
		.withMessage("Destination is required"),
	body("days")
		.optional()
		.isInt({ min: 1, max: 30 })
		.withMessage("days must be between 1 and 30"),
	body("people")
		.optional()
		.isInt({ min: 1, max: 50 })
		.withMessage("people must be between 1 and 50"),
];

router.post("/plan-trip", apiLimiter, planTripValidation, validate, planTripHandler);

router.get("/agents/status", agentStatusHandler);

export default router;