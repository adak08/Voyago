import { useState, useEffect } from "react";
import { Plus, Sparkles, MapPin, Trash2, ChevronDown, ChevronUp, Loader, X } from "lucide-react";
import { useTripStore } from "../store/tripStore";
import { tripService } from "../services/tripService";

const CATEGORY_STYLES = {
  food:          "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  travel:        "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  activity:      "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400",
  accommodation: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  other:         "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
};

const VIBES = ["adventure", "relaxation", "party", "cultural", "food", "budget", "luxury"];

export default function ItineraryBoard({ tripId, trip }) {
  const { itinerary, setItinerary } = useTripStore();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expandedDays, setExpandedDays] = useState({});
  const [showAIForm, setShowAIForm] = useState(false);
  const [aiForm, setAiForm] = useState({ vibe: "adventure", days: trip?.duration || 3, preferences: "" });
  const [showAddActivity, setShowAddActivity] = useState(null);
  const [activityForm, setActivityForm] = useState({ time: "", title: "", description: "", location: "", category: "activity", cost: 0 });

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await tripService.getItinerary(tripId);
        setItinerary(data.itinerary);
        if (data.itinerary?.days?.length > 0) setExpandedDays({ 0: true });
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [tripId]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const data = await tripService.generateItinerary(tripId, {
        destination: trip.destination, ...aiForm,
      });
      setItinerary(data.itinerary);
      setShowAIForm(false);
      setExpandedDays({ 0: true });
    } catch (err) {
      alert(err.response?.data?.message || "AI generation failed. Check OpenAI API key.");
    }
    setGenerating(false);
  };

  const handleAddActivity = async (dayIndex) => {
    const days = [...(itinerary?.days || [])];
    days[dayIndex].activities.push(activityForm);
    try {
      const data = await tripService.updateItinerary(tripId, days);
      setItinerary(data.itinerary);
      setShowAddActivity(null);
      setActivityForm({ time: "", title: "", description: "", location: "", category: "activity", cost: 0 });
    } catch {}
  };

  const handleDeleteActivity = async (dayIndex, actIndex) => {
    const days = JSON.parse(JSON.stringify(itinerary.days));
    days[dayIndex].activities.splice(actIndex, 1);
    const data = await tripService.updateItinerary(tripId, days);
    setItinerary(data.itinerary);
  };

  const toggleDay = (i) => setExpandedDays((prev) => ({ ...prev, [i]: !prev[i] }));

  if (loading) {
    return (
      <div className="flex justify-center py-14">
        <div className="w-10 h-10 border-[3px] border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title">Itinerary</h2>
        <button
          onClick={() => setShowAIForm(!showAIForm)}
          className="btn-primary text-sm"
        >
          <Sparkles size={15} /> Generate with AI
        </button>
      </div>

      {/* AI Form */}
      {showAIForm && (
        <div className="card p-5 mb-6 border border-primary-200 dark:border-primary-900/50 bg-primary-50/50 dark:bg-primary-900/10 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center">
                <Sparkles
                  size={15}
                  className="text-primary-500 dark:text-primary-400"
                />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                AI Itinerary Generator
              </h3>
            </div>
            <button
              onClick={() => setShowAIForm(false)}
              className="btn-ghost p-1.5"
            >
              <X size={15} />
            </button>
          </div>
          <form onSubmit={handleGenerate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                  Travel Vibe
                </label>
                <select
                  className="input-field"
                  value={aiForm.vibe}
                  onChange={(e) =>
                    setAiForm({ ...aiForm, vibe: e.target.value })
                  }
                >
                  {VIBES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                  Number of Days
                </label>
                <input
                  type="number"
                  className="input-field"
                  min={1}
                  max={14}
                  value={aiForm.days}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setAiForm({
                      ...aiForm,
                      days: isNaN(value) ? 1 : value,
                    });
                  }}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Preferences
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="vegetarian food, budget-friendly, outdoor activities"
                value={aiForm.preferences}
                onChange={(e) =>
                  setAiForm({ ...aiForm, preferences: e.target.value })
                }
              />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowAIForm(false)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={generating}
                className="btn-primary text-sm"
              >
                {generating ? (
                  <>
                    <Loader size={14} className="animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    <Sparkles size={14} /> Generate
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Days */}
      {!itinerary?.days?.length ? (
        <div className="card p-14 text-center">
          <p className="text-5xl mb-4">🗺️</p>
          <p className="font-bold text-gray-500 dark:text-gray-400 mb-1">
            No itinerary yet
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-600 mb-5">
            Generate with AI or add activities manually
          </p>
          <button
            onClick={() => setShowAIForm(true)}
            className="btn-primary text-sm mx-auto"
          >
            <Sparkles size={14} /> Generate with AI
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {itinerary.days.map((day, di) => (
            <div key={di} className="card overflow-hidden">
              <button
                onClick={() => toggleDay(di)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-surface-850/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-primary-500/20">
                    {day.day}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-sm group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
                      {day.title || `Day ${day.day}`}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-600">
                      {day.activities?.length || 0} activities
                    </p>
                  </div>
                </div>
                {expandedDays[di] ? (
                  <ChevronUp
                    size={16}
                    className="text-gray-400 dark:text-gray-600"
                  />
                ) : (
                  <ChevronDown
                    size={16}
                    className="text-gray-400 dark:text-gray-600"
                  />
                )}
              </button>

              {expandedDays[di] && (
                <div className="px-4 pb-4 border-t border-gray-50 dark:border-surface-850">
                  <div className="space-y-2.5 mt-3">
                    {day.activities?.map((act, ai) => (
                      <div key={ai} className="flex gap-3 group/act">
                        <div className="w-16 text-xs text-gray-400 dark:text-gray-600 pt-3 flex-shrink-0 font-medium">
                          {act.time}
                        </div>
                        <div className="flex-1 bg-gray-50 dark:bg-surface-850 rounded-xl p-3 hover:bg-gray-100 dark:hover:bg-surface-800 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                  {act.title}
                                </p>
                                <span
                                  className={`badge text-[10px] ${CATEGORY_STYLES[act.category] || CATEGORY_STYLES.other}`}
                                >
                                  {act.category}
                                </span>
                                {act.cost > 0 && (
                                  <span className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                                    ₹{act.cost}
                                  </span>
                                )}
                              </div>
                              {act.description && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                  {act.description}
                                </p>
                              )}
                              {act.location && (
                                <p className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-600 mt-1">
                                  <MapPin size={11} /> {act.location}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteActivity(di, ai)}
                              className="opacity-0 group-hover/act:opacity-100 text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-all p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add Activity inline form */}
                    {showAddActivity === di ? (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 rounded-xl p-3 space-y-2 animate-fade-in">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            className="input-field text-xs"
                            placeholder="Time (e.g. 9:00 AM)"
                            value={activityForm.time}
                            onChange={(e) =>
                              setActivityForm({
                                ...activityForm,
                                time: e.target.value,
                              })
                            }
                          />
                          <input
                            className="input-field text-xs"
                            placeholder="Activity title"
                            value={activityForm.title}
                            onChange={(e) =>
                              setActivityForm({
                                ...activityForm,
                                title: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <input
                          className="input-field text-xs"
                          placeholder="Location (optional)"
                          value={activityForm.location}
                          onChange={(e) =>
                            setActivityForm({
                              ...activityForm,
                              location: e.target.value,
                            })
                          }
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setShowAddActivity(null)}
                            className="btn-secondary text-xs py-1.5"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleAddActivity(di)}
                            className="btn-primary text-xs py-1.5"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddActivity(di)}
                        className="flex items-center gap-1.5 text-xs text-primary-500 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium mt-1.5 transition-colors"
                      >
                        <Plus size={13} /> Add activity
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
