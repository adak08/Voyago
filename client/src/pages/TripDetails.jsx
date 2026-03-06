import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Map, DollarSign, MessageCircle, Users, Share2, Copy, Calendar, Clock, Plane } from "lucide-react";
import { useTripStore } from "../store/tripStore";
import { useAuthStore } from "../store/authStore";
import { useSocket } from "../hooks/useSocket";
import ItineraryBoard from "../components/ItineraryBoard";
import ExpenseWidget from "../components/ExpenseWidget";
import ChatBox from "../components/ChatBox";
import { format } from "date-fns";

const TABS = [
  { id: "itinerary", label: "Itinerary",  icon: Map },
  { id: "expenses",  label: "Expenses",   icon: DollarSign },
  { id: "chat",      label: "Chat",       icon: MessageCircle },
  { id: "members",   label: "Members",    icon: Users },
];

const STATUS_STYLES = {
  upcoming:  "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  ongoing:   "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  completed: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
};

export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentTrip, fetchTrip, loading } = useTripStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("itinerary");
  const [copied, setCopied] = useState(false);

  useSocket(id);

  useEffect(() => { fetchTrip(id); }, [id]);

  const copyInviteCode = () => {
    navigator.clipboard.writeText(currentTrip?.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading && !currentTrip) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-11 h-11 border-[3px] border-primary-500/20 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading trip…</p>
        </div>
      </div>
    );
  }

  if (!currentTrip) return null;

  const isAdmin = currentTrip.admin?._id === user?.id || currentTrip.admin === user?.id;
  const duration = Math.ceil(
    (new Date(currentTrip.endDate) - new Date(currentTrip.startDate)) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* ─── Trip Header ─── */}
      <div className="bg-white dark:bg-surface-900 border-b border-gray-100 dark:border-surface-850">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
          <button onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 mb-5 font-medium transition-colors group">
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" /> Dashboard
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap mb-2">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20">
                  <Plane className="text-white" size={15} />
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white truncate">{currentTrip.title}</h1>
                <span className={`badge text-xs ${STATUS_STYLES[currentTrip.status]}`}>
                  {currentTrip.status}
                </span>
              </div>

              <div className="flex items-center gap-4 flex-wrap text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600" />
                  📍 {currentTrip.destination}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  {format(new Date(currentTrip.startDate), "MMM d")} – {format(new Date(currentTrip.endDate), "MMM d, yyyy")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={13} /> {duration} days
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={13} /> {currentTrip.members?.length} members
                </span>
              </div>
            </div>

            <button onClick={copyInviteCode}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex-shrink-0 ${
                copied
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-600 dark:text-primary-400"
              }`}>
              {copied
                ? <><Copy size={13} /> Copied!</>
                : <><Share2 size={13} /> {currentTrip.inviteCode}</>
              }
            </button>
          </div>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="bg-white dark:bg-surface-900 border-b border-gray-100 dark:border-surface-850 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0 overflow-x-auto scrollbar-none">
            {TABS.map(({ id: tabId, label, icon: Icon }) => (
              <button key={tabId} onClick={() => setActiveTab(tabId)}
                className={activeTab === tabId ? "tab-btn-active" : "tab-btn-inactive"}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Tab Content ─── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-7 page-enter" key={activeTab}>
        {activeTab === "itinerary" && <ItineraryBoard tripId={id} trip={currentTrip} />}
        {activeTab === "expenses"  && <ExpenseWidget  tripId={id} trip={currentTrip} />}
        {activeTab === "chat"      && <ChatBox tripId={id} />}
        {activeTab === "members"   && <MembersTab trip={currentTrip} isAdmin={isAdmin} userId={user?.id} />}
      </div>
    </div>
  );
}

function MembersTab({ trip, isAdmin, userId }) {
  return (
    <div className="max-w-lg">
      <h2 className="section-title mb-5">Members ({trip.members?.length})</h2>
      <div className="space-y-3">
        {trip.members?.map((m) => (
          <div key={m.user?._id} className="card p-4 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-violet-500 flex items-center justify-center font-bold text-white text-sm">
                {m.user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {m.user?.name}
                  {m.user?._id === userId && (
                    <span className="text-gray-400 dark:text-gray-600 font-normal text-xs"> (you)</span>
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">{m.user?.email}</p>
              </div>
            </div>
            <span className={`badge text-xs ${
              m.role === "admin"
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                : "bg-gray-100 dark:bg-surface-850 text-gray-600 dark:text-gray-400"
            }`}>
              {m.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
