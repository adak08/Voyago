import express from "express";
const router = express.Router();
import { body, param } from "express-validator";
import {
    getItinerary,
    updateItinerary,
    generateItinerary,
    addDay,
    deleteDay,
} from "../controllers/itinerary.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const tripIdValidation = [
    param("tripId").isMongoId().withMessage("Valid tripId is required"),
];

const updateItineraryValidation = [
    ...tripIdValidation,
    body("days").isArray().withMessage("days must be an array"),
];

const generateItineraryValidation = [
    ...tripIdValidation,
    body("destination").optional().isString().withMessage("destination must be a string"),
    body("days").optional().isInt({ min: 1, max: 30 }).withMessage("days must be between 1 and 30"),
    body("vibe").optional().isString().withMessage("vibe must be a string"),
    body("preferences").optional().isString().withMessage("preferences must be a string"),
];

const addDayValidation = [
    ...tripIdValidation,
    body("day").isInt({ min: 1 }).withMessage("day must be a positive number"),
    body("date").optional().isISO8601().withMessage("date must be a valid date"),
    body("title").optional().isString().withMessage("title must be a string"),
    body("activities").optional().isArray().withMessage("activities must be an array"),
];

const deleteDayValidation = [
    ...tripIdValidation,
    param("dayIndex").isInt({ min: 0 }).withMessage("dayIndex must be a non-negative integer"),
];

router.use(protect);
router.get("/:tripId", tripIdValidation, validate, getItinerary);
router.put("/:tripId", updateItineraryValidation, validate, updateItinerary);
router.post("/:tripId/generate", generateItineraryValidation, validate, generateItinerary);
router.post("/:tripId/day", addDayValidation, validate, addDay);
router.delete("/:tripId/day/:dayIndex", deleteDayValidation, validate, deleteDay);

export default router;
