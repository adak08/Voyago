import { useState, useEffect } from "react";
import {
  Plus,
  MapPin,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useTripStore } from "../store/tripStore";
import { tripService } from "../services/tripService";

const CATEGORY_STYLES = {
  food: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  travel: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  activity:
    "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400",
  accommodation:
    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  other: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
};

const cloneDays = (days = []) =>
  days.map((day) => ({
    ...day,
    activities: [...(day.activities || [])],
  }));

export default function ItineraryBoard({
  tripId,
  isEditMode = false,
  onManualSave,
  onCancelEdit,
}) {
  const { itinerary, setItinerary } = useTripStore();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedDays, setExpandedDays] = useState({});
  const [draftDays, setDraftDays] = useState([]);

  const [showAddActivity, setShowAddActivity] = useState(null);

  const [activityForm, setActivityForm] = useState({
    hour: "",
    minute: "",
    ampm: "AM",
    title: "",
    description: "",
    location: "",
    category: "activity",
    cost: 0,
  });

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

  useEffect(() => {
    setDraftDays(cloneDays(itinerary?.days || []));
  }, [itinerary]);

  const handleAddActivity = (dayIndex) => {
    if (!activityForm.hour || !activityForm.minute || !activityForm.title.trim()) {
      alert("Time and title are required");
      return;
    }

    const time = `${activityForm.hour}:${activityForm.minute} ${activityForm.ampm}`;

    const newActivity = {
      time,
      title: activityForm.title,
      description: activityForm.description,
      location: activityForm.location,
      category: "activity",
      cost: 0,
      source: "custom",
    };

    setDraftDays((prev) => {
      const days = cloneDays(prev);
      if (!days[dayIndex]) return days;

      let activities = days[dayIndex].activities || [];
      activities = activities.filter((a) => a.time !== time);
      activities.push(newActivity);

      activities.sort((a, b) => {
        const t1 = new Date(`1970/01/01 ${a.time}`);
        const t2 = new Date(`1970/01/01 ${b.time}`);
        return t1 - t2;
      });

      days[dayIndex].activities = activities;
      return days;
    });

    setShowAddActivity(null);
    setActivityForm({
      hour: "",
      minute: "",
      ampm: "AM",
      title: "",
      description: "",
      location: "",
      category: "activity",
      cost: 0,
    });
  };

  const handleDeleteActivity = (dayIndex, actIndex) => {
    setDraftDays((prev) => {
      const days = cloneDays(prev);
      if (!days[dayIndex]?.activities) return days;

      days[dayIndex].activities.splice(actIndex, 1);
      return days;
    });
  };

  const handleSaveManualEdits = async () => {
    setSaving(true);
    try {
      const data = await tripService.updateItinerary(tripId, draftDays);
      setItinerary(data.itinerary);
      onManualSave?.();
    } catch {
      alert("Failed to save itinerary");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelManualEdits = () => {
    setDraftDays(cloneDays(itinerary?.days || []));
    setShowAddActivity(null);
    onCancelEdit?.();
  };

  const toggleDay = (i) =>
    setExpandedDays((prev) => ({ ...prev, [i]: !prev[i] }));

  const visibleDays = isEditMode ? draftDays : itinerary?.days || [];

  if (loading) {
    return (
      <div className="flex justify-center py-14">
        <div className="w-10 h-10 border-[3px] border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title">
          {isEditMode ? "Manual Edit Itinerary" : "Itinerary"}
        </h2>
      </div>

      {!visibleDays?.length ? (
        <div className="card p-14 text-center">
          <p className="text-5xl mb-4">🗺️</p>
          <p className="font-bold text-gray-500 mb-1">No itinerary yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleDays.map((day, di) => (
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
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-sm group-hover:text-primary-500 transition-colors">
                      {day.title || `Day ${day.day}`}
                    </p>

                    <p className="text-xs text-gray-400">
                      {day.activities?.length || 0} activities
                    </p>
                  </div>
                </div>

                {expandedDays[di] ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>

              {expandedDays[di] && (
                <div className="px-4 pb-4 border-t border-gray-50 dark:border-surface-850">
                  <div className="space-y-2.5 mt-3">
                    {day.activities?.map((act, ai) => (
                      <div key={ai} className="flex gap-3 group/act">
                        <div className="w-16 text-xs text-gray-400 pt-3 flex-shrink-0 font-medium">
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
                                  className={`badge text-[10px] ${
                                    CATEGORY_STYLES[act.category] ||
                                    CATEGORY_STYLES.other
                                  }`}
                                >
                                  {act.category}
                                </span>
                              </div>

                              {act.description && (
                                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                  {act.description}
                                </p>
                              )}

                              {act.location && (
                                <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                  <MapPin size={11} /> {act.location}
                                </p>
                              )}
                            </div>

                            {isEditMode && (
                              <button
                                onClick={() => handleDeleteActivity(di, ai)}
                                className="opacity-0 group-hover/act:opacity-100 text-red-400 hover:text-red-600 transition-all p-1 rounded-lg hover:bg-red-50 flex-shrink-0"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {isEditMode && showAddActivity === di ? (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 rounded-xl p-3 space-y-2 animate-fade-in">
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            className="input-field text-xs"
                            placeholder="HH"
                            value={activityForm.hour}
                            onChange={(e) =>
                              setActivityForm({
                                ...activityForm,
                                hour: e.target.value,
                              })
                            }
                          />

                          <input
                            className="input-field text-xs"
                            placeholder="MM"
                            value={activityForm.minute}
                            onChange={(e) =>
                              setActivityForm({
                                ...activityForm,
                                minute: e.target.value,
                              })
                            }
                          />

                          <select
                            className="input-field text-xs"
                            value={activityForm.ampm}
                            onChange={(e) =>
                              setActivityForm({
                                ...activityForm,
                                ampm: e.target.value,
                              })
                            }
                          >
                            <option>AM</option>
                            <option>PM</option>
                          </select>
                        </div>

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
                        />

                        <textarea
                          className="input-field text-xs"
                          placeholder="Description"
                          value={activityForm.description}
                          onChange={(e) =>
                            setActivityForm({
                              ...activityForm,
                              description: e.target.value,
                            })
                          }
                        />

                        <input
                          className="input-field text-xs"
                          placeholder="Location"
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
                            className="btn-secondary text-xs"
                          >
                            Cancel
                          </button>

                          <button
                            onClick={() => handleAddActivity(di)}
                            className="btn-primary text-xs"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    ) : isEditMode ? (
                      <button
                        onClick={() => setShowAddActivity(di)}
                        className="flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-700 font-medium mt-1.5 transition-colors"
                      >
                        <Plus size={13} /> Add activity
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isEditMode && (
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={handleCancelManualEdits}
                className="btn-secondary text-sm"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveManualEdits}
                className="btn-primary text-sm"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Itinerary"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
