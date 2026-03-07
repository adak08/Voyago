import Itinerary from "../models/itinerary.model.js";
import Trip from "../models/trip.model.js";
import { generateAIItinerary } from "../services/ai.service.js";
import { getIO } from "../config/socket.config.js";

// @GET /api/itinerary/:tripId
export const getItinerary = async (req, res, next) => {
    try {
        const itinerary = await Itinerary.findOne({
            tripId: req.params.tripId,
        }).populate("lastUpdatedBy", "name avatar");

        if (!itinerary)
            return res
                .status(404)
                .json({ success: false, message: "Itinerary not found" });

        res.json({ success: true, itinerary });
    } catch (err) {
        next(err);
    }
};

// @PUT /api/itinerary/:tripId - Update itinerary (manual)
export const updateItinerary = async (req, res, next) => {
    try {
        const { days } = req.body;
        days.forEach((day) => {
            day.activities.sort((a, b) => {
                const t1 = new Date(`1970/01/01 ${a.time}`);
                const t2 = new Date(`1970/01/01 ${b.time}`);
                return t1 - t2;
            });
        });
        const trip = await Trip.findById(req.params.tripId);
        if (!trip)
            return res
                .status(404)
                .json({ success: false, message: "Trip not found" });

        const isMember = trip.members.some(
            (m) => m.user.toString() === req.user.id
        );
        if (!isMember)
            return res
                .status(403)
                .json({ success: false, message: "Not a member" });

        const itinerary = await Itinerary.findOneAndUpdate(
            { tripId: req.params.tripId },
            { days, lastUpdatedBy: req.user.id },
            { new: true, upsert: true }
        ).populate("lastUpdatedBy", "name avatar");

        // Emit real-time sync
        try {
            getIO().to(req.params.tripId).emit("itinerary_synced", itinerary);
        } catch {}

        res.json({ success: true, itinerary });
    } catch (err) {
        next(err);
    }
};

// @POST /api/itinerary/:tripId/generate - AI generate itinerary
export const generateItinerary = async (req, res, next) => {
    try {
        const { destination, days, vibe, preferences } = req.body;

        const trip = await Trip.findById(req.params.tripId);
        if (!trip)
            return res
                .status(404)
                .json({ success: false, message: "Trip not found" });

        const isMember = trip.members.some(
            (m) => m.user.toString() === req.user.id
        );
        if (!isMember)
            return res
                .status(403)
                .json({ success: false, message: "Not a member" });

        const aiDays = await generateAIItinerary({
            destination: destination || trip.destination,
            days: days || trip.duration || 3,
            vibe,
            preferences,
        });

        const itinerary = await Itinerary.findOneAndUpdate(
            { tripId: req.params.tripId },
            { days: aiDays, generatedByAI: true, lastUpdatedBy: req.user.id },
            { new: true, upsert: true }
        ).populate("lastUpdatedBy", "name avatar");

        // Emit real-time sync
        try {
            getIO().to(req.params.tripId).emit("itinerary_synced", itinerary);
        } catch {}

        res.json({ success: true, itinerary });
    } catch (err) {
        next(err);
    }
};

// @POST /api/itinerary/:tripId/day - Add a day
export const addDay = async (req, res, next) => {
    try {
        const { day, date, title, activities } = req.body;

        const itinerary = await Itinerary.findOneAndUpdate(
            { tripId: req.params.tripId },
            {
                $push: {
                    days: { day, date, title, activities: activities || [] },
                },
                lastUpdatedBy: req.user.id,
            },
            { new: true }
        );

        try {
            getIO().to(req.params.tripId).emit("itinerary_synced", itinerary);
        } catch {}

        res.json({ success: true, itinerary });
    } catch (err) {
        next(err);
    }
};

// @DELETE /api/itinerary/:tripId/day/:dayIndex
export const deleteDay = async (req, res, next) => {
    try {
        const itinerary = await Itinerary.findOne({
            tripId: req.params.tripId,
        });
        if (!itinerary)
            return res
                .status(404)
                .json({ success: false, message: "Itinerary not found" });

        itinerary.days.splice(parseInt(req.params.dayIndex), 1);
        itinerary.lastUpdatedBy = req.user.id;
        await itinerary.save();

        res.json({ success: true, itinerary });
    } catch (err) {
        next(err);
    }
};
