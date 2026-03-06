import Message from "../models/message.model.js";
import Trip from "../models/trip.model.js";

// @GET /api/trips/:tripId/messages - Get chat history
export const getMessages = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ success: false, message: "Trip not found" });

    const isMember = trip.members.some((m) => m.user.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ success: false, message: "Not a member" });

    const messages = await Message.find({ tripId })
      .populate("sender", "name avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({ tripId });

    res.json({
      success: true,
      messages: messages.reverse(),
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// @POST /api/trips/:tripId/messages - Send message (REST fallback)
export const sendMessage = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { message } = req.body;

    const newMessage = await Message.create({
      sender: req.user.id,
      tripId,
      message,
    });

    const populated = await newMessage.populate("sender", "name avatar");
    res.status(201).json({ success: true, message: populated });
  } catch (err) {
    next(err);
  }
};
