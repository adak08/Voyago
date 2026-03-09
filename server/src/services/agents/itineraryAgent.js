import { generateJSON } from "../ai/geminiClient.js";


const buildPrompt = ({
  destination,
  origin,
  days,
  vibe,
  preferences,
  people,
  budget,
  weather,
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

${budgetSection}

TASK:
Generate a detailed, realistic ${days}-day itinerary for ${destination}.

RULES:
1. Day 1 must include arrival logistics and check-in.
2. Last day must include check-out and return journey prep.
3. Schedule 4–6 activities per day (realistic for the travel vibe).
4. Factor in weather: on rainy days prefer indoor activities.
5. Distribute costs within the budget breakdown provided.
6. Use real places, landmarks, restaurants, and hotels.
7. Each activity must have a realistic time slot.
8. Mix free and paid activities appropriately for the budget tier.

Return ONLY valid JSON — no explanation, no markdown fences — strictly matching this schema:

{
  "destination": "${destination}",
  "trip_days": ${days},
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

const fallbackActivity = (time, title, description, location, category, cost, duration, tips) => ({
  time,
  title,
  description,
  location,
  category,
  cost,
  duration_minutes: duration,
  tips,
  source: "fallback",
});

const buildFallbackItinerary = ({ destination, days, people, vibe, weather, route, budget }) => {
  const safeDays = Math.max(1, Number(days) || 1);
  const hasBudget = budget?.available && Number.isFinite(budget?.breakdown?.total);
  const perDayBudget = hasBudget
    ? Math.max(1200, Math.round(budget.breakdown.total / safeDays))
    : 3000;

  const weatherByDay = new Map((weather?.forecast || []).map((w) => [w.day, w]));

  const itineraryDays = Array.from({ length: safeDays }, (_, idx) => {
    const dayNumber = idx + 1;
    const isFirst = dayNumber === 1;
    const isLast = dayNumber === safeDays;
    const dayWeather = weatherByDay.get(dayNumber);
    const rainy = /rain|storm|drizzle/i.test(dayWeather?.condition || "");

    const baseCost = Math.round(perDayBudget * 0.2);
    const activities = [
      fallbackActivity(
        "09:00 AM",
        isFirst ? `Arrive in ${destination} and Check-in` : `Breakfast and Plan the Day`,
        isFirst
          ? `Arrive, transfer to accommodation, and settle in before starting local exploration.`
          : `Start with a relaxed breakfast and align your route for today's activities.`,
        `${destination} City Center`,
        isFirst ? "travel" : "food",
        baseCost,
        90,
        "Keep essentials and ID ready for smooth transitions."
      ),
      fallbackActivity(
        "11:30 AM",
        rainy ? "Indoor Cultural Experience" : "Local Landmark Exploration",
        rainy
          ? `Visit a museum, gallery, or palace complex to avoid rain disruptions.`
          : `Explore a signature landmark and nearby heritage streets for the local vibe.`,
        `${destination} Main Attraction Area`,
        "activity",
        Math.round(perDayBudget * 0.25),
        120,
        rainy ? "Carry a light layer and keep plans flexible for weather changes." : "Start early to avoid peak crowds."
      ),
      fallbackActivity(
        "02:30 PM",
        "Regional Lunch Break",
        `Try local cuisine with options matching a ${vibe || "balanced"} travel style.`,
        `${destination} Popular Food District`,
        "food",
        Math.round(perDayBudget * 0.2),
        75,
        "Ask for local specialties and seasonal dishes."
      ),
      fallbackActivity(
        "05:00 PM",
        isLast ? "Leisure Walk and Packing Prep" : "Evening Market / Sunset Spot",
        isLast
          ? "Wrap up shopping, organize luggage, and prepare for the return journey."
          : "Enjoy a relaxed evening at a market, viewpoint, or riverside promenade.",
        `${destination} Evening Zone`,
        isLast ? "other" : "activity",
        Math.round(perDayBudget * 0.15),
        90,
        isLast ? "Keep tickets and essentials in your day bag." : "Carry cash/card mix for small vendors."
      ),
      fallbackActivity(
        "08:00 PM",
        isLast ? "Check-out and Return Journey Prep" : "Dinner and Rest",
        isLast
          ? route?.available
            ? `Prepare for departure (${route.duration || "route"}, ${route.mode || "preferred mode"}) and confirm transfers.`
            : "Prepare for departure and confirm next-day transport/check-out timing."
          : "Have a relaxed dinner and review next day's plan.",
        `${destination}`,
        isLast ? "travel" : "food",
        Math.round(perDayBudget * 0.2),
        60,
        "Sleep early for better next-day energy."
      ),
    ];

    return {
      day: dayNumber,
      date_label: `Day ${dayNumber}`,
      title: isFirst
        ? "Arrival and Orientation"
        : isLast
          ? "Wrap-up and Departure"
          : `Explore ${destination} - Day ${dayNumber}`,
      theme: isFirst ? "arrival" : isLast ? "departure" : "exploration",
      weather_note: dayWeather
        ? `${dayWeather.condition}, ${dayWeather.temperature?.min}–${dayWeather.temperature?.max}°C expected.`
        : "Weather details unavailable; keep a flexible plan.",
      activities,
      day_summary: isLast
        ? `Final day focused on smooth departure from ${destination}.`
        : `Balanced day with local experiences and practical pacing.`,
      estimated_day_cost: activities.reduce((sum, a) => sum + (a.cost || 0), 0),
    };
  });

  return {
    available: true,
    destination,
    days: itineraryDays,
    highlights: [
      `Curated ${safeDays}-day plan for ${destination}`,
      route?.available ? `Route-aware pacing based on ${route.distance}` : "Balanced city exploration flow",
      hasBudget ? `Cost-aware plan aligned with ${budget.tier} budget` : "Practical day-wise cost estimates",
    ],
    packing_tips: [
      "Carry a reusable water bottle and comfortable walking shoes.",
      "Keep one photo ID and digital copies of bookings.",
      "Set aside a small buffer budget for local transport and tips.",
    ],
    local_cuisine: ["Regional thali", "Popular local street food", "Traditional sweet specialty"],
    generatedByAI: false,
  };
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

    console.log(`[ItineraryAgent] Gemini itinerary generated (${itineraryDays.length} day(s))`);

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
    const fallback = buildFallbackItinerary({
      destination,
      days,
      people,
      vibe,
      weather,
      route,
      budget,
    });

    return {
      ...fallback,
      error: `Gemini unavailable, fallback itinerary generated: ${error.message}`,
    };
  }
};
