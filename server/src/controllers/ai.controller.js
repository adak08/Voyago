import { planTrip } from "../services/orchestrator/tripPlanner.js";

export const planTripHandler = async (req, res, next) => {
    try {
        const {
            destination,
            origin = "",
            days = 5,
            people = 1,
            budget = "medium",
            vibe = "balanced",
            preferences = "",
            startDate = null,
            currency = "INR",
        } = req.body;

        // Basic validation
        if (
            !destination ||
            typeof destination !== "string" ||
            !destination.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "destination is required and must be a non-empty string.",
            });
        }

        const numDays = parseInt(days, 10);
        if (isNaN(numDays) || numDays < 1 || numDays > 30) {
            return res.status(400).json({
                success: false,
                message: "days must be a number between 1 and 30.",
            });
        }

        const numPeople = parseInt(people, 10);
        if (isNaN(numPeople) || numPeople < 1 || numPeople > 50) {
            return res.status(400).json({
                success: false,
                message: "people must be a number between 1 and 50.",
            });
        }

        const validBudgets = ["low", "medium", "high", "budget", "luxury"];
        if (budget && !validBudgets.includes(budget.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: `budget must be one of: ${validBudgets.join(", ")}.`,
            });
        }

        if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
            return res.status(400).json({
                success: false,
                message: "startDate must be in YYYY-MM-DD format.",
            });
        }

        // Delegate to orchestrator
        const result = await planTrip({
            destination: destination.trim(),
            origin: origin?.trim() || "",
            days: numDays,
            people: numPeople,
            budget,
            vibe,
            preferences,
            startDate,
            currency,
        });

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message:
                    result.error ||
                    "Trip planning failed. Check API keys and try again.",
                agentStatus: result.agentStatus,
                generatedAt: result.generatedAt,
            });
        }

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

export const agentStatusHandler = async (_req, res, next) => {
    try {
        const status = {
            gemini: !!process.env.GEMINI_API_KEY,
            openweather: !!process.env.OPENWEATHER_KEY,
            ors: !!(process.env.ORS_API_KEY || process.env.GOOGLE_MAP_KEY),
            route: !!(process.env.ORS_API_KEY || process.env.GOOGLE_MAP_KEY),
        };

        const allReady = Object.values(status).every(Boolean);

        return res.status(200).json({
            success: true,
            configured: status,
            allReady,
            message: allReady
                ? "All agent APIs are configured."
                : "Some agents are missing API keys — they will return unavailable data.",
        });
    } catch (err) {
        next(err);
    }
};
