import api from "./api";

export const tripService = {
  createTrip: async (data) => {
    const res = await api.post("/trips", data);
    return res.data;
  },
  createTripFromAIPlan: async (data) => {
    const res = await api.post("/trips/ai-import", data);
    return res.data;
  },
  getUserTrips: async () => {
    const res = await api.get("/trips");
    return res.data;
  },
  getTripById: async (id) => {
    const res = await api.get(`/trips/${id}`);
    return res.data;
  },
  joinTrip: async (inviteCode) => {
    const res = await api.post("/trips/join", { inviteCode });
    return res.data;
  },
  leaveTrip: async (id) => {
    const res = await api.delete(`/trips/${id}/leave`);
    return res.data;
  },
  updateTrip: async (id, data) => {
    const res = await api.put(`/trips/${id}`, data);
    return res.data;
  },
  deleteTrip: async (id) => {
    const res = await api.delete(`/trips/${id}`);
    return res.data;
  },
  uploadPhoto: async (id, formData) => {
    const res = await api.post(`/trips/${id}/upload`, formData);
    return res.data;
  },
  getMessages: async (tripId, page = 1) => {
    const res = await api.get(`/trips/${tripId}/messages?page=${page}`);
    return res.data;
  },
  uploadChatMedia: async (formData) => {
    const res = await api.post(`/chat/upload`, formData);
    return res.data;
  },
  getItinerary: async (tripId) => {
    const res = await api.get(`/itinerary/${tripId}`);
    return res.data;
  },
  updateItinerary: async (tripId, days) => {
    const res = await api.put(`/itinerary/${tripId}`, { days });
    return res.data;
  },
  generateItinerary: async (tripId, params) => {
    const res = await api.post(`/itinerary/${tripId}/generate`, params);
    return res.data;
  },
};
