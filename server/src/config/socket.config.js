import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "../models/message.model.js";
import { createNotification } from "../services/notification.service.js";

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

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
    socket.on("send_message", async ({ tripId, message }) => {
      try {
        const newMessage = await Message.create({
          sender: socket.userId,
          tripId,
          message,
        });

        const populated = await newMessage.populate("sender", "name avatar");

        io.to(tripId).emit("receive_message", populated);

        // Notify other trip members
        await createNotification({
          type: "NEW_MESSAGE",
          tripId,
          senderId: socket.userId,
          message: `${socket.userName} sent a message`,
        });

      } catch (err) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Typing indicator
    socket.on("typing", ({ tripId, isTyping }) => {
      socket.to(tripId).emit("user_typing", {
        userId: socket.userId,
        name: socket.userName,
        isTyping,
      });
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
