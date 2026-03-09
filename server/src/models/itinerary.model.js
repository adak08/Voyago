import mongoose from "mongoose";

const itinerarySchema = new mongoose.Schema(
    {
        tripId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Trip",
            required: true,
            unique: true,
        },

        meta: {
            origin: String,
            destination: String,
            startDate: Date,
            endDate: Date,
            days: Number,
            people: Number,
            vibe: String,
            budget: Number,
            currency: {
                type: String,
                default: "INR",
            },
        },

        aiData: {
            weather: {
                available: Boolean,
                forecast: [
                    {
                        date: Date,
                        condition: String,
                        temperature: Number,
                        humidity: Number,
                    },
                ],
            },

            route: {
                available: Boolean,
                distance: String,
                duration: String,
                recommendedMode: String,
            },

            budget: {
                transport: Number,
                hotel: Number,
                food: Number,
                activities: Number,
                total: Number,
                currency: String,
            },
        },

        agentStatus: {
            weather: Boolean,
            maps: Boolean,
            budget: Boolean,
            itinerary: Boolean,
        },

        days: [
            {
                day: Number,
                date: Date,
                title: String,
                summary: String,
                activities: [
                    {
                        time: String,
                        title: String,
                        description: String,
                        category: String,
                        location: String,
                        cost: Number,
                        tips: String,
                        source: {
                            type: String,
                            enum: ["ai", "custom"],
                            default: "ai",
                        },
                    },
                ],
            },
        ],

        aiInsights: {
            localCuisine: [String],
            travelTips: [String],
            packingTips: [String],
            safetyNotes: [String],
        },

        generatedByAI: {
            type: Boolean,
            default: true,
        },

        lastUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

export default mongoose.model("Itinerary", itinerarySchema);
