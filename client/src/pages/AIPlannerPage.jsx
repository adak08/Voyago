import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Sparkles, MapPin, Calendar, Users,
  Plane, Zap, ChevronRight, RotateCcw, Sun, Moon,
  Wallet, Heart, Mountain, Coffee, Palmtree, Crown
} from "lucide-react";
import { aiService } from "../services/aiService";
import { useThemeStore } from "../store/themeStore";
import WeatherCard from "../components/ai/WeatherCard";
import RouteCard from "../components/ai/RouteCard";
import BudgetBreakdown from "../components/ai/BudgetBreakdown";
import AIItineraryBoard from "../components/ai/AIItineraryBoard";
import AgentStatusBadges from "../components/ai/AgentStatusBadges";
import api from "../services/api";

// ─── Vibe options ─────────────────────────────────────────────────────────────
const VIBES = [
  { id: "adventure",   label: "Adventure",  icon: Mountain, color: "from-orange-400 to-rose-500" },
  { id: "relaxation",  label: "Relaxation", icon: Palmtree, color: "from-teal-400 to-cyan-500" },
  { id: "cultural",    label: "Cultural",   icon: Heart,    color: "from-violet-400 to-purple-500" },
  { id: "food",        label: "Foodie",     icon: Coffee,   color: "from-amber-400 to-orange-500" },
  { id: "luxury",      label: "Luxury",     icon: Crown,    color: "from-yellow-400 to-amber-500" },
  { id: "balanced",    label: "Balanced",   icon: Zap,      color: "from-primary-400 to-violet-500" },
];

const BUDGETS = [
  { id: "low",    label: "Budget",   desc: "Hostels, street food, public transport" },
  { id: "medium", label: "Mid-range", desc: "3-star hotels, local restaurants" },
  { id: "high",   label: "Luxury",   desc: "5-star resorts, fine dining, private transfers" },
];

const POPULAR = [
  { destination: "Goa",       origin: "Mumbai",    days: 4, emoji: "🏖️" },
  { destination: "Manali",    origin: "Delhi",     days: 5, emoji: "🏔️" },
  { destination: "Jaipur",    origin: "Delhi",     days: 3, emoji: "🏰" },
  { destination: "Bali",      origin: "Mumbai",    days: 7, emoji: "🌴" },
  { destination: "Rishikesh", origin: "Delhi",     days: 4, emoji: "🛶" },
  { destination: "Kerala",    origin: "Bangalore", days: 6, emoji: "⛵" },
];

