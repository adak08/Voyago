import { useState } from "react";
import {
  MapPin, Clock, ChevronDown, ChevronUp,
  Sparkles, IndianRupee, Lightbulb, UtensilsCrossed,
  Package, Star
} from "lucide-react";

const CATEGORY_STYLES = {
  food:          "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  travel:        "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  activity:      "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400",
  accommodation: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  other:         "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
};

const CATEGORY_EMOJIS = {
  food: "🍽️", travel: "🚗", activity: "🎯",
  accommodation: "🏨", other: "📍",
};

const THEME_COLORS = [
  "from-primary-500 to-violet-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-rose-500",
  "from-pink-500 to-violet-500",
  "from-indigo-500 to-blue-600",
];

export default function AIItineraryBoard({ itinerary }) {
  const [expandedDays, setExpandedDays] = useState({ 0: true });

  if (!itinerary?.available || !itinerary?.days?.length) {
    return (
      <div className="card p-12 text-center">
        <Sparkles size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
        <p className="font-semibold text-gray-400 dark:text-gray-600">
          Itinerary generation failed
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">
          {itinerary?.error || "Check that GEMINI_API_KEY is set in server/.env"}
        </p>
      </div>
    );
  }

  const toggleDay = (i) =>
    setExpandedDays((prev) => ({ ...prev, [i]: !prev[i] }));

  return (
    <div>
      {/* Trip highlights */}
      {(itinerary.highlights?.length > 0 ||
        itinerary.local_cuisine?.length > 0 ||
        itinerary.packing_tips?.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {itinerary.highlights?.length > 0 && (
            <TripInfoCard
              title="Highlights"
              icon={<Star size={14} className="text-amber-500" />}
              items={itinerary.highlights}
              color="amber"
            />
          )}
          {itinerary.local_cuisine?.length > 0 && (
            <TripInfoCard
              title="Must Try Food"
              icon={<UtensilsCrossed size={14} className="text-orange-500" />}
              items={itinerary.local_cuisine}
              color="orange"
            />
          )}
          {itinerary.packing_tips?.length > 0 && (
            <TripInfoCard
              title="Packing Tips"
              icon={<Package size={14} className="text-blue-500" />}
              items={itinerary.packing_tips}
              color="blue"
            />
          )}
        </div>
      )}

      {/* Day cards */}
      <div className="space-y-3">
        {itinerary.days.map((day, di) => {
          const gradient = THEME_COLORS[di % THEME_COLORS.length];
          const totalDayCost = day.activities?.reduce((s, a) => s + (a.cost || 0), 0) || 0;

          return (
            <div key={di} className="card overflow-hidden">
              {/* Day header */}
              <button
                onClick={() => toggleDay(di)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-surface-850/50 transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex flex-col items-center justify-center shadow-md flex-shrink-0`}
                  >
                    <span className="text-white text-[10px] font-medium leading-none opacity-80">
                      DAY
                    </span>
                    <span className="text-white font-extrabold text-lg leading-none">
                      {day.day}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-sm group-hover:text-primary-500 transition-colors">
                      {day.title || `Day ${day.day}`}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {day.activities?.length || 0} activities
                      </span>
                      {totalDayCost > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <IndianRupee size={10} />
                          {totalDayCost.toLocaleString("en-IN")}
                        </span>
                      )}
                      {day.weather_note && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 italic hidden sm:block">
                          {day.weather_note}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {expandedDays[di] ? (
                  <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                )}
              </button>

              {/* Activities */}
              {expandedDays[di] && (
                <div className="px-4 pb-4 border-t border-gray-50 dark:border-surface-850">
                  {day.day_summary && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic py-2.5 px-1">
                      {day.day_summary}
                    </p>
                  )}

                  <div className="space-y-2.5 mt-1">
                    {day.activities?.map((act, ai) => (
                      <ActivityCard key={ai} activity={act} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActivityCard({ activity: act }) {
  const catStyle = CATEGORY_STYLES[act.category] || CATEGORY_STYLES.other;
  const catEmoji = CATEGORY_EMOJIS[act.category] || "📍";

  return (
    <div className="flex gap-3 group/act">
      {/* Time column */}
      <div className="w-16 text-xs text-gray-400 dark:text-gray-500 pt-3 flex-shrink-0 font-medium text-right">
        {act.time}
      </div>

      {/* Timeline dot */}
      <div className="flex flex-col items-center pt-3.5 flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-primary-400 dark:bg-primary-500" />
        <div className="w-px flex-1 bg-gray-100 dark:bg-surface-850 mt-1" />
      </div>

      {/* Activity content */}
      <div className="flex-1 bg-gray-50 dark:bg-surface-850 rounded-xl p-3 mb-2 hover:bg-gray-100 dark:hover:bg-surface-800 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-base leading-none">{catEmoji}</span>
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {act.title}
              </p>
              <span className={`badge text-[10px] ${catStyle}`}>
                {act.category}
              </span>
            </div>

            {act.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-1.5">
                {act.description}
              </p>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              {act.location && (
                <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                  <MapPin size={10} /> {act.location}
                </span>
              )}
              {act.duration_minutes > 0 && (
                <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                  <Clock size={10} /> {act.duration_minutes} min
                </span>
              )}
              {act.cost > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <IndianRupee size={10} />
                  {act.cost.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            {act.tips && (
              <div className="flex items-start gap-1 mt-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2 py-1.5">
                <Lightbulb size={10} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
                  {act.tips}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TripInfoCard({ title, icon, items, color }) {
  const colorMap = {
    amber: "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30",
    orange: "bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30",
    blue:   "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30",
  };
  return (
    <div className={`card p-3.5 border ${colorMap[color] || colorMap.blue}`}>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          {title}
        </p>
      </div>
      <ul className="space-y-1">
        {items.slice(0, 4).map((item, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <span className="text-gray-300 dark:text-gray-600 flex-shrink-0">·</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
