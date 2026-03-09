/**
 * Itinerary Agent
 * Uses Google Gemini (gemini-2.5-flash) to generate a structured, day-by-day
 * travel itinerary enriched with real weather, events, and budget data from
 * the other agents.
 */

import { generateJSON } from "../ai/geminiClient.js";

/**
 * Build the Gemini prompt with all contextual data injected.
 */
const buildPrompt = ({
  destination,
  origin,
  days,
  vibe,
  preferences,
  people,
  budget,
  weather,
  events,
  route,
}) => {
  const weatherSection = weather.available
    ? `WEATHER FORECAST:\n${weather.forecast
        .map(
          (f) =>
            `  Day ${f.day} (${f.date}): ${f.condition}, ${f.temperature.min}–${f.temperature.max}°C, humidity ${f.humidity}%`
        )
        .join("\n")}`
    : "WEATHER: Data unavailable — assume pleasant weather.";

  const routeSection = route.available
    ? `TRAVEL ROUTE:\n  From ${origin} to ${destination}: ${route.distance}, ${route.duration} by ${route.mode}.`
    : `TRAVEL ROUTE: Data unavailable.`;

  const eventsSection = events.available && events.count > 0
    ? `LOCAL EVENTS DURING TRIP:\n${events.events
        .slice(0, 6)
        .map((e) => `  - ${e.name} (${e.category}) on ${e.date} at ${e.venue}`)
        .join("\n")}`
    : "LOCAL EVENTS: No major events found — suggest popular local experiences.";

  const budgetSection = budget.available
    ? `BUDGET BREAKDOWN (${budget.tier} tier, ${people} person${people > 1 ? "s" : ""}):\n` +
      `  Transport: ₹${budget.breakdown.transport.toLocaleString("en-IN")}\n` +
      `  Hotel: ₹${budget.breakdown.hotel.toLocaleString("en-IN")}\n` +
      `  Food: ₹${budget.breakdown.food.toLocaleString("en-IN")}\n` +
      `  Activities: ₹${budget.breakdown.activities.toLocaleString("en-IN")}\n` +
      `  Total: ₹${budget.breakdown.total.toLocaleString("en-IN")}`
    : "BUDGET: Medium budget — suggest a mix of affordable and mid-range options.";

  return `
You are an expert travel planner specializing in group and solo trips across India and internationally.

TRIP DETAILS:
  Destination: ${destination}
  Origin: ${origin || "Not specified"}
  Duration: ${days} days
  Travellers: ${people} person${people > 1 ? "s" : ""}
  Travel Vibe: ${vibe || "balanced"}
  Preferences: ${preferences || "No specific preferences"}

${weatherSection}

${routeSection}

${eventsSection}

${budgetSection}

TASK:
Generate a detailed, realistic ${days}-day itinerary for ${destination}.

RULES:
1. Day 1 must include arrival logistics and check-in.
2. Last day must include check-out and return journey prep.
3. Schedule 4–6 activities per day (realistic for the travel vibe).
4. Factor in weather: on rainy days prefer indoor activities.
5. Include any listed local events on their scheduled dates.
6. Distribute costs within the budget breakdown provided.
7. Use real places, landmarks, restaurants, and hotels.
8. Each activity must have a realistic time slot.
9. Mix free and paid activities appropriately for the budget tier.

Return ONLY valid JSON — no explanation, no markdown fences — strictly matching this schema:

{
  "destination": "${destination}",
  "days": ${days},
  "vibe": "${vibe || "balanced"}",
  "highlights": ["top highlight 1", "top highlight 2", "top highlight 3"],
  "packing_tips": ["tip 1", "tip 2", "tip 3"],
  "local_cuisine": ["dish 1", "dish 2", "dish 3"],
  "days": [
    {
      "day": 1,
      "date_label": "Day 1",
      "title": "Arrival & Settling In",
      "theme": "arrival",
      "weather_note": "Short note about expected weather",
      "activities": [
        {
          "time": "10:00 AM",
          "title": "Activity name",
          "description": "2-3 sentence description",
          "location": "Specific venue or area",
          "category": "food | travel | activity | accommodation | other",
          "cost": 500,
          "duration_minutes": 60,
          "tips": "Practical tip for this activity",
          "source": "ai"
        }
      ],
      "day_summary": "One sentence summary of the day",
      "estimated_day_cost": 2500
    }
  ]
}
`.trim();
};

/**
 * Generate a structured itinerary using Gemini AI.
 *
 * @param {object} params
 * @param {string}  params.destination
 * @param {string}  [params.origin]
 * @param {number}  [params.days=5]
 * @param {string}  [params.vibe="balanced"]
 * @param {string}  [params.preferences]
 * @param {number}  [params.people=1]
 * @param {object}  params.weather       - Output from weatherAgent
 * @param {object}  params.events        - Output from eventsAgent
 * @param {object}  params.route         - Output from mapsAgent
 * @param {object}  params.budget        - Output from budgetAgent
 * @returns {Promise<{
 *   available: boolean,
 *   destination: string,
 *   days: Array,
 *   highlights: string[],
 *   packing_tips: string[],
 *   local_cuisine: string[],
 *   generatedByAI: boolean,
 *   error?: string
 * }>}
 */
export const generateItinerary = async ({
  destination,
  origin = "",
  days = 5,
  vibe = "balanced",
  preferences = "",
  people = 1,
  weather = { available: false },
  events = { available: false },
  route = { available: false },
  budget = { available: false },
} = {}) => {
  try {
    const prompt = buildPrompt({
      destination,
      origin,
      days,
      vibe,
      preferences,
      people,
      budget,
      weather,
      events,
      route,
    });

    const parsed = await generateJSON(prompt, "gemini-2.5-flash", 8192);

    // Normalise: Gemini sometimes nests the itinerary days under a top-level key
    const itineraryDays =
      parsed.days ||
      parsed.itinerary?.days ||
      [];

    // Stamp source = "ai" on every activity that's missing it
    itineraryDays.forEach((day) => {
      (day.activities || []).forEach((act) => {
        if (!act.source) act.source = "ai";
      });
    });

    return {
      available: true,
      destination: parsed.destination || destination,
      days: itineraryDays,
      highlights: parsed.highlights || [],
      packing_tips: parsed.packing_tips || [],
      local_cuisine: parsed.local_cuisine || [],
      generatedByAI: true,
    };
  } catch (error) {
    console.error("[ItineraryAgent] Gemini error:", error.message);
    return {
      available: false,
      destination,
      days: [],
      highlights: [],
      packing_tips: [],
      local_cuisine: [],
      generatedByAI: false,
      error: error.message,
    };
  }
};
