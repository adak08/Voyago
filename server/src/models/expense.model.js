import mongoose from "mongoose";

const splitSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    paid: { type: Boolean, default: false },
});

const expenseSchema = new mongoose.Schema(
    {
        tripId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Trip",
            required: true,
        },
        title: {
            type: String,
            required: [true, "Expense title is required"],
            trim: true,
        },
        amount: {
            type: Number,
            required: [true, "Amount is required"],
            min: [0, "Amount cannot be negative"],
        },
        currency: {
            type: String,
            default: "INR",
        },
        category: {
            type: String,
            enum: [
                "food",
                "transport",
                "accommodation",
                "activity",
                "shopping",
                "other",
            ],
            default: "other",
        },
        paidBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        splitType: {
            type: String,
            enum: ["equal", "unequal", "percentage"],
            default: "equal",
        },
        splits: [splitSchema],
        receipt: {
            type: String,
            default: null,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        notes: String,
    },
    { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);
