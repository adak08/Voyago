import express from "express";
const router = express.Router();
import { param } from "express-validator";
import {
  getNotifications, markAsRead, markAllAsRead, deleteNotification,
} from "../controllers/notification.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const notificationIdValidation = [
  param("id").isMongoId().withMessage("Valid notification id is required"),
];

router.use(protect);
router.get("/", getNotifications);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", notificationIdValidation, validate, markAsRead);
router.delete("/:id", notificationIdValidation, validate, deleteNotification);

export default router;
