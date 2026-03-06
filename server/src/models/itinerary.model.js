import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
    time: { type: String },
    title: { type: String, required: true },
    description: { type: String },
    location: { type: String },
    category: {
        type: String,
        enum: ["food", "travel", "activity", "accommodation", "other"],
        default: "other",
    },
    cost: { type: Number, default: 0 },
});

const daySchema = new mongoose.Schema({
    day: { type: Number, required: true },
    date: { type: Date },
    title: { type: String },
    activities: [activitySchema],
});

const itinerarySchema = new mongoose.Schema(
    {
        tripId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Trip",
            required: true,
            unique: true,
        },
        days: [daySchema],
        generatedByAI: {
            type: Boolean,
            default: false,
        },
        lastUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

export default mongoose.model("Itinerary", itinerarySchema);
