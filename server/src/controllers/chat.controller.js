import Message from "../models/message.model.js";
import Trip from "../models/trip.model.js";
import { cloudinary } from "../config/cloudinary.config.js";
import { Readable } from "stream";

// @GET /api/trips/:tripId/messages - Get chat history
export const getMessages = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const before = req.query.before;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ success: false, message: "Trip not found" });

    const isMember = trip.members.some((m) => m.user.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ success: false, message: "Not a member" });

    const query = { tripId };

    if (before) {
      const cursorMessage = await Message.findOne({ _id: before, tripId }).select("createdAt");

      if (cursorMessage) {
        query.createdAt = { $lt: cursorMessage.createdAt };
      }
    }

    const messages = await Message.find(query)
      .populate("sender", "name avatar")
      .sort({ createdAt: -1 })
      .limit(limit);

    const oldest = messages[messages.length - 1] || null;
    let hasMore = false;

    if (oldest) {
      const olderCount = await Message.countDocuments({
        tripId,
        createdAt: { $lt: oldest.createdAt },
      });
      hasMore = olderCount > 0;
    }

    res.json({
      success: true,
      messages: messages.reverse(),
      hasMore,
      nextCursor: hasMore && oldest ? oldest._id : null,
    });
  } catch (err) {
    next(err);
  }
};

// @POST /api/trips/:tripId/messages - Send message (REST fallback)
export const sendMessage = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { message, type = "text", mediaUrl, fileName } = req.body;

    const payload = {
      sender: req.user.id,
      tripId,
      type,
      message,
      mediaUrl,
      fileName,
      readBy: [req.user.id],
    };

    const newMessage = await Message.create(payload);

    const populated = await newMessage.populate("sender", "name avatar");
    res.status(201).json({ success: true, message: populated });
  } catch (err) {
    next(err);
  }
};

// @POST /api/v1/chat/upload - Upload chat media
export const uploadChatMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const mimeType = req.file.mimetype || "application/octet-stream";
    const uploaded = await uploadBufferToCloudinary(req.file);

    res.status(201).json({
      success: true,
      url: uploaded.secure_url,
      type: mimeType,
    });
  } catch (err) {
    next(err);
  }
};

const uploadBufferToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "smart-trip-planner/chat",
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
