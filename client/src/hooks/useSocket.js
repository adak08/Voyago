import { useEffect } from "react";
import { useSocketStore } from "../store/socketStore";
import { useTripStore } from "../store/tripStore";
import { useAuthStore } from "../store/authStore";

export const useSocket = (tripId) => {
  const { token } = useAuthStore();
  const { connect, disconnect, socket, joinTrip, leaveTrip } = useSocketStore();
  const { onExpenseAdded, setItinerary, appendTripPhoto, syncTripSnapshot } = useTripStore();

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
      const { expenses } = useTripStore.getState();

      const exists = expenses.some((e) => e._id === expense._id);
      if (!exists) {
        onExpenseAdded(expense);
      }
    });

    // Itinerary sync
    socket.on("itinerary_synced", (itinerary) => {
      setItinerary(itinerary);
    });

    // Photo gallery sync
    socket.on("trip_photo_uploaded", (payload) => {
      appendTripPhoto(payload);
    });

    socket.on("trip_admin_transferred", ({ trip }) => {
      if (trip?._id) {
        syncTripSnapshot(trip);
      }
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
      socket.off("trip_photo_uploaded");
      socket.off("trip_admin_transferred");
      socket.off("user_typing");
      socket.off("message_seen");
      socket.off("reaction_updated");
    };
  }, [socket, tripId]);

  return useSocketStore.getState();
};
