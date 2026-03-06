import Notification from "../models/notification.model.js";
import Trip from "../models/trip.model.js";

let io;

// Called after socket is initialized
const setIO = (socketIO) => {
  io = socketIO;
};

const createNotification = async ({ recipient, sender, type, message, tripId, data }) => {
  try {
    // If recipient is the sender, skip
    if (recipient?.toString() === sender?.toString()) return;

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      message,
      tripId,
      data,
    });

    // Push via socket
    if (io) {
      io.to(`user_${recipient}`).emit("new_notification", notification);
    }

    return notification;
  } catch (err) {
    console.error("Notification creation failed:", err.message);
  }
};

// Create notifications for all trip members except sender
const notifyTripMembers = async ({ tripId, senderId, type, message, data }) => {
  try {
    const trip = await Trip.findById(tripId);
    if (!trip) return;

    const recipients = trip.members
      .map((m) => m.user)
      .filter((userId) => userId.toString() !== senderId?.toString());

    for (const recipient of recipients) {
      await createNotification({ recipient, sender: senderId, type, message, tripId, data });
    }
  } catch (err) {
    console.error("Bulk notification failed:", err.message);
  }
};

export { createNotification, notifyTripMembers, setIO };
