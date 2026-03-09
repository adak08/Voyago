import { Calendar, Music, Ticket, ExternalLink } from "lucide-react";
import { UnavailableCard } from "./WeatherCard";

const CATEGORY_STYLES = {
  Concert:       "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
  Sports:        "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
  "Theatre / Arts": "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
  Film:          "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  Event:         "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
};

export default function EventsList({ events }) {
  if (!events?.available) {
    return (
      <UnavailableCard
        title="Local Events"
        reason={events?.error || "Ticketmaster API key not configured"}
        icon="🎪"
      />
    );
  }

  if (events.count === 0) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center">
            <Music size={16} className="text-rose-500" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
            Local Events
          </h3>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
          No major events found for {events.destination} during your travel dates.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center">
            <Ticket size={16} className="text-rose-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
              Local Events
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {events.count} event{events.count !== 1 ? "s" : ""} during your trip
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {events.events.map((event) => (
          <div
            key={event.id}
            className="flex gap-3 p-2.5 bg-gray-50 dark:bg-surface-850 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-800 transition-colors group"
          >
            {/* Event image or placeholder */}
            {event.image ? (
              <img
                src={event.image}
                alt={event.name}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Music size={18} className="text-white" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-xs leading-tight truncate pr-1">
                  {event.name}
                </p>
                {event.url && (
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noreferrer"
                    className="opacity-0 group-hover:opacity-100 text-primary-500 flex-shrink-0 transition-opacity"
                  >
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                    CATEGORY_STYLES[event.category] || CATEGORY_STYLES.Event
                  }`}
                >
                  {event.category}
                </span>
                <span className="flex items-center gap-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                  <Calendar size={9} />
                  {event.date}
                </span>
              </div>

              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                {event.venue} · {event.priceRange}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
