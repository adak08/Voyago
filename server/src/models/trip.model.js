import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Trip title is required"],
            trim: true,
            maxlength: [100, "Title cannot exceed 100 characters"],
        },
        destination: {
            type: String,
            required: [true, "Destination is required"],
            trim: true,
        },
        description: {
            type: String,
            maxlength: [500, "Description cannot exceed 500 characters"],
        },
        startDate: {
            type: Date,
            required: [true, "Start date is required"],
        },
        endDate: {
            type: Date,
            required: [true, "End date is required"],
        },
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        members: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                role: {
                    type: String,
                    enum: ["admin", "member"],
                    default: "member",
                },
                joinedAt: { type: Date, default: Date.now },
            },
        ],
        inviteCode: {
            type: String,
            unique: true,
            required: true,
        },
        coverImage: {
            type: String,
            default: null,
        },
        photos: [
            {
                url: String,
                uploadedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                uploadedAt: { type: Date, default: Date.now },
            },
        ],
        status: {
            type: String,
            enum: ["upcoming", "ongoing", "completed"],
            default: "upcoming",
        },
        budget: {
            type: Number,
            default: 0,
        },
        currency: {
            type: String,
            default: "INR",
        },
    },
    { timestamps: true }
);

// Virtual: number of days
tripSchema.virtual("duration").get(function () {
    return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

export default mongoose.model("Trip", tripSchema);
