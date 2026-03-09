const ORS_BASE = "https://api.openrouteservice.org";

// ─── Geocode a city/place name → [longitude, latitude] ───────────────────────
const geocode = async (placeName) => {
  const url =
    `${ORS_BASE}/geocode/search?` +
    `api_key=${process.env.ORS_API_KEY}` +
    `&text=${encodeURIComponent(placeName)}` +
    `&size=1`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Geocoding failed for "${placeName}": ${res.status}`);
  }

  const data = await res.json();
  const coords = data?.features?.[0]?.geometry?.coordinates; // [lon, lat]

  if (!coords) {
    throw new Error(`No geocoding result found for "${placeName}"`);
  }

  return coords; // [longitude, latitude]
};

// ─── Format minutes → human readable duration ────────────────────────────────
const formatDuration = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min${m !== 1 ? "s" : ""}`;
  if (m === 0) return `${h} hour${h > 1 ? "s" : ""}`;
  return `${h} hour${h > 1 ? "s" : ""} ${m} min${m !== 1 ? "s" : ""}`;
};

// ─── Recommend travel mode based on driving distance ─────────────────────────
const recommendMode = (distanceKm) => {
  if (!distanceKm || Number.isNaN(distanceKm)) return "Car";
  if (distanceKm < 50)   return "Car";
  if (distanceKm < 250)  return "Bus";
  if (distanceKm < 1200) return "Train";
  return "Flight";
};

// ─── Generate alternative travel mode suggestions ────────────────────────────
const getAlternativeModes = (distanceKm) => {
  const modes = [];

  if (distanceKm < 50) {
    modes.push({ mode: "Car",   note: "Best option for short distance" });
    modes.push({ mode: "Bike",  note: "Great if weather permits" });
  } else if (distanceKm < 250) {
    modes.push({ mode: "Bus",   note: "Economical choice" });
    modes.push({ mode: "Car",   note: "Faster and flexible" });
  } else if (distanceKm < 1200) {
    modes.push({ mode: "Train", note: "Comfortable and scenic" });
    modes.push({ mode: "Bus",   note: "Budget-friendly option" });
    modes.push({ mode: "Car",   note: "Flexible but tiring" });
  } else {
    modes.push({ mode: "Flight", note: "Fastest for long distance" });
    modes.push({ mode: "Train",  note: "Scenic but very long journey" });
  }

  return modes;
};

// ─── Main Maps Agent ──────────────────────────────────────────────────────────
export const mapsAgent = async ({ origin, destination }) => {
  // Graceful degradation if API key is missing
  if (!process.env.ORS_API_KEY) {
    console.warn("[mapsAgent] ORS_API_KEY not set — skipping route lookup");
    return {
      available: false,
      source: "openrouteservice",
      message: "Route service unavailable — ORS_API_KEY not configured",
      origin,
      destination,
      distance: "Unavailable",
      duration: "Unavailable",
      mode: "Unavailable",
    };
  }

  try {
    console.log(`[mapsAgent] Fetching route: ${origin} → ${destination}`);

    // Step 1 — Geocode both locations in parallel
    const [originCoords, destCoords] = await Promise.all([
      geocode(origin),
      geocode(destination),
    ]);

    console.log(`[mapsAgent] Coords — Origin: ${originCoords}, Dest: ${destCoords}`);

    // Step 2 — Get driving directions from ORS
    const routeRes = await fetch(
      `${ORS_BASE}/v2/directions/driving-car`,
      {
        method: "POST",
        headers: {
          Authorization: process.env.ORS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coordinates: [originCoords, destCoords], // [[lon,lat], [lon,lat]]
        }),
      }
    );

    if (!routeRes.ok) {
      const errText = await routeRes.text();
      throw new Error(`ORS Directions API error ${routeRes.status}: ${errText}`);
    }

    const routeData = await routeRes.json();
    const summary = routeData?.routes?.[0]?.summary;

    if (!summary) {
      throw new Error("No route found between the two locations");
    }

    // Step 3 — Parse results
    const distanceKm   = Math.round(summary.distance / 1000);  // metres → km
    const durationMin  = Math.round(summary.duration / 60);    // seconds → mins
    const durationText = formatDuration(durationMin);
    const mode         = recommendMode(distanceKm);

    console.log(`[mapsAgent] Route found — ${distanceKm}km, ${durationText}, mode: ${mode}`);

    return {
      available: true,
      source: "openrouteservice",
      origin,
      destination,
      distance: `${distanceKm} km`,
      distanceKm,
      duration: durationText,
      durationMinutes: durationMin,
      mode,
      alternatives: getAlternativeModes(distanceKm),
    };
  } catch (error) {
    console.error("[mapsAgent] Error:", error.message);
    return {
      available: false,
      source: "openrouteservice",
      message: "Could not fetch route information",
      error: error.message,
      origin,
      destination,
      distance: "Unavailable",
      duration: "Unavailable",
      mode: recommendMode(null),
    };
  }
};