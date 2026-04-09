import Itinerary from "../models/itinerary.model.js";
import Trip from "../models/trip.model.js";
import { generateAIItinerary } from "../services/ai.service.js";
import { getIO } from "../config/socket.config.js";

const normalizeForecastDate = (entry, startDate) => {
    if (entry?.date) {
        const direct = new Date(entry.date);
        if (!Number.isNaN(direct.getTime())) return direct;
    }

    const dayNumber = Number(entry?.day);
    if (
        Number.isFinite(dayNumber) &&
        dayNumber >= 1 &&
        startDate &&
        !Number.isNaN(new Date(startDate).getTime())
    ) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + dayNumber - 1);
        return d;
    }

    return null;
};

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
        const {
            destination,
            days,
            vibe,
            preferences,
            origin,
            people,
            budget,
            currency,
        } = req.body;

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

        const aiPlan = await generateAIItinerary({
            destination: destination || trip.destination,
            origin: origin || "",
            days: days || trip.duration || 3,
            people: people || Math.max(1, trip.members?.length || 1),
            budget: budget || "medium",
            vibe,
            preferences,
            startDate: trip.startDate,
            currency: currency || trip.currency || "INR",
        });

        if (!aiPlan?.success) {
            return res.status(502).json({
                success: false,
                message:
                    aiPlan?.error || "AI service failed to generate itinerary",
            });
        }

        const meta = aiPlan.meta || {};
        const weather = aiPlan.weather || {};
        const route = aiPlan.route || {};
        const budgetData = aiPlan.budget || {};
        const itineraryData = aiPlan.itinerary || {};
        const agentStatus = aiPlan.agentStatus || {};

        const normalizedDays = Array.isArray(itineraryData.days)
            ? itineraryData.days.map((day) => ({
                  day: day.day,
                  date: day.date,
                  title: day.title,
                  summary: day.summary || day.day_summary,
                  activities: Array.isArray(day.activities)
                      ? day.activities.map((activity) => ({
                            time: activity.time,
                            title: activity.title,
                            description: activity.description,
                            category: activity.category,
                            location: activity.location,
                            cost: activity.cost,
                            tips: activity.tips,
                            source: activity.source || "ai",
                        }))
                      : [],
              }))
            : [];

        const normalizedWeatherForecast = Array.isArray(weather.forecast)
            ? weather.forecast.map((entry) => ({
                  date: normalizeForecastDate(
                      entry,
                      meta.start_date || trip.startDate
                  ),
                  condition: entry.condition,
                  temperature:
                      typeof entry.temperature === "number"
                          ? entry.temperature
                          : entry.temperature?.max,
                  humidity: entry.humidity,
              }))
            : [];

        const itinerary = await Itinerary.findOneAndUpdate(
            { tripId: req.params.tripId },
            {
                meta: {
                    origin: meta.origin || origin || "",
                    destination:
                        meta.destination || destination || trip.destination,
                    startDate: meta.start_date || trip.startDate,
                    endDate: meta.end_date || trip.endDate,
                    days:
                        Number(meta.days) || Number(days) || trip.duration || 0,
                    people:
                        Number(meta.people) ||
                        Number(people) ||
                        Math.max(1, trip.members?.length || 1),
                    vibe: meta.vibe || vibe || "balanced",
                    budget:
                        Number(budgetData?.breakdown?.total) ||
                        Number(budgetData?.total) ||
                        0,
                    currency:
                        meta.currency ||
                        budgetData?.currency ||
                        currency ||
                        trip.currency ||
                        "INR",
                },
                aiData: {
                    weather: {
                        available: !!weather.available,
                        forecast: normalizedWeatherForecast,
                    },
                    route: {
                        available: !!route.available,
                        distance: route.distance,
                        duration: route.duration,
                        recommendedMode: route.recommendedMode || route.mode,
                    },
                    budget: {
                        transport:
                            budgetData?.breakdown?.transport ??
                            budgetData?.transport,
                        hotel:
                            budgetData?.breakdown?.hotel ?? budgetData?.hotel,
                        food: budgetData?.breakdown?.food ?? budgetData?.food,
                        activities:
                            budgetData?.breakdown?.activities ??
                            budgetData?.activities,
                        total:
                            budgetData?.breakdown?.total ?? budgetData?.total,
                        currency:
                            budgetData?.currency ||
                            meta.currency ||
                            currency ||
                            trip.currency ||
                            "INR",
                    },
                },
                agentStatus: {
                    weather: !!(
                        agentStatus.weather === true ||
                        agentStatus.weather === "ok"
                    ),
                    maps: !!(
                        agentStatus.maps === true ||
                        agentStatus.route === true ||
                        agentStatus.ors === true ||
                        agentStatus.maps === "ok" ||
                        agentStatus.route === "ok" ||
                        agentStatus.ors === "ok"
                    ),
                    budget: !!(
                        agentStatus.budget === true ||
                        agentStatus.budget === "ok"
                    ),
                    itinerary: !!(
                        agentStatus.itinerary === true ||
                        agentStatus.itinerary === "ok"
                    ),
                },
                days: normalizedDays,
                aiInsights: {
                    localCuisine: itineraryData.local_cuisine || [],
                    travelTips: budgetData.tips || [],
                    packingTips: itineraryData.packing_tips || [],
                    safetyNotes: [],
                },
                generatedByAI: true,
                lastUpdatedBy: req.user.id,
            },
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
