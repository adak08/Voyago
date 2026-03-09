import { fetchWeather } from "../agents/weatherAgent.js";
import { fetchEvents } from "../agents/eventsAgent.js";
import { generateItinerary } from "../agents/itineraryAgent.js";

const normalizeTier = (raw = "") => {
    const lower = raw.toLowerCase();
    if (["low", "budget", "cheap", "economy"].includes(lower)) return "low";
    if (["high", "luxury", "premium", "expensive"].includes(lower))
        return "high";
    return "medium";
};

const resolveDates = (startDate, days) => {
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + Math.max(1, days) - 1);

    const fmt = (d) => d.toISOString().split("T")[0];
    return { startDate: fmt(start), endDate: fmt(end) };
};

/**
 * Wrap any agent call so a failure returns the agent's unavailable shape
 * without rejecting the whole Promise.all.
 */
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
    const [weather, events] = await Promise.all([
        safe(fetchWeather(destination, safeDays), {
            available: false,
            destination,
            forecast: [],
            summary: "Weather unavailable.",
        }),

        safe(fetchEvents(destination, resolvedStart, resolvedEnd), {
            available: false,
            destination,
            events: [],
            count: 0,
            summary: "Events unavailable.",
        }),
    ]);

    console.log(
        `[Orchestrator] Data agents complete — ` +
            `weather:${weather.available} events:${events.available}`
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
            events,
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
        `[Orchestrator] Itinerary generation complete — available:${itinerary.available}`
    );

    // ─── Phase 3: Assemble final response ─────────────────────────────────────
    const agentStatus = {
        weather: weather.available ? "ok" : "unavailable",
        events: events.available ? "ok" : "unavailable",
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
        events,
        itinerary,
        agentStatus,
        generatedAt: new Date().toISOString(),
    };
};
