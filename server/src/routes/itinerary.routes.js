import express from "express";
const router = express.Router();
import {
    getItinerary,
    updateItinerary,
    generateItinerary,
    addDay,
    deleteDay,
} from "../controllers/itinerary.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

router.use(protect);
router.get("/:tripId", getItinerary);
router.put("/:tripId", updateItinerary);
router.post("/:tripId/generate", generateItinerary);
router.post("/:tripId/day", addDay);
router.delete("/:tripId/day/:dayIndex", deleteDay);

export default router;
