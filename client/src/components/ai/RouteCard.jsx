import { MapPin, Clock, Navigation, Train, Car, ArrowRight } from "lucide-react";
import { UnavailableCard } from "./WeatherCard";

const MODE_ICONS = {
  "Train / Bus": Train,
  "Car / Road": Car,
  Walking: Navigation,
  Cycling: Navigation,
};

export default function RouteCard({ route }) {
  if (!route?.available) {
    return (
      <UnavailableCard
        title="Travel Route"
        reason={route?.error || "No origin provided or API key missing"}
        icon="🗺️"
      />
    );
  }

  const ModeIcon = MODE_ICONS[route.mode] || Navigation;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
          <Navigation size={16} className="text-blue-500" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
            Travel Route
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Best way to get there
          </p>
        </div>
      </div>

      {/* Origin → Destination */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-surface-850 rounded-xl px-3 py-2 flex-1">
          <MapPin size={12} className="text-primary-500 flex-shrink-0" />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
            {route.origin}
          </span>
        </div>
        <ArrowRight size={14} className="text-gray-400 flex-shrink-0" />
        <div className="flex items-center gap-1.5 bg-primary-50 dark:bg-primary-900/20 rounded-xl px-3 py-2 flex-1">
          <MapPin size={12} className="text-primary-500 flex-shrink-0" />
          <span className="text-xs font-semibold text-primary-700 dark:text-primary-300 truncate">
            {route.destination}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <StatBlock
          label="Distance"
          value={route.distance}
          icon={<MapPin size={13} className="text-gray-400" />}
        />
        <StatBlock
          label="Duration"
          value={route.duration}
          icon={<Clock size={13} className="text-gray-400" />}
        />
        <StatBlock
          label="Mode"
          value={route.mode}
          icon={<ModeIcon size={13} className="text-gray-400" />}
        />
      </div>

      {/* Alternatives */}
      {route.alternatives?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-50 dark:border-surface-850">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 font-medium uppercase tracking-wide">
            Alternatives
          </p>
          {route.alternatives.map((alt, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 py-1"
            >
              <span>{alt.mode}</span>
              <span>
                {alt.distance} · {alt.duration}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatBlock({ label, value, icon }) {
  return (
    <div className="bg-gray-50 dark:bg-surface-850 rounded-xl p-2.5 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-tight">
        {value}
      </p>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
        {label}
      </p>
    </div>
  );
}