import { CheckCircle, AlertCircle, Wifi } from "lucide-react";

const AGENT_META = {
  weather:   { label: "Weather",   emoji: "🌤️" },
  route:     { label: "Route",     emoji: "🗺️" },
  events:    { label: "Events",    emoji: "🎪" },
  budget:    { label: "Budget",    emoji: "💰" },
  itinerary: { label: "Itinerary", emoji: "📋" },
};

export default function AgentStatusBadges({ agentStatus }) {
  if (!agentStatus) return null;

  const entries = Object.entries(agentStatus);
  const allOk = entries.every(([, v]) => v === "ok");

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
        <Wifi size={11} />
        <span className="font-medium">Agents:</span>
      </div>
      {entries.map(([key, status]) => {
        const meta = AGENT_META[key] || { label: key, emoji: "🤖" };
        const ok = status === "ok";
        return (
          <span
            key={key}
            title={`${meta.label}: ${status}`}
            className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
              ok
                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                : "bg-gray-50 dark:bg-surface-850 border-gray-200 dark:border-surface-850 text-gray-400 dark:text-gray-500"
            }`}
          >
            {ok ? (
              <CheckCircle size={9} className="text-emerald-500" />
            ) : (
              <AlertCircle size={9} className="text-gray-400" />
            )}
            {meta.emoji} {meta.label}
          </span>
        );
      })}
    </div>
  );
}
