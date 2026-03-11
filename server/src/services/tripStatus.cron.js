import cron from "node-cron";
import Trip from "../models/trip.model.js";

const updateTripStatuses = async () => {
    try {
        const now = new Date();

        // upcoming → ongoing: startDate has passed, endDate hasn't yet
        const ongoingResult = await Trip.updateMany(
            {
                status: "upcoming",
                startDate: { $lte: now },
                endDate: { $gte: now },
            },
            { $set: { status: "ongoing" } }
        );

        // ongoing → completed: endDate has passed
        const completedResult = await Trip.updateMany(
            {
                status: { $in: ["upcoming", "ongoing"] },
                endDate: { $lt: now },
            },
            { $set: { status: "completed" } }
        );

        console.log(
            `✅ Trip status cron ran at ${now.toISOString()} — ` +
                `${ongoingResult.modifiedCount} marked ongoing, ` +
                `${completedResult.modifiedCount} marked completed`
        );
    } catch (error) {
        console.error("❌ Trip status cron error:", error.message);
    }
};

// Runs every day at midnight (00:00)
const scheduleTripStatusCron = () => {
    cron.schedule("0 0 * * *", updateTripStatuses, {
        timezone: "Asia/Kolkata", // change to your server's timezone
    });

    console.log("🕐 Trip status cron job scheduled (daily at midnight)");
};

export default scheduleTripStatusCron;
