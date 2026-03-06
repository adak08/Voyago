import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        tripId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Trip",
            required: true,
        },
        message: {
            type: String,
            required: [true, "Message cannot be empty"],
            maxlength: [1000, "Message too long"],
        },
        type: {
            type: String,
            enum: ["text", "image", "system"],
            default: "text",
        },
        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    { timestamps: true }
);

// Index for fast chat retrieval
messageSchema.index({ tripId: 1, createdAt: 1 });

export default mongoose.model("Message", messageSchema);
