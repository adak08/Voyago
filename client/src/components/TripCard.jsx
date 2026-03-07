import { MapPin, Calendar, Users } from "lucide-react";
import { format } from "date-fns";

const STATUS_STYLES = {
  upcoming:
    "bg-blue-100/90 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  ongoing:
    "bg-emerald-100/90 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  completed:
    "bg-gray-200/80 text-gray-600 dark:bg-gray-800/80 dark:text-gray-400",
};

const COVER_GRADIENTS = [
  "from-violet-400 to-purple-600",
  "from-blue-400 to-cyan-500",
  "from-orange-400 to-rose-500",
  "from-emerald-400 to-teal-500",
  "from-rose-400 to-pink-600",
  "from-indigo-400 to-blue-600",
];

export default function TripCard({ trip, onClick }) {
  const gradient =
    COVER_GRADIENTS[trip.title.charCodeAt(0) % COVER_GRADIENTS.length];

  // 🔹 Compute status dynamically
  const today = new Date();
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);

  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  let status = "upcoming";

  if (today < start) {
    status = "upcoming";
  } else if (today > end) {
    status = "completed";
  } else {
    status = "ongoing";
  }

  return (
    <div onClick={onClick} className="card-hover overflow-hidden group">
      {/* Cover */}
      <div
        className={`h-36 bg-gradient-to-br ${gradient} relative flex items-end p-3`}
      >
        {trip.coverImage && (
          <img
            src={trip.coverImage}
            alt={trip.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Status Badge */}
        <span
          className={`relative badge text-xs backdrop-blur-sm ${STATUS_STYLES[status]}`}
        >
          {status}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3
          className="font-bold text-gray-900 dark:text-gray-100 text-base leading-tight mb-2.5
          group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors"
        >
          {trip.title}
        </h3>

        <div className="space-y-1.5 mb-3">
          <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <MapPin
              size={12}
              className="text-gray-400 dark:text-gray-600 flex-shrink-0"
            />
            {trip.destination}
          </p>

          <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Calendar
              size={12}
              className="text-gray-400 dark:text-gray-600 flex-shrink-0"
            />
            {format(new Date(trip.startDate), "MMM d")} –{" "}
            {format(new Date(trip.endDate), "MMM d, yyyy")}
          </p>

          <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Users
              size={12}
              className="text-gray-400 dark:text-gray-600 flex-shrink-0"
            />
            {trip.members?.length} member{trip.members?.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Members */}
        <div className="flex items-center gap-2 justify-between mt-3 pt-3 border-t border-gray-50 dark:border-surface-850">
          <div className="flex -space-x-2">
            {trip.members?.slice(0, 4).map((m, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-violet-500 border-2 border-white dark:border-[var(--card)] flex items-center justify-center text-xs font-bold text-white"
                title={m.user?.name}
              >
                {m.user?.name?.[0]?.toUpperCase()}
              </div>
            ))}

            {trip.members?.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-surface-850 border-2 border-white dark:border-[var(--card)] flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-400">
                +{trip.members.length - 4}
              </div>
            )}
          </div>

          {trip.budget && (
            <span className="text-xs text-gray-400 dark:text-gray-600 font-medium">
              {trip.currency === "USD" && "$"}
              {trip.currency === "EUR" && "€"}
              {trip.currency === "INR" && "₹"}
              {Number(trip.budget).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
