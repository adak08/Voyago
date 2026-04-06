
import { planTrip } from "./orchestrator/tripPlanner.js";

export const generateAIItinerary = async (params) => {
  const result = await planTrip({
    destination: params.destination || "",
    origin:      params.origin      || "",
    days:        params.days        || 5,
    people:      params.people      || 1,
    budget:      params.budget      || "medium",
    vibe:        params.vibe        || "balanced",
    preferences: params.preferences || "",
    startDate:   params.startDate   || null,
    currency:    params.currency    || "INR",
  });

  return result?.itinerary?.days || [];
};