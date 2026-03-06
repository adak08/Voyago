import Trip from "../models/trip.model.js";
import User from "../models/user.model.js";
import Itinerary from "../models/itinerary.model.js";
import { generateInviteCode } from "../utils/generateInviteCode.js";
import { createNotification } from "../services/notification.service.js";
import { getIO } from "../config/socket.config.js";
import { cloudinary } from "../config/cloudinary.config.js";

// @POST /api/trips - Create trip
export const createTrip = async (req, res, next) => {
  try {
    const { title, destination, description, startDate, endDate, budget, currency } = req.body;

    const inviteCode = generateInviteCode();

    const trip = await Trip.create({
      title,
      destination,
      description,
      startDate,
      endDate,
      budget,
      currency,
      admin: req.user.id,
      inviteCode,
      members: [{ user: req.user.id, role: "admin" }],
    });

    // Add trip to user's trips list
    await User.findByIdAndUpdate(req.user.id, { $push: { trips: trip._id } });

    // Initialize empty itinerary
    await Itinerary.create({ tripId: trip._id, days: [] });

    const populated = await trip.populate("admin", "name avatar email");

    res.status(201).json({ success: true, trip: populated });
  } catch (err) {
    next(err);
  }
};

// @GET /api/trips - Get user trips
export const getUserTrips = async (req, res, next) => {
  try {
    const trips = await Trip.find({ "members.user": req.user.id })
      .populate("admin", "name avatar")
      .populate("members.user", "name avatar email")
      .sort({ createdAt: -1 });

    res.json({ success: true, trips });
  } catch (err) {
    next(err);
  }
};

// @GET /api/trips/:id - Get trip by ID
export const getTripById = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate("admin", "name avatar email")
      .populate("members.user", "name avatar email");

    if (!trip) return res.status(404).json({ success: false, message: "Trip not found" });

    // Check membership
    const isMember = trip.members.some((m) => m.user._id.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ success: false, message: "Access denied" });

    res.json({ success: true, trip });
  } catch (err) {
    next(err);
  }
};

// @POST /api/trips/join - Join trip via invite code
export const joinTrip = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;

    const trip = await Trip.findOne({ inviteCode });
    if (!trip) return res.status(404).json({ success: false, message: "Invalid invite code" });

    const alreadyMember = trip.members.some((m) => m.user.toString() === req.user.id);
    if (alreadyMember) return res.status(400).json({ success: false, message: "Already a member" });

    trip.members.push({ user: req.user.id, role: "member" });
    await trip.save();

    await User.findByIdAndUpdate(req.user.id, { $push: { trips: trip._id } });

    // Notify trip admin
    await createNotification({
      recipient: trip.admin,
      sender: req.user.id,
      type: "MEMBER_JOINED",
      message: `${req.user.name} joined your trip "${trip.title}"`,
      tripId: trip._id,
    });

    // Emit socket event
    try {
      getIO().to(trip._id.toString()).emit("member_joined", {
        userId: req.user.id,
        name: req.user.name,
      });
    } catch {}

    const populated = await trip.populate([
      { path: "admin", select: "name avatar" },
      { path: "members.user", select: "name avatar email" },
    ]);

    res.json({ success: true, trip: populated });
  } catch (err) {
    next(err);
  }
};

// @DELETE /api/trips/:id/leave - Leave trip
export const leaveTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: "Trip not found" });

    if (trip.admin.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: "Admin cannot leave. Transfer ownership first." });
    }

    trip.members = trip.members.filter((m) => m.user.toString() !== req.user.id);
    await trip.save();
    await User.findByIdAndUpdate(req.user.id, { $pull: { trips: trip._id } });

    try {
      getIO().to(trip._id.toString()).emit("member_left", { userId: req.user.id });
    } catch {}

    res.json({ success: true, message: "Left trip successfully" });
  } catch (err) {
    next(err);
  }
};

// @PUT /api/trips/:id - Update trip
export const updateTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: "Trip not found" });
    if (trip.admin.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Only admin can update trip" });
    }

    const updated = await Trip.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("admin", "name avatar").populate("members.user", "name avatar email");

    res.json({ success: true, trip: updated });
  } catch (err) {
    next(err);
  }
};

// @DELETE /api/trips/:id - Delete trip
export const deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: "Trip not found" });
    if (trip.admin.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Only admin can delete trip" });
    }

    // Remove trip from all members
    await User.updateMany({ trips: trip._id }, { $pull: { trips: trip._id } });
    await trip.deleteOne();

    res.json({ success: true, message: "Trip deleted" });
  } catch (err) {
    next(err);
  }
};

// @POST /api/trips/:id/upload - Upload trip photo
export const uploadTripPhoto = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: "Trip not found" });

    const isMember = trip.members.some((m) => m.user.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ success: false, message: "Not a member" });

    const photoUrl = req.file.path;
    trip.photos.push({ url: photoUrl, uploadedBy: req.user.id });
    if (!trip.coverImage) trip.coverImage = photoUrl;
    await trip.save();

    res.json({ success: true, url: photoUrl, trip });
  } catch (err) {
    next(err);
  }
};

// @GET /api/trips/invite/:code - Get trip info by invite code (preview)
export const getTripByInviteCode = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ inviteCode: req.params.code })
      .select("title destination startDate endDate members coverImage")
      .populate("members.user", "name avatar");

    if (!trip) return res.status(404).json({ success: false, message: "Invalid invite code" });
    res.json({ success: true, trip });
  } catch (err) {
    next(err);
  }
};
