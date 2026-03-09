import express from "express";
import { planTripHandler, agentStatusHandler } from "../controllers/ai.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { apiLimiter } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

// Apply auth protection to all AI routes
router.use(protect);

router.post("/plan-trip", apiLimiter, planTripHandler);

router.get("/agents/status", agentStatusHandler);

export default router;