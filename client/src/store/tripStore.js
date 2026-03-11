import { create } from "zustand";
import { tripService } from "../services/tripService";
import { expenseService } from "../services/expenseService";

export const useTripStore = create((set, get) => ({
  trips: [],
  currentTrip: null,
  expenses: [],
  balances: [],
  itinerary: null,
  messages: [],
  loading: false,
  error: null,

  // Trips
  fetchTrips: async () => {
    set({ loading: true });
    try {
      const data = await tripService.getUserTrips();
      set({ trips: data.trips, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchTrip: async (id) => {
    set({ loading: true });
    try {
      const data = await tripService.getTripById(id);
      set({ currentTrip: data.trip, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  createTrip: async (tripData) => {
    try {
      const data = await tripService.createTrip(tripData);
      set((state) => ({ trips: [data.trip, ...state.trips] }));
      return data.trip;
    } catch (err) {
      throw err;
    }
  },

  joinTrip: async (inviteCode) => {
    try {
      const data = await tripService.joinTrip(inviteCode);
      set((state) => ({ trips: [data.trip, ...state.trips] }));
      return data.trip;
    } catch (err) {
      throw err;
    }
  },

  updateTrip: async (tripId, updates) => {
    const res = await tripService.updateTrip(tripId, updates);

    set((state) => ({
      trips: state.trips.map((t) => (t._id === tripId ? res.trip : t)),
    }));

    return res.trip;
  },

  deleteTrip: async (tripId) => {
    await tripService.deleteTrip(tripId);

    set((state) => ({
      trips: state.trips.filter((t) => t._id !== tripId),
    }));
  },

  leaveTrip: async (tripId) => {
    await tripService.leaveTrip(tripId);

    set((state) => ({
      trips: state.trips.filter((t) => t._id !== tripId),
    }));
  },

  syncTripSnapshot: (trip) => {
    if (!trip?._id) return;

    set((state) => ({
      currentTrip: state.currentTrip?._id === trip._id ? trip : state.currentTrip,
      trips: state.trips.map((item) => (item._id === trip._id ? trip : item)),
    }));
  },

  transferAdmin: async (tripId, newAdminId) => {
    const res = await tripService.transferAdmin(tripId, newAdminId);

    get().syncTripSnapshot(res.trip);

    return res.trip;
  },

  // Expenses
  fetchExpenses: async (tripId) => {
    const data = await expenseService.getTripExpenses(tripId);
    set({ expenses: data.expenses });
  },

  fetchBalances: async (tripId) => {
    const data = await expenseService.getTripBalances(tripId);
    set({ balances: data.balances });
  },

  addExpense: (expense) =>
    set((state) => {
      const exists = state.expenses.some((e) => e._id === expense._id);

      if (exists) {
        return { expenses: state.expenses };
      }

      return {
        expenses: [...state.expenses, expense],
      };
    }),

  // Real-time: expense added by another user
  onExpenseAdded: (expense) =>
    set((state) => {
      const exists = state.expenses.some((e) => e._id === expense._id);

      if (exists) {
        return { expenses: state.expenses };
      }

      return {
        expenses: [...state.expenses, expense],
      };
    }),

  // Messages
  setMessages: (messages) => set({ messages }),
  appendMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  },

  // Itinerary
  setItinerary: (itinerary) => set({ itinerary }),

  appendTripPhoto: ({ tripId, photo, coverImage }) =>
    set((state) => {
      if (!tripId || !photo) return {};

      const currentTripMatches = state.currentTrip?._id === tripId;
      const photoExists = state.currentTrip?.photos?.some(
        (p) => String(p._id) === String(photo._id),
      );

      const nextCurrentTrip = currentTripMatches
        ? {
            ...state.currentTrip,
            coverImage: coverImage || state.currentTrip.coverImage,
            photos: photoExists
              ? state.currentTrip.photos
              : [...(state.currentTrip.photos || []), photo],
          }
        : state.currentTrip;

      const nextTrips = state.trips.map((trip) => {
        if (trip._id !== tripId) return trip;

        const exists = (trip.photos || []).some(
          (p) => String(p._id) === String(photo._id),
        );

        return {
          ...trip,
          coverImage: coverImage || trip.coverImage,
          photos: exists ? trip.photos || [] : [...(trip.photos || []), photo],
        };
      });

      return {
        currentTrip: nextCurrentTrip,
        trips: nextTrips,
      };
    }),

  clearCurrentTrip: () =>
    set({
      currentTrip: null,
      expenses: [],
      balances: [],
      messages: [],
      itinerary: null,
    }),
}));
