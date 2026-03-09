
import { generateItinerary } from "./agents/itineraryAgent.js";

export const generateAIItinerary = async (params) => {
  const result = await generateItinerary({
    tripParams: {
      destination: params.destination || "",
      origin:      params.origin      || "",
      days:        params.days        || 5,
      people:      params.people      || 1,
      budget:      params.budget      || "medium",
      vibe:        params.vibe        || "balanced",
      preferences: params.preferences || "",
      startDate:   params.startDate   || null,
    },
    weatherData:   params.weatherData  || { available: false },
    routeData:     params.routeData    || { available: false },
    budgetData:    params.budgetData   || { available: false },
  });

  return result;
};