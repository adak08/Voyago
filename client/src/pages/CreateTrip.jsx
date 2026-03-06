import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, DollarSign, FileText, Plane } from "lucide-react";
import { useTripStore } from "../store/tripStore";

export default function CreateTrip() {
  const navigate = useNavigate();
  const { createTrip } = useTripStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "", destination: "", description: "",
    startDate: "", endDate: "", budget: "", currency: "INR",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (new Date(form.endDate) < new Date(form.startDate)) {
      return setError("End date must be after start date");
    }
    setLoading(true);
    try {
      const trip = await createTrip(form);
      navigate(`/trip/${trip._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create trip");
    }
    setLoading(false);
  };

  const f = (key) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 page-enter">
        <button onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 mb-8 text-sm font-medium transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Dashboard
        </button>

        <div className="card p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20">
              <Plane className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Plan a New Trip</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Fill in the details to get started</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Trip Title *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" size={16} />
                <input type="text" className="input-field pl-9" placeholder="Goa Beach Getaway"
                  {...f("title")} required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Destination *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" size={16} />
                <input type="text" className="input-field pl-9" placeholder="Goa, India"
                  {...f("destination")} required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Description
              </label>
              <textarea className="input-field resize-none" rows={3} placeholder="What's this trip about?"
                {...f("description")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                  Start Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" size={16} />
                  <input type="date" className="input-field pl-9"
                    {...f("startDate")} required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                  End Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" size={16} />
                  <input type="date" className="input-field pl-9"
                    {...f("endDate")} required />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                  Budget
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" size={16} />
                  <input type="number" className="input-field pl-9" placeholder="50000"
                    {...f("budget")} min="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                  Currency
                </label>
                <select className="input-field" {...f("currency")}>
                  <option value="INR">INR ₹</option>
                  <option value="USD">USD $</option>
                  <option value="EUR">EUR €</option>
                  <option value="GBP">GBP £</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm font-bold mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating trip…
                </span>
              ) : "Create Trip 🚀"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
