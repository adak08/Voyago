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

// ─── NEW: Chunk-specific prompt ───────────────────────────────────────────────
const buildChunkPrompt = ({
  destination,
  origin,
  totalDays,
  chunkDays,       // array of day numbers e.g. [3, 4, 5]
  vibe,
  preferences,
  people,
  budget,
  weather,
  route,
}) => {
  const isFirst = chunkDays[0] === 1;
  const isLast  = chunkDays[chunkDays.length - 1] === totalDays;

  const weatherSection = weather.available && weather.forecast?.length
    ? `WEATHER FORECAST (relevant days):\n${weather.forecast
        .filter((f) => chunkDays.includes(f.day))
        .map(
          (f) =>
            `  Day ${f.day} (${f.date}): ${f.condition}, ${f.temperature.min}–${f.temperature.max}°C, humidity ${f.humidity}%`
        )
        .join("\n")}`
    : "WEATHER: Data unavailable — assume pleasant weather.";

  const routeSection = route.available
    ? `TRAVEL ROUTE:\n  From ${origin} to ${destination}: ${route.distance}, ${route.duration} by ${route.mode}.`
    : `TRAVEL ROUTE: Data unavailable.`;

  const perDayBudget = budget.available && budget.breakdown?.total
    ? Math.round(budget.breakdown.total / totalDays)
    : 3000;

  const arrivalNote  = isFirst ? "Day 1 MUST include arrival logistics and hotel check-in." : "";
  const departureNote = isLast ? `Day ${totalDays} MUST include hotel check-out and return journey prep.` : "";

  // Build explicit per-day slots so Gemini knows the exact count required
  const daySchemas = chunkDays
    .map((d) => `    { "day": ${d}, "date_label": "Day ${d}", "title": "...", "theme": "...", "weather_note": "...", "activities": [...], "day_summary": "...", "estimated_day_cost": 0 }`)
    .join(",\n");

  return `
You are an expert travel planner.

TRIP DETAILS:
  Destination: ${destination}
  Origin: ${origin || "Not specified"}
  Total trip: ${totalDays} days | Travellers: ${people}
  Travel Vibe: ${vibe || "balanced"}
  Preferences: ${preferences || "No specific preferences"}

${weatherSection}
${routeSection}

BUDGET: ~₹${perDayBudget.toLocaleString("en-IN")} per day per person.

TASK:
Generate itinerary for EXACTLY ${chunkDays.length} day(s): day ${chunkDays.join(", day ")}.
${arrivalNote}
${departureNote}

CRITICAL RULES:
1. The "days" array MUST contain EXACTLY ${chunkDays.length} objects, one for each of: day ${chunkDays.join(", day ")}.
2. Do NOT skip any day. Do NOT generate days outside [${chunkDays.join(", ")}].
3. Each day MUST have 4-6 activities with realistic time slots.
4. Use real places, restaurants, and landmarks in ${destination}.
5. Every activity needs: time, title, description, location, category, cost, duration_minutes, tips, source.

Return ONLY valid JSON, no markdown:

{
  "days": [
${daySchemas}
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

// ─── NEW: Generate a single chunk of days ────────────────────────────────────
const generateChunk = async ({
  destination,
  origin,
  totalDays,
  chunkDays,
  vibe,
  preferences,
  people,
  weather,
  route,
  budget,
}) => {
  const prompt = buildChunkPrompt({
    destination,
    origin,
    totalDays,
    chunkDays,
    vibe,
    preferences,
    people,
    budget,
    weather,
    route,
  });

  const parsed = await generateJSON(prompt, "gemini-2.5-flash", 8192);
  const days = parsed.days || [];

  days.forEach((day) => {
    (day.activities || []).forEach((act) => {
      if (!act.source) act.source = "ai";
    });
  });

  return days;
};

/**
 * Generate a structured itinerary using Gemini AI.
 * For trips > CHUNK_SIZE days, splits into chunks and merges results.
 */
const CHUNK_SIZE = 3; // days per Gemini call

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
    const safeDays = Math.max(1, Number(days) || 5);

    // ── Build chunks: [[1,2,3], [4,5,6], [7]] etc. ──────────────────────────
    const chunks = [];
    for (let start = 1; start <= safeDays; start += CHUNK_SIZE) {
      const end = Math.min(start + CHUNK_SIZE - 1, safeDays);
      chunks.push(
        Array.from({ length: end - start + 1 }, (_, i) => start + i)
      );
    }

    console.log(`[ItineraryAgent] Generating ${safeDays} days in ${chunks.length} chunk(s): ${chunks.map(c => `[${c}]`).join(", ")}`);

    // ── For small trips (≤ CHUNK_SIZE), use original single prompt ──────────
    let allDays = [];

    if (chunks.length === 1) {
      // Original path — single prompt with highlights/packing_tips
      const prompt = buildPrompt({
        destination,
        origin,
        days: safeDays,
        vibe,
        preferences,
        people,
        budget,
        weather,
        route,
      });

      const parsed = await generateJSON(prompt, "gemini-2.5-flash", 8192);
      allDays = parsed.days || parsed.itinerary?.days || [];
      allDays.forEach((day) => {
        (day.activities || []).forEach((act) => {
          if (!act.source) act.source = "ai";
        });
      });

      console.log(`[ItineraryAgent] Single-chunk complete (${allDays.length} days)`);

      return {
        available: true,
        destination: parsed.destination || destination,
        days: allDays,
        highlights: parsed.highlights || [],
        packing_tips: parsed.packing_tips || [],
        local_cuisine: parsed.local_cuisine || [],
        generatedByAI: true,
      };
    }

    // ── Multi-chunk: generate each chunk sequentially then merge ────────────
    // Sequential (not parallel) to avoid Gemini rate limits
    for (const chunkDays of chunks) {
      console.log(`[ItineraryAgent] Generating chunk: days ${chunkDays[0]}-${chunkDays[chunkDays.length - 1]}`);

      const chunkArgs = { destination, origin, totalDays: safeDays, chunkDays, vibe, preferences, people, weather, route, budget };
      let chunkResult = await generateChunk(chunkArgs);

      // Validate — retry once if Gemini returned fewer days than requested
      const returnedDayNums = new Set(chunkResult.map((d) => d.day));
      const missingInChunk = chunkDays.filter((d) => !returnedDayNums.has(d));

      if (missingInChunk.length > 0) {
        console.warn(`[ItineraryAgent] Chunk [${chunkDays}] missing days [${missingInChunk}] — retrying chunk once`);
        try {
          chunkResult = await generateChunk(chunkArgs);
        } catch (retryErr) {
          console.error(`[ItineraryAgent] Chunk retry failed: ${retryErr.message}`);
        }
      }

      allDays.push(...chunkResult);
    }

    // Sort by day number and ensure all expected days are present
    allDays.sort((a, b) => (a.day || 0) - (b.day || 0));

    // Fill any missing days with fallback
    const presentDays = new Set(allDays.map((d) => d.day));
    const fallback = buildFallbackItinerary({ destination, days: safeDays, people, vibe, weather, route, budget });

    for (const fb of fallback.days) {
      if (!presentDays.has(fb.day)) {
        console.warn(`[ItineraryAgent] Day ${fb.day} missing from chunks — using fallback`);
        allDays.push(fb);
      }
    }

    allDays.sort((a, b) => (a.day || 0) - (b.day || 0));

    console.log(`[ItineraryAgent] Multi-chunk complete — total days: ${allDays.length}`);

    // Get highlights/tips from a quick meta prompt
    let highlights = [];
    let packing_tips = [];
    let local_cuisine = [];

    try {
      const metaPrompt = `
You are a travel expert. For a ${safeDays}-day trip to ${destination} with a ${vibe || "balanced"} vibe, return ONLY valid JSON (no markdown):

{
  "highlights": ["highlight 1", "highlight 2", "highlight 3"],
  "packing_tips": ["tip 1", "tip 2", "tip 3"],
  "local_cuisine": ["dish 1", "dish 2", "dish 3"]
}
      `.trim();

      const meta = await generateJSON(metaPrompt, "gemini-2.5-flash", 512);
      highlights    = meta.highlights    || [];
      packing_tips  = meta.packing_tips  || [];
      local_cuisine = meta.local_cuisine || [];
    } catch {
      highlights    = fallback.highlights;
      packing_tips  = fallback.packing_tips;
      local_cuisine = fallback.local_cuisine;
    }

    return {
      available: true,
      destination,
      days: allDays,
      highlights,
      packing_tips,
      local_cuisine,
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