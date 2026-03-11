import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        type: {
            type: String,
            enum: [
                "TRIP_INVITE",
                "ADMIN_TRANSFER",
                "NEW_EXPENSE",
                "SETTLEMENT_REQUEST",
                "SETTLEMENT_DONE",
                "NEW_MESSAGE",
                "ITINERARY_UPDATE",
                "MEMBER_JOINED",
                "MEMBER_LEFT",
            ],
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        tripId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Trip",
        },
        read: {
            type: Boolean,
            default: false,
        },
        data: {
            type: mongoose.Schema.Types.Mixed,
        },
    },
    { timestamps: true }
);

// Index for fast user notification fetch
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
