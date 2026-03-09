import express from "express";
const router = express.Router();
import {
  createTrip, getUserTrips, getTripById, joinTrip, leaveTrip,
  updateTrip, deleteTrip, uploadTripPhoto, getTripByInviteCode, createTripFromAIPlan,
} from "../controllers/trip.controller.js";
import { getMessages, sendMessage } from "../controllers/chat.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { tripUpload } from "../config/cloudinary.config.js";

router.use(protect);

router.route("/").get(getUserTrips).post(createTrip);
router.post("/ai-import", createTripFromAIPlan);
router.post("/join", joinTrip);
router.get("/invite/:code", getTripByInviteCode);
router.route("/:id").get(getTripById).put(updateTrip).delete(deleteTrip);
router.delete("/:id/leave", leaveTrip);

const tripUploadMiddleware = (req, res, next) => {
  tripUpload.single("photo")(req, res, (err) => {
    if (err) return next(err);
    next();
  });
};

router.post("/:id/upload", tripUploadMiddleware, uploadTripPhoto);

// Chat routes nested under trips
router.get("/:tripId/messages", getMessages);
router.post("/:tripId/messages", sendMessage);

export default router;
