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
            trim: true,
            maxlength: [1000, "Message too long"],
        },
        type: {
            type: String,
            enum: ["text", "image", "video", "file", "audio", "system"],
            default: "text",
        },
        mediaUrl: {
            type: String,
            trim: true,
        },
        fileName: {
            type: String,
            trim: true,
        },
        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        reactions: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                emoji: {
                    type: String,
                    required: true,
                    trim: true,
                    maxlength: [16, "Emoji too long"],
                },
            },
        ],
    },
    { timestamps: true }
);

messageSchema.pre("validate", function validateMessage(next) {
    const needsText = this.type === "text" || this.type === "system";
    const needsMedia = ["image", "video", "file", "audio"].includes(this.type);

    if (needsText && !this.message) {
        this.invalidate("message", "Message cannot be empty");
    }

    if (needsMedia && !this.mediaUrl) {
        this.invalidate("mediaUrl", "Media URL is required for media messages");
    }

    next();
});

// Index for fast chat retrieval
messageSchema.index({ tripId: 1, createdAt: 1 });

export default mongoose.model("Message", messageSchema);
