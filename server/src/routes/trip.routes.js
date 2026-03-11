import express from "express";
const router = express.Router();
import { body, param } from "express-validator";
import {
  createTrip, getUserTrips, getTripById, joinTrip, leaveTrip,
  updateTrip, deleteTrip, uploadTripPhoto, getTripByInviteCode, createTripFromAIPlan, sendInviteEmail, transferTripAdmin
} from "../controllers/trip.controller.js";
import { getMessages, sendMessage } from "../controllers/chat.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { tripUpload } from "../config/cloudinary.config.js";
import { validate } from "../middlewares/validate.middleware.js";

const tripCreateValidation = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("destination").trim().notEmpty().withMessage("Destination is required"),
  body("startDate").isISO8601().withMessage("Valid startDate is required"),
  body("endDate")
    .isISO8601()
    .withMessage("Valid endDate is required")
    .custom((value, { req }) => new Date(value) > new Date(req.body.startDate))
    .withMessage("endDate must be after startDate"),
];

const tripUpdateValidation = [
  param("id").isMongoId().withMessage("Valid trip id is required"),
  body("title").optional().trim().notEmpty().withMessage("Title cannot be empty"),
  body("destination").optional().trim().notEmpty().withMessage("Destination cannot be empty"),
  body("startDate").optional().isISO8601().withMessage("startDate must be a valid date"),
  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("endDate must be a valid date")
    .custom((value, { req }) => {
      if (!value) return true;
      const startDate = req.body.startDate ? new Date(req.body.startDate) : null;
      if (!startDate || Number.isNaN(startDate.getTime())) return true;
      return new Date(value) > startDate;
    })
    .withMessage("endDate must be after startDate"),
];

const joinTripValidation = [
  body("inviteCode").trim().notEmpty().withMessage("Invite code is required"),
];

const tripIdParamValidation = [
  param("id").isMongoId().withMessage("Valid trip id is required"),
];

const tripCodeValidation = [
  param("code").trim().notEmpty().withMessage("Invite code is required"),
];

const transferAdminValidation = [
  param("id").isMongoId().withMessage("Valid trip id is required"),
  body("newAdminId").isMongoId().withMessage("Valid newAdminId is required"),
];

const inviteEmailValidation = [
  param("id").isMongoId().withMessage("Valid trip id is required"),
  body("email").trim().isEmail().withMessage("Valid email is required"),
];

const tripMessagesValidation = [
  param("tripId").isMongoId().withMessage("Valid trip id is required"),
];

const sendMessageValidation = [
  param("tripId").isMongoId().withMessage("Valid trip id is required"),
  body("type")
    .optional()
    .isIn(["text", "image", "video", "file", "audio", "system"])
    .withMessage("Invalid message type"),
  body("message")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Message must be a string"),
];

const aiImportValidation = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("meta.destination")
    .trim()
    .notEmpty()
    .withMessage("meta.destination is required"),
  body("meta.startDate")
    .isISO8601()
    .withMessage("meta.startDate must be a valid date"),
  body("meta.endDate")
    .isISO8601()
    .withMessage("meta.endDate must be a valid date")
    .custom((value, { req }) => new Date(value) > new Date(req.body?.meta?.startDate))
    .withMessage("meta.endDate must be after meta.startDate"),
];

router.use(protect);

router.route("/").get(getUserTrips).post(tripCreateValidation, validate, createTrip);
router.post("/ai-import", aiImportValidation, validate, createTripFromAIPlan);
router.post("/join", joinTripValidation, validate, joinTrip);
router.get("/invite/:code", tripCodeValidation, validate, getTripByInviteCode);
router
  .route("/:id")
  .get(tripIdParamValidation, validate, getTripById)
  .put(tripUpdateValidation, validate, updateTrip)
  .delete(tripIdParamValidation, validate, deleteTrip);
router.delete("/:id/leave", tripIdParamValidation, validate, leaveTrip);
router.patch("/:id/transfer-admin", transferAdminValidation, validate, transferTripAdmin);
router.post("/:id/invite-email", inviteEmailValidation, validate, sendInviteEmail);

const tripUploadMiddleware = (req, res, next) => {
  tripUpload.single("photo")(req, res, (err) => {
    if (err) return next(err);
    next();
  });
};

router.post("/:id/upload", tripIdParamValidation, validate, tripUploadMiddleware, uploadTripPhoto);

// Chat routes nested under trips
router.get("/:tripId/messages", tripMessagesValidation, validate, getMessages);
router.post("/:tripId/messages", sendMessageValidation, validate, sendMessage);

export default router;
