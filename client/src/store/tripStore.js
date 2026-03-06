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

  leaveTrip: async (tripId) => {
    await tripService.leaveTrip(tripId);
    set((state) => ({ trips: state.trips.filter((t) => t._id !== tripId) }));
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

  addExpense: (expense) => {
    set((state) => ({ expenses: [expense, ...state.expenses] }));
  },

  // Real-time: expense added by another user
  onExpenseAdded: (expense) => {
    set((state) => {
      const exists = state.expenses.find((e) => e._id === expense._id);
      if (exists) return {};
      return { expenses: [expense, ...state.expenses] };
    });
  },

  // Messages
  setMessages: (messages) => set({ messages }),
  appendMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  },

  // Itinerary
  setItinerary: (itinerary) => set({ itinerary }),

  clearCurrentTrip: () => set({ currentTrip: null, expenses: [], balances: [], messages: [], itinerary: null }),
}));
