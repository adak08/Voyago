import { IndianRupee, TrendingUp, Car, Hotel, UtensilsCrossed, Ticket } from "lucide-react";
import { UnavailableCard } from "./WeatherCard";

const TIER_COLORS = {
  low:    "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
  medium: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
  high:   "text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400",
};

const TIER_LABELS = { low: "Budget", medium: "Mid-range", high: "Luxury" };

const CATEGORY_CONFIG = [
  {
    key: "transport",
    label: "Transport",
    icon: Car,
    color: "bg-blue-500",
    light: "text-blue-600 dark:text-blue-400",
  },
  {
    key: "hotel",
    label: "Hotel",
    icon: Hotel,
    color: "bg-violet-500",
    light: "text-violet-600 dark:text-violet-400",
  },
  {
    key: "food",
    label: "Food",
    icon: UtensilsCrossed,
    color: "bg-orange-500",
    light: "text-orange-600 dark:text-orange-400",
  },
  {
    key: "activities",
    label: "Activities",
    icon: Ticket,
    color: "bg-rose-500",
    light: "text-rose-600 dark:text-rose-400",
  },
];

export default function BudgetBreakdown({ budget }) {
  if (!budget?.available) {
    return (
      <UnavailableCard
        title="Budget Breakdown"
        reason={budget?.error || "Estimation unavailable"}
        icon="💰"
      />
    );
  }

  const { breakdown, tier, currency, people, days, tips } = budget;

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
            <IndianRupee size={16} className="text-emerald-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
              Budget Breakdown
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {people} person{people > 1 ? "s" : ""} · {days} days
            </p>
          </div>
        </div>
        <span className={`badge text-xs ${TIER_COLORS[tier] || TIER_COLORS.medium}`}>
          {TIER_LABELS[tier] || tier}
        </span>
      </div>

      {/* Total */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-3.5 mb-4 text-center">
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-0.5">
          Total Estimated Cost
        </p>
        <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
          {currency} {breakdown.total.toLocaleString("en-IN")}
        </p>
        <div className="flex items-center justify-center gap-4 mt-1.5 text-xs text-emerald-600/70 dark:text-emerald-400/70">
          <span>{currency} {breakdown.per_person.toLocaleString("en-IN")} / person</span>
          <span className="w-1 h-1 bg-emerald-400 rounded-full" />
          <span>{currency} {breakdown.per_day.toLocaleString("en-IN")} / day</span>
        </div>
      </div>

      {/* Bar chart breakdown */}
      <div className="space-y-2.5 mb-4">
        {CATEGORY_CONFIG.map(({ key, label, icon: Icon, color, light }) => {
          const amount = breakdown[key] || 0;
          const pct = breakdown.total > 0
            ? Math.round((amount / breakdown.total) * 100)
            : 0;

          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon size={12} className={light} />
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    {label}
                  </span>
                </div>
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  {currency} {amount.toLocaleString("en-IN")}
                  <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">
                    ({pct}%)
                  </span>
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-surface-850 rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} rounded-full transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Saving tips */}
      {tips?.length > 0 && (
        <div className="border-t border-gray-50 dark:border-surface-850 pt-3">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={12} className="text-emerald-500" />
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Money-saving tips
            </p>
          </div>
          <ul className="space-y-1.5">
            {tips.slice(0, 3).map((tip, i) => (
              <li key={i} className="flex gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span className="text-emerald-500 flex-shrink-0">·</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}