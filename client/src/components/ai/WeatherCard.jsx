import { Cloud, Droplets, Wind, Sun, CloudRain, CloudSnow, Zap } from "lucide-react";

const CONDITION_ICONS = {
  Sunny: Sun,
  Cloudy: Cloud,
  Rainy: CloudRain,
  Drizzle: CloudRain,
  Thunderstorm: Zap,
  Snow: CloudSnow,
  Misty: Cloud,
  Foggy: Cloud,
  Hazy: Cloud,
};

const CONDITION_COLORS = {
  Sunny:        "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
  Cloudy:       "text-slate-500 bg-slate-50 dark:bg-slate-900/20",
  Rainy:        "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
  Drizzle:      "text-blue-400 bg-blue-50 dark:bg-blue-900/20",
  Thunderstorm: "text-violet-500 bg-violet-50 dark:bg-violet-900/20",
  Snow:         "text-sky-400 bg-sky-50 dark:bg-sky-900/20",
  Misty:        "text-gray-400 bg-gray-50 dark:bg-gray-900/20",
};

export default function WeatherCard({ weather }) {
  if (!weather?.available) {
    return (
      <UnavailableCard
        title="Weather Forecast"
        reason={weather?.error || "API key not configured"}
        icon="🌤️"
      />
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
          <Sun size={16} className="text-amber-500" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
            Weather Forecast
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {weather.destination}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {weather.forecast.map((day) => {
          const Icon = CONDITION_ICONS[day.condition] || Cloud;
          const colorClass =
            CONDITION_COLORS[day.condition] || "text-gray-500 bg-gray-50 dark:bg-gray-900/20";

          return (
            <div
              key={day.day}
              className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-surface-850 last:border-0"
            >
              <div className="flex items-center gap-2.5 w-24">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-10">
                  Day {day.day}
                </span>
                <div className={`p-1 rounded-md ${colorClass}`}>
                  <Icon size={13} />
                </div>
              </div>

              <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 text-center font-medium">
                {day.condition}
              </span>

              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Droplets size={10} className="text-blue-400" />
                  {day.humidity}%
                </span>
                <span className="font-semibold text-gray-800 dark:text-gray-200 w-20 text-right">
                  {day.temperature.min}–{day.temperature.max}°C
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-600 mt-3 leading-relaxed">
        {weather.summary}
      </p>
    </div>
  );
}

export function UnavailableCard({ title, reason, icon }) {
  return (
    <div className="card p-5 opacity-60">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-xl">{icon}</span>
        <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm">
          {title}
        </h3>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 italic">
        Unavailable — {reason}
      </p>
    </div>
  );
}
