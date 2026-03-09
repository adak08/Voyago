
const TICKETMASTER_BASE = "https://app.ticketmaster.com/discovery/v2";

/**
 * Format a Ticketmaster date string to a readable label.
 * @param {string} dateStr - e.g. "2025-09-14"
 * @returns {string}
 */
const formatEventDate = (dateStr) => {
  if (!dateStr) return "Date TBD";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
};

/**
 * Map Ticketmaster classification to a simple category label.
 */
const mapCategory = (classifications = []) => {
  const seg = classifications[0]?.segment?.name || "";
  const genre = classifications[0]?.genre?.name || "";
  if (seg === "Music") return genre || "Concert";
  if (seg === "Sports") return genre || "Sports";
  if (seg === "Arts & Theatre") return "Theatre / Arts";
  if (seg === "Film") return "Film";
  if (seg === "Miscellaneous") return "Event";
  return genre || seg || "Event";
};

/**
 * Fetch events at the destination within the travel period.
 *
 * @param {string} destination   - City name
 * @param {string} [startDate]   - ISO date string "YYYY-MM-DD"
 * @param {string} [endDate]     - ISO date string "YYYY-MM-DD"
 * @param {number} [limit=10]    - Max events to return
 * @returns {Promise<{
 *   available: boolean,
 *   destination: string,
 *   events: Array<{
 *     id: string,
 *     name: string,
 *     category: string,
 *     date: string,
 *     venue: string,
 *     url: string,
 *     image: string | null,
 *     priceRange: string
 *   }>,
 *   count: number,
 *   summary: string,
 *   error?: string
 * }>}
 */
export const fetchEvents = async (
  destination,
  startDate = null,
  endDate = null,
  limit = 10
) => {
  const apiKey = process.env.EVENTS_API_KEY;

  if (!apiKey) {
    console.warn("[EventsAgent] EVENTS_API_KEY is not set — skipping.");
    return unavailable(destination, "EVENTS_API_KEY not configured");
  }

  try {
    // Build Ticketmaster query
    const params = new URLSearchParams({
      apikey: apiKey,
      city: destination,
      size: String(limit),
      sort: "date,asc",
      segmentName: "Music,Sports,Arts & Theatre,Miscellaneous",
    });

    if (startDate) {
      // Ticketmaster uses format: 2024-09-01T00:00:00Z
      params.set("startDateTime", `${startDate}T00:00:00Z`);
    }
    if (endDate) {
      params.set("endDateTime", `${endDate}T23:59:59Z`);
    }

    const url = `${TICKETMASTER_BASE}/events.json?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`Ticketmaster API returned HTTP ${res.status}`);

    const data = await res.json();

    const rawEvents =
      data?._embedded?.events || [];

    const events = rawEvents.slice(0, limit).map((ev) => {
      const venue =
        ev._embedded?.venues?.[0]?.name || "Venue TBD";
      const city =
        ev._embedded?.venues?.[0]?.city?.name || destination;
      const priceMin = ev.priceRanges?.[0]?.min;
      const priceMax = ev.priceRanges?.[0]?.max;
      const priceCurrency = ev.priceRanges?.[0]?.currency || "INR";

      let priceRange = "Free / TBD";
      if (priceMin !== undefined) {
        priceRange =
          priceMax && priceMax !== priceMin
            ? `${priceCurrency} ${priceMin}–${priceMax}`
            : `${priceCurrency} ${priceMin}`;
      }

      return {
        id: ev.id,
        name: ev.name,
        category: mapCategory(ev.classifications),
        date: formatEventDate(ev.dates?.start?.localDate),
        rawDate: ev.dates?.start?.localDate || null,
        venue: `${venue}, ${city}`,
        url: ev.url || null,
        image:
          ev.images?.find((img) => img.ratio === "16_9" && img.width >= 640)
            ?.url ||
          ev.images?.[0]?.url ||
          null,
        priceRange,
      };
    });

    const categories = [...new Set(events.map((e) => e.category))];
    const summary =
      events.length > 0
        ? `Found ${events.length} event${events.length > 1 ? "s" : ""} in ${destination}: ${categories.join(", ")}.`
        : `No events found in ${destination} for the selected dates.`;

    return {
      available: true,
      destination,
      events,
      count: events.length,
      summary,
    };
  } catch (error) {
    console.error("[EventsAgent] Error:", error.message);
    return unavailable(destination, error.message);
  }
};

const unavailable = (destination, reason) => ({
  available: false,
  destination,
  events: [],
  count: 0,
  summary: "Events data unavailable.",
  error: reason,
});
