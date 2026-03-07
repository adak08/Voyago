import { create } from "zustand";
import { io } from "socket.io-client";

const getMessageKey = (message) => {
  if (message?._id) return `id:${message._id}`;
  if (message?.tempId) return `temp:${message.tempId}`;
  return `fallback:${message?.tripId || "na"}:${message?.createdAt || Date.now()}:${message?.message || ""}`;
};

const dedupeMessages = (messages = []) => {
  const indexed = new Map();

  messages.forEach((msg) => {
    indexed.set(getMessageKey(msg), msg);
  });

  return Array.from(indexed.values());
};

const buildReactionMap = (messages = []) =>
  messages.reduce((acc, msg) => {
    if (msg?._id) acc[msg._id] = msg.reactions || [];
    return acc;
  }, {});

export const useSocketStore = create((set, get) => ({
  socket: null,
  connected: false,
  messages: [],
  typingUsers: [],
  reactions: {},

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
      set({ socket: null, connected: false, messages: [], typingUsers: [], reactions: {} });
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

  setMessages: (messages = []) => {
    const nextMessages = dedupeMessages(messages);
    set({ messages: nextMessages, reactions: buildReactionMap(nextMessages) });
  },

  appendMessage: (message) => {
    if (!message) return;

    set((state) => {
      if (message._id && state.messages.some((m) => m._id === message._id)) {
        return {};
      }

      if (message._id) {
        const optimisticIndex = state.messages.findIndex(
          (m) =>
            m?.optimistic &&
            (m.sender?._id === message.sender?._id || m.sender === message.sender?._id) &&
            m.tripId === message.tripId &&
            m.type === message.type &&
            (m.message || "") === (message.message || "") &&
            (m.mediaUrl || "") === (message.mediaUrl || "")
        );

        if (optimisticIndex > -1) {
          const next = [...state.messages];
          next[optimisticIndex] = message;
          const normalized = dedupeMessages(next);
          return {
            messages: normalized,
            reactions: buildReactionMap(normalized),
          };
        }
      }

      const normalized = dedupeMessages([...state.messages, message]);

      return {
        messages: normalized,
        reactions: buildReactionMap(normalized),
      };
    });
  },

  updateMessage: (tempId, nextMessage) => {
    set((state) => {
      const index = state.messages.findIndex((m) => m._id === tempId || m.tempId === tempId);
      if (index === -1) {
        if (!nextMessage) return {};
        const normalized = dedupeMessages([...state.messages, nextMessage]);
        return { messages: normalized, reactions: buildReactionMap(normalized) };
      }

      const updated = [...state.messages];
      updated[index] = nextMessage;
      const normalized = dedupeMessages(updated);

      return {
        messages: normalized,
        reactions: buildReactionMap(normalized),
      };
    });
  },

  sendMessage: (payload, callback) => {
    const { socket } = get();
    socket?.emit("send_message", payload, callback);
  },

  sendTyping: (tripId, isTyping) => {
    const { socket } = get();
    socket?.emit("typing", { tripId, isTyping });
  },

  markMessagesSeen: (tripId) => {
    const { socket } = get();
    socket?.emit("message_seen", { tripId });
  },

  addReaction: (tripId, messageId, emoji) => {
    const { socket } = get();
    socket?.emit("add_reaction", { tripId, messageId, emoji });
  },

  removeReaction: (tripId, messageId) => {
    const { socket } = get();
    socket?.emit("remove_reaction", { tripId, messageId });
  },

  applySeenUpdate: ({ userId }) => {
    if (!userId) return;
    set((state) => ({
      messages: state.messages.map((msg) => {
        const readBy = msg.readBy || [];
        const already = readBy.some((id) => String(id) === String(userId));
        if (already) return msg;
        return { ...msg, readBy: [...readBy, userId] };
      }),
    }));
  },

  applyReactionUpdate: ({ messageId, reactions }) => {
    if (!messageId) return;
    set((state) => ({
      reactions: {
        ...state.reactions,
        [messageId]: reactions || [],
      },
      messages: state.messages.map((msg) =>
        msg._id === messageId ? { ...msg, reactions: reactions || [] } : msg
      ),
    }));
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
