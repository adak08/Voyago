import express from "express";
const router = express.Router();
import {
  createTrip, getUserTrips, getTripById, joinTrip, leaveTrip,
  updateTrip, deleteTrip, uploadTripPhoto, getTripByInviteCode,
} from "../controllers/trip.controller.js";
import { getMessages, sendMessage } from "../controllers/chat.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { upload } from "../config/cloudinary.config.js";

router.use(protect);

router.route("/").get(getUserTrips).post(createTrip);
router.post("/join", joinTrip);
router.get("/invite/:code", getTripByInviteCode);
router.route("/:id").get(getTripById).put(updateTrip).delete(deleteTrip);
router.delete("/:id/leave", leaveTrip);
router.post("/:id/upload", upload.single("photo"), uploadTripPhoto);

// Chat routes nested under trips
router.get("/:tripId/messages", getMessages);
router.post("/:tripId/messages", sendMessage);

export default router;
