import { create } from "zustand";
import { io } from "socket.io-client";

export const useSocketStore = create((set, get) => ({
  socket: null,
  connected: false,
  typingUsers: [],

  connect: (token) => {
    const { socket } = get();
    if (socket?.connected) return;

    const newSocket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      set({ connected: true });
      console.log("🔌 Socket connected");
    });

    newSocket.on("disconnect", () => {
      set({ connected: false });
    });

    set({ socket: newSocket });
    return newSocket;
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, connected: false });
    }
  },

  joinTrip: (tripId) => {
    const { socket } = get();
    socket?.emit("join_trip", tripId);
  },

  leaveTrip: (tripId) => {
    const { socket } = get();
    socket?.emit("leave_trip", tripId);
  },

  sendMessage: (tripId, message) => {
    const { socket } = get();
    socket?.emit("send_message", { tripId, message });
  },

  sendTyping: (tripId, isTyping) => {
    const { socket } = get();
    socket?.emit("typing", { tripId, isTyping });
  },

  addTypingUser: (user) => {
    set((state) => {
      if (state.typingUsers.find((u) => u.userId === user.userId)) return {};
      return { typingUsers: [...state.typingUsers, user] };
    });
  },

  removeTypingUser: (userId) => {
    set((state) => ({ typingUsers: state.typingUsers.filter((u) => u.userId !== userId) }));
  },
}));
