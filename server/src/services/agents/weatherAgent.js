/**
 * Weather Agent
 * Fetches a multi-day weather forecast for a destination using OpenWeatherMap.
 * Falls back gracefully when the API key is absent or the call fails.
 */

const OPENWEATHER_BASE = "https://api.openweathermap.org/data/2.5";

/**
 * Convert a Unix timestamp to a human-readable date string.
 * @param {number} unix - Unix epoch in seconds
 * @returns {string}
 */
const epochToDate = (unix) =>
  new Date(unix * 1000).toISOString().split("T")[0];

/**
 * Map OpenWeather condition codes to clean labels.
 * @param {string} main - weather.main from API
 * @returns {string}
 */
const mapCondition = (main = "") => {
  const map = {
    Clear: "Sunny",
    Clouds: "Cloudy",
    Rain: "Rainy",
    Drizzle: "Drizzle",
    Thunderstorm: "Thunderstorm",
    Snow: "Snow",
    Mist: "Misty",
    Fog: "Foggy",
    Haze: "Hazy",
    Smoke: "Smoky",
    Dust: "Dusty",
    Sand: "Sandy",
    Ash: "Ash",
    Squall: "Windy",
    Tornado: "Tornado",
  };
  return map[main] || main;
};

/**
 * Fetch the weather forecast for a destination.
 *
 * @param {string} destination   - City / place name
 * @param {number} [days=7]      - Number of forecast days (1–7)
 * @returns {Promise<{
 *   available: boolean,
 *   destination: string,
 *   forecast: Array<{
 *     day: number,
 *     date: string,
 *     condition: string,
 *     description: string,
 *     temperature: { min: number, max: number, avg: number },
 *     humidity: number,
 *     wind_speed: number,
 *     icon: string
 *   }>,
 *   summary: string,
 *   error?: string
 * }>}
 */
export const fetchWeather = async (destination, days = 7) => {
  const apiKey = process.env.OPENWEATHER_KEY;

  if (!apiKey) {
    console.warn("[WeatherAgent] OPENWEATHER_KEY is not set — skipping.");
    return unavailable(destination, "OPENWEATHER_KEY not configured");
  }

  try {
    // Step 1 — Geocode the destination to lat/lon
    const geoUrl =
      `https://api.openweathermap.org/geo/1.0/direct` +
      `?q=${encodeURIComponent(destination)}&limit=1&appid=${apiKey}`;

    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) throw new Error(`Geocoding failed: ${geoRes.status}`);

    const geoData = await geoRes.json();
    if (!geoData.length) throw new Error(`Location not found: ${destination}`);

    const { lat, lon } = geoData[0];

    // Step 2 — Fetch 5-day / 3-hour forecast (max 40 entries)
    const forecastUrl =
      `${OPENWEATHER_BASE}/forecast` +
      `?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&cnt=${Math.min(days * 8, 40)}`;

    const forecastRes = await fetch(forecastUrl);
    if (!forecastRes.ok) throw new Error(`Forecast API failed: ${forecastRes.status}`);

    const forecastData = await forecastRes.json();

    // Step 3 — Aggregate to daily summaries
    const dailyMap = {};

    for (const entry of forecastData.list) {
      const date = epochToDate(entry.dt);
      if (!dailyMap[date]) {
        dailyMap[date] = {
          temps: [],
          conditions: [],
          humidity: [],
          wind: [],
          icons: [],
        };
      }
      dailyMap[date].temps.push(entry.main.temp);
      dailyMap[date].conditions.push(entry.weather[0].main);
      dailyMap[date].humidity.push(entry.main.humidity);
      dailyMap[date].wind.push(entry.wind.speed);
      dailyMap[date].icons.push(entry.weather[0].icon);
    }

    const forecast = Object.entries(dailyMap)
      .slice(0, days)
      .map(([date, data], idx) => {
        // Pick the most common condition for the day
        const modeCondition = data.conditions
          .sort(
            (a, b) =>
              data.conditions.filter((v) => v === b).length -
              data.conditions.filter((v) => v === a).length
          )
          .shift();

        const avg = (arr) =>
          Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);

        return {
          day: idx + 1,
          date,
          condition: mapCondition(modeCondition),
          description: modeCondition,
          temperature: {
            min: Math.round(Math.min(...data.temps)),
            max: Math.round(Math.max(...data.temps)),
            avg: avg(data.temps),
          },
          humidity: avg(data.humidity),
          wind_speed: Math.round(avg(data.wind) * 10) / 10, // m/s
          icon: `https://openweathermap.org/img/wn/${data.icons[Math.floor(data.icons.length / 2)]}@2x.png`,
        };
      });

    // High-level summary for Gemini context
    const conditions = [...new Set(forecast.map((f) => f.condition))];
    const avgTemp = Math.round(
      forecast.reduce((s, f) => s + f.temperature.avg, 0) / forecast.length
    );
    const summary = `${destination}: ${conditions.join(", ")} with average temperature of ${avgTemp}°C over ${forecast.length} days.`;

    return {
      available: true,
      destination,
      forecast,
      summary,
    };
  } catch (error) {
    console.error("[WeatherAgent] Error:", error.message);
    return unavailable(destination, error.message);
  }
};

/** Consistent unavailable response shape */
const unavailable = (destination, reason) => ({
  available: false,
  destination,
  forecast: [],
  summary: "Weather data unavailable.",
  error: reason,
});