const TABS = [
  { id: "itinerary", label: "Itinerary",  emoji: "📋" },
  { id: "info",      label: "Trip Info",  emoji: "ℹ️"  },
];

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AIPlannerPage() {
  const navigate = useNavigate();
  const { dark, toggle } = useThemeStore();

  // Form state
  const [form, setForm] = useState({
    destination: "",
    origin: "",
    days: 5,
    people: 2,
    budget: "medium",
    vibe: "balanced",
    preferences: "",
    startDate: "",
    currency: "INR",
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("itinerary");
  const [savingTrip, setSavingTrip] = useState(false);

  // ── Form helpers ────────────────────────────────────────────────────────────
  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value ?? e }));

  const fillQuick = (preset) =>
    setForm((prev) => ({
      ...prev,
      destination: preset.destination,
      origin: preset.origin,
      days: preset.days,
    }));

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handlePlan = async (e) => {
    e.preventDefault();
    if (!form.destination.trim()) {
      setError("Please enter a destination.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const res = await aiService.planTrip({
        ...form,
        days: Number(form.days),
        people: Number(form.people),
        startDate: form.startDate || null,
      });

      if (!res.success) {
        setError(res.message || "Trip planning failed. Please check your API keys.");
        return;
      }
      setResult(res.data);
      setActiveTab("itinerary");
    } catch (err) {
      if (err?.code === "ECONNABORTED") {
        setError("Planning is taking longer than expected. Please try again in a moment.");
      } else if (!err?.response) {
        setError("Network issue while fetching itinerary. Please check connection and retry.");
      } else {
        setError(err.response?.data?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError("");
  };

  const handleSaveTrip = async () => {
    if (!result) return;

    setSavingTrip(true);
    setError("");

    try {
      const meta = {
        origin: result.meta?.origin || "",
        destination: result.meta?.destination || "",
        startDate: result.meta?.start_date || null,
        endDate: result.meta?.end_date || null,
        days: Number(result.meta?.days) || 0,
        people: Number(result.meta?.people) || 1,
        vibe: result.meta?.vibe || "balanced",
        budget: Number(result.budget?.breakdown?.total) || 0,
        currency: result.meta?.currency || result.budget?.currency || "INR",
      };

      const aiInsights = {
        localCuisine: result.itinerary?.local_cuisine || [],
        travelTips: result.budget?.tips || [],
        packingTips: result.itinerary?.packing_tips || [],
        safetyNotes: [],
      };

      const response = await api.post("/trips/ai-import", {
        title: `Trip to ${meta.destination}`,
        meta,
        weather: result.weather,
        route: result.route,
        budget: result.budget,
        itinerary: result.itinerary,
        agentStatus: result.agentStatus,
        aiInsights,
      });

      navigate(`/trips/${response.data.trip._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save trip. Please try again.");
    } finally {
      setSavingTrip(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* ── Nav ─── */}
      <nav className="nav-glass sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="btn-ghost p-2 -ml-1"
            >
              <ArrowLeft size={17} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20">
                <Sparkles className="text-white" size={15} />
              </div>
              <div>
                <span className="font-extrabold text-gray-900 dark:text-white text-sm">
                  AI Trip Planner
                </span>
                <span className="hidden sm:inline text-xs text-gray-400 dark:text-gray-500 ml-2">
                  Powered by Gemini 2.5 Flash
                </span>
              </div>
            </div>
          </div>
          <button onClick={toggle} className="theme-toggle">
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 page-enter">
        {!result ? (
          /* ═══════════════ PLANNER FORM ═══════════════ */
          <div className="max-w-2xl mx-auto">
            {/* Hero */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/40 text-primary-600 dark:text-primary-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
                <Sparkles size={12} />
                Multi-Agent AI · Weather · Maps · Budget
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3 leading-tight">
                Plan your perfect trip<br />
                <span className="gradient-text">in seconds</span>
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
                Our AI coordinates specialized agents to build a detailed itinerary enriched with real weather, maps, and budget data.
              </p>
            </div>

            {/* Quick picks */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2.5">
                Popular trips
              </p>
              <div className="flex gap-2 flex-wrap">
                {POPULAR.map((p) => (
                  <button
                    key={p.destination}
                    onClick={() => fillQuick(p)}
                    className="flex items-center gap-1.5 bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-850 rounded-xl px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all hover:-translate-y-0.5"
                  >
                    <span>{p.emoji}</span> {p.destination}
                  </button>
                ))}
              </div>
            </div>

            {/* Form card */}
            <div className="card p-6 sm:p-8">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-5 text-sm flex items-start gap-2">
                  <span className="mt-0.5">⚠</span> {error}
                </div>
              )}

              <form onSubmit={handlePlan} className="space-y-5">
                {/* Destination + Origin */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Destination *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                      <input
                        className="input-field pl-9"
                        placeholder="Goa, India"
                        value={form.destination}
                        onChange={set("destination")}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label-text">Origin (for route)</label>
                    <div className="relative">
                      <Plane className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                      <input
                        className="input-field pl-9"
                        placeholder="Delhi, India"
                        value={form.origin}
                        onChange={set("origin")}
                      />
                    </div>
                  </div>
                </div>

                {/* Days + People + Start Date */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="label-text">Days</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                      <input
                        type="number"
                        min="1"
                        max="30"
                        className="input-field pl-9"
                        value={form.days}
                        onChange={set("days")}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label-text">People</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                      <input
                        type="number"
                        min="1"
                        max="50"
                        className="input-field pl-9"
                        value={form.people}
                        onChange={set("people")}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label-text">Start Date</label>
                    <input
                      type="date"
                      className="input-field"
                      value={form.startDate}
                      onChange={set("startDate")}
                    />
                  </div>
                </div>

                {/* Vibe selector */}
                <div>
                  <label className="label-text">Trip Vibe</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-1.5">
                    {VIBES.map((v) => {
                      const Icon = v.icon;
                      const selected = form.vibe === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, vibe: v.id }))}
                          className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all text-center ${
                            selected
                              ? "border-primary-400 bg-primary-50 dark:bg-primary-900/20 shadow-sm"
                              : "border-gray-200 dark:border-surface-850 hover:border-gray-300 dark:hover:border-surface-800"
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-lg bg-gradient-to-br ${v.color} flex items-center justify-center`}
                          >
                            <Icon size={14} className="text-white" />
                          </div>
                          <span
                            className={`text-[10px] font-semibold ${
                              selected
                                ? "text-primary-600 dark:text-primary-400"
                                : "text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {v.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Budget selector */}
                <div>
                  <label className="label-text">Budget Tier</label>
                  <div className="grid grid-cols-3 gap-2 mt-1.5">
                    {BUDGETS.map((b) => {
                      const selected = form.budget === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, budget: b.id }))}
                          className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left ${
                            selected
                              ? "border-primary-400 bg-primary-50 dark:bg-primary-900/20"
                              : "border-gray-200 dark:border-surface-850 hover:border-gray-300 dark:hover:border-surface-800"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Wallet
                              size={12}
                              className={
                                selected
                                  ? "text-primary-500"
                                  : "text-gray-400"
                              }
                            />
                            <span
                              className={`text-xs font-bold ${
                                selected
                                  ? "text-primary-600 dark:text-primary-400"
                                  : "text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {b.label}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
                            {b.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preferences */}
                <div>
                  <label className="label-text">
                    Special Preferences{" "}
                    <span className="text-gray-400 dark:text-gray-500 font-normal normal-case">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    className="input-field resize-none"
                    rows={2}
                    placeholder="e.g. vegetarian food, avoid crowded places, beach lover, prefer mornings…"
                    value={form.preferences}
                    onChange={set("preferences")}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3.5 text-sm font-bold"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2.5">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Coordinating agents…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles size={15} />
                      Generate AI Trip Plan
                      <ChevronRight size={15} />
                    </span>
                  )}
                </button>
              </form>
            </div>

            {/* Loading state explainer */}
            {loading && (
              <div className="mt-6 card p-5 animate-fade-in">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Sparkles size={14} className="text-primary-500 animate-spin" />
                  Agents working in parallel…
                </p>
                <div className="space-y-2.5">
                  {[
                    { label: "🌤️  Weather Agent", sub: "Fetching forecast from OpenWeather" },
                    { label: "🗺️  Maps Agent",    sub: "Calculating route via Google Maps" },
                    { label: "💰  Budget Agent",  sub: "Estimating cost breakdown" },
                    { label: "✨  Itinerary Agent", sub: "Gemini 2.5 Flash generating your plan" },
                  ].map((agent, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full bg-primary-400 animate-pulse flex-shrink-0"
                        style={{ animationDelay: `${i * 200}ms` }}
                      />
                      <div>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {agent.label}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                          {agent.sub}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ═══════════════ RESULTS ═══════════════ */
          <div>
            {/* Results header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                    {result.meta.destination}
                  </h1>
                  <span className="badge bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs">
                    AI Generated
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {result.meta.days} days ·{" "}
                  {result.meta.people} person{result.meta.people > 1 ? "s" : ""} ·{" "}
                  {result.meta.budget_tier} budget ·{" "}
                  {result.meta.vibe} vibe
                  {result.meta.start_date && ` · from ${result.meta.start_date}`}
                </p>
                {/* Agent status badges */}
                <div className="mt-2">
                  <AgentStatusBadges agentStatus={result.agentStatus} />
                </div>
              </div>

              <button
                onClick={handleReset}
                className="btn-secondary text-sm flex-shrink-0"
              >
                <RotateCcw size={14} />
                New Plan
              </button>
            </div>

            <div className="mb-6 flex justify-end">
              <button
                onClick={handleSaveTrip}
                disabled={savingTrip}
                className="btn-primary text-sm"
              >
                {savingTrip ? "Saving Trip..." : "Save Trip"}
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 dark:border-surface-850 mb-6 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={activeTab === tab.id ? "tab-btn-active" : "tab-btn-inactive"}
                >
                  <span>{tab.emoji}</span> {tab.label}
                </button>
              ))}
            </div>

            {/* ── Itinerary tab ── */}
            {activeTab === "itinerary" && (
              <AIItineraryBoard itinerary={result.itinerary} />
            )}

            {/* ── Trip Info tab ── */}
            {activeTab === "info" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <WeatherCard weather={result.weather} />
                <RouteCard route={result.route} />
                <BudgetBreakdown budget={result.budget} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}