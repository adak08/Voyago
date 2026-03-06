import mongoose from "mongoose";

const settlementSchema = new mongoose.Schema(
    {
        tripId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Trip",
            required: true,
        },
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        to: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "INR",
        },
        status: {
            type: String,
            enum: ["pending", "completed", "rejected"],
            default: "pending",
        },
        method: {
            type: String,
            enum: ["cash", "upi", "bank", "razorpay"],
            default: "cash",
        },
        razorpayPaymentId: String,
        note: String,
    },
    { timestamps: true }
);

export default mongoose.model("Settlement", settlementSchema);
