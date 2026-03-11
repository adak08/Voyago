import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import jwt from "jsonwebtoken";
import Message from "../models/message.model.js";
import Trip from "../models/trip.model.js";
import { createNotification } from "../services/notification.service.js";

let io;

const isTripMember = async (tripId, userId) => {
  const trip = await Trip.exists({ _id: tripId, "members.user": userId });
  return Boolean(trip);
};

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  if (process.env.REDIS_URL) {
    const redisConfig = {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
      reconnectOnError: () => false,
    };

    const pubClient = new Redis(process.env.REDIS_URL, redisConfig);
    const subClient = pubClient.duplicate(redisConfig);

    pubClient.on("error", (err) => {
      console.error("Redis pub client error:", err.message);
    });

    subClient.on("error", (err) => {
      console.error("Redis sub client error:", err.message);
    });

    Promise.all([pubClient.connect(), subClient.connect()])
      .then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        console.log("Socket.IO using Redis adapter");
      })
      .catch((err) => {
        console.error("Redis adapter setup failed:", err.message);
        pubClient.disconnect();
        subClient.disconnect();
        console.log("Socket.IO using in-memory adapter (single server only)");
      });
  } else {
    console.log("Socket.IO using in-memory adapter (single server only)");
  }

  // Auth middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication error"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userName = decoded.name;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.userId}`);

    // Join a trip room
    socket.on("join_trip", (tripId) => {
      socket.join(tripId);
      console.log(`User ${socket.userId} joined trip room: ${tripId}`);
    });

    // Leave a trip room
    socket.on("leave_trip", (tripId) => {
      socket.leave(tripId);
    });

    // Send message
    socket.on("send_message", async ({ tripId, message, type = "text", mediaUrl, fileName }, callback) => {
      try {
        const member = await isTripMember(tripId, socket.userId);
        if (!member) {
          socket.emit("error", { message: "Not a trip member" });
          return;
        }

        const payload = {
          sender: socket.userId,
          tripId,
          type,
          message,
          mediaUrl,
          fileName,
          readBy: [socket.userId],
        };

        const newMessage = await Message.create({
          ...payload,
        });

        const populated = await newMessage.populate("sender", "name avatar");

        io.to(tripId).emit("receive_message", populated);
        if (typeof callback === "function") callback({ success: true, message: populated });

        // Notify other trip members
        await createNotification({
          type: "NEW_MESSAGE",
          tripId,
          senderId: socket.userId,
          message: `${socket.userName} sent a message`,
        });

      } catch (err) {
        if (typeof callback === "function") callback({ success: false, message: "Failed to send message" });
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Typing indicator
    socket.on("typing", ({ tripId, isTyping }) => {
      socket.to(tripId).emit("user_typing", {
        tripId,
        userId: socket.userId,
        name: socket.userName,
        isTyping,
      });
    });

    // Mark messages as seen for current user
    socket.on("message_seen", async ({ tripId }) => {
      try {
        const member = await isTripMember(tripId, socket.userId);
        if (!member) return;

        await Message.updateMany(
          { tripId, readBy: { $ne: socket.userId } },
          { $addToSet: { readBy: socket.userId } }
        );

        io.to(tripId).emit("message_seen", {
          tripId,
          userId: socket.userId,
        });
      } catch {
        socket.emit("error", { message: "Failed to update seen status" });
      }
    });

    // Add/update reaction on a message
    socket.on("add_reaction", async ({ tripId, messageId, emoji }) => {
      try {
        const member = await isTripMember(tripId, socket.userId);
        if (!member) return;

        const message = await Message.findOne({ _id: messageId, tripId });
        if (!message) return;

        message.reactions = (message.reactions || []).filter(
          (reaction) => reaction.userId.toString() !== socket.userId
        );
        message.reactions.push({ userId: socket.userId, emoji });
        await message.save();

        io.to(tripId).emit("reaction_updated", {
          tripId,
          messageId,
          reactions: message.reactions,
        });
      } catch {
        socket.emit("error", { message: "Failed to add reaction" });
      }
    });

    // Remove reaction by current user
    socket.on("remove_reaction", async ({ tripId, messageId }) => {
      try {
        const member = await isTripMember(tripId, socket.userId);
        if (!member) return;

        const message = await Message.findOne({ _id: messageId, tripId });
        if (!message) return;

        message.reactions = (message.reactions || []).filter(
          (reaction) => reaction.userId.toString() !== socket.userId
        );
        await message.save();

        io.to(tripId).emit("reaction_updated", {
          tripId,
          messageId,
          reactions: message.reactions,
        });
      } catch {
        socket.emit("error", { message: "Failed to remove reaction" });
      }
    });

    // Expense added - real-time sync
    socket.on("expense_added", ({ tripId, expense }) => {
      socket.to(tripId).emit("expense_updated", expense);
    });

    // Itinerary updated - real-time sync
    socket.on("itinerary_updated", ({ tripId, itinerary }) => {
      socket.to(tripId).emit("itinerary_synced", itinerary);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

export { initSocket, getIO };
