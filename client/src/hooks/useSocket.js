import { useEffect } from "react";
import { useSocketStore } from "../store/socketStore";
import { useTripStore } from "../store/tripStore";
import { useAuthStore } from "../store/authStore";

export const useSocket = (tripId) => {
  const { token } = useAuthStore();
  const { connect, disconnect, socket, joinTrip, leaveTrip } = useSocketStore();
  const { onExpenseAdded, setItinerary } = useTripStore();

  // Connect socket on mount
  useEffect(() => {
    if (!token) return;
    const s = connect(token);
    return () => {}; // Don't disconnect on unmount (keep alive)
  }, [token]);

  // Join/leave trip room
  useEffect(() => {
    if (!socket || !tripId) return;

    joinTrip(tripId);

    // Message listener
    socket.on("receive_message", (message) => {
      useSocketStore.getState().appendMessage(message);
    });

    // Expense sync
    socket.on("expense_added", (expense) => {
      onExpenseAdded(expense);
    });

    // Itinerary sync
    socket.on("itinerary_synced", (itinerary) => {
      setItinerary(itinerary);
    });

    // Typing indicator
    socket.on("user_typing", ({ userId, name, isTyping }) => {
      const { addTypingUser, removeTypingUser } = useSocketStore.getState();
      if (isTyping) addTypingUser({ userId, name });
      else removeTypingUser(userId);
    });

    socket.on("message_seen", (payload) => {
      useSocketStore.getState().applySeenUpdate(payload);
    });

    socket.on("reaction_updated", (payload) => {
      useSocketStore.getState().applyReactionUpdate(payload);
    });

    return () => {
      leaveTrip(tripId);
      socket.off("receive_message");
      socket.off("expense_added");
      socket.off("itinerary_synced");
      socket.off("user_typing");
      socket.off("message_seen");
      socket.off("reaction_updated");
    };
  }, [socket, tripId]);

  return useSocketStore.getState();
};
