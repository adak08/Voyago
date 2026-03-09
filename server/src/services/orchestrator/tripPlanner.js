import { fetchWeather } from "../agents/weatherAgent.js";
import { fetchRoute } from "../agents/mapsAgent.js";
import { estimateBudget } from "../agents/budgetAgent.js";
import { generateItinerary } from "../agents/itineraryAgent.js";


const normalizeTier = (raw = "") => {
  const lower = raw.toLowerCase();
  if (["low", "budget", "cheap", "economy"].includes(lower)) return "low";
  if (["high", "luxury", "premium", "expensive"].includes(lower)) return "high";
  return "medium";
};


const resolveDates = (startDate, days) => {
  const start = startDate ? new Date(startDate) : new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + Math.max(1, days) - 1);

  const fmt = (d) => d.toISOString().split("T")[0];
  return { startDate: fmt(start), endDate: fmt(end) };
};


const safe = (promise, fallback) =>
  promise.catch((err) => {
    console.error("[Orchestrator] Agent error:", err.message);
    return fallback;
  });


export const planTrip = async ({
  destination,
  origin = "",
  days = 5,
  people = 1,
  budget = "medium",
  vibe = "balanced",
  preferences = "",
  startDate = null,
  currency = "INR",
} = {}) => {
  if (!destination) {
    return {
      success: false,
      error: "destination is required",
      generatedAt: new Date().toISOString(),
    };
  }

  const safeDays = Math.max(1, Math.min(30, Number(days) || 5));
  const safePeople = Math.max(1, Number(people) || 1);
  const tier = normalizeTier(budget);
  const { startDate: resolvedStart, endDate: resolvedEnd } = resolveDates(
    startDate,
    safeDays
  );

  console.log(
    `[Orchestrator] Planning trip: ${origin || "??"} → ${destination} | ` +
    `${safeDays}d | ${tier} | ${safePeople} pax | ${resolvedStart}–${resolvedEnd}`
  );

  // ─── Phase 1: Run data agents in parallel ──────────────────────────────────
  const [weather, route, budget_data] = await Promise.all([
    safe(
      fetchWeather(destination, safeDays),
      { available: false, destination, forecast: [], summary: "Weather unavailable." }
    ),
    safe(
      origin
        ? fetchRoute({ origin, destination })
        : Promise.resolve({ available: false, summary: "No origin provided." }),
      { available: false, origin, destination, summary: "Route unavailable." }
    ),
    safe(
      estimateBudget({
        destination,
        days: safeDays,
        people: safePeople,
        tier,
        currency,
      }),
      {
        available: false,
        breakdown: { transport: 0, hotel: 0, food: 0, activities: 0, total: 0 },
        summary: "Budget estimation unavailable.",
      }
    ),
  ]);

  console.log(
    `[Orchestrator] Data agents complete — ` +
    `weather:${weather.available} route:${route.available} ` +
    `budget:${budget_data.available}`
  );

  // ─── Phase 2: Itinerary generation (Gemini) ────────────────────────────────
  const itinerary = await safe(
    generateItinerary({
      destination,
      origin,
      days: safeDays,
      vibe,
      preferences,
      people: safePeople,
      weather,
      route,
      budget: budget_data,
    }),
    {
      available: false,
      destination,
      days: [],
      highlights: [],
      packing_tips: [],
      local_cuisine: [],
      generatedByAI: false,
      error: "Itinerary generation failed.",
    }
  );

  console.log(
    `[Orchestrator] Itinerary generation complete — available:${itinerary.available} source:${itinerary.generatedByAI ? "ai" : "fallback"}`
  );

  // ─── Phase 3: Assemble final response ─────────────────────────────────────
  const agentStatus = {
    weather: weather.available ? "ok" : "unavailable",
    route: route.available ? "ok" : "unavailable",
    budget: budget_data.available ? "ok" : "unavailable",
    itinerary: itinerary.available ? "ok" : "unavailable",
  };

  const meta = {
    destination,
    origin: origin || null,
    days: safeDays,
    people: safePeople,
    budget_tier: tier,
    vibe,
    preferences: preferences || null,
    start_date: resolvedStart,
    end_date: resolvedEnd,
    currency,
  };

  return {
    success: itinerary.available,
    meta,
    weather,
    route,
    budget: budget_data,
    itinerary,
    agentStatus,
    generatedAt: new Date().toISOString(),
  };
};