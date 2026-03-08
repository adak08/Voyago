import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Map,
  DollarSign,
  MessageCircle,
  Users,
  Share2,
  Copy,
  Calendar,
  Clock,
  Plane,
  Camera,
  Trash2,
  LogOut,
  Edit,
} from "lucide-react";

import { useTripStore } from "../store/tripStore";
import { useAuthStore } from "../store/authStore";
import { useSocket } from "../hooks/useSocket";

import ItineraryBoard from "../components/ItineraryBoard";
import ExpenseWidget from "../components/ExpenseWidget";
import ChatBox from "../components/ChatBox";
import PhotoGallery from "../components/PhotoGallery";

import { format } from "date-fns";

const TABS = [
  { id: "itinerary", label: "Itinerary", icon: Map },
  { id: "expenses", label: "Expenses", icon: DollarSign },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "photos", label: "Photos", icon: Camera },
  { id: "members", label: "Members", icon: Users },
];

const STATUS_STYLES = {
  upcoming: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  ongoing:
    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  completed: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
};

export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { currentTrip, fetchTrip, loading, deleteTrip, leaveTrip, updateTrip } =
    useTripStore();

  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState("itinerary");
  const [copied, setCopied] = useState(false);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");

  useSocket(id);

  useEffect(() => {
    if (id) fetchTrip(id);
  }, [id, fetchTrip]);

  useEffect(() => {
    if (currentTrip) {
      setTitle(currentTrip.title || "");
      setDestination(currentTrip.destination || "");
    }
  }, [currentTrip]);

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(currentTrip?.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Failed to copy invite code");
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Delete this trip permanently?");
    if (!confirmDelete) return;

    try {
      await deleteTrip(id);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete trip");
    }
  };

  const handleLeave = async () => {
    const confirmLeave = window.confirm("Leave this trip?");
    if (!confirmLeave) return;

    try {
      await leaveTrip(id);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to leave trip");
    }
  };

  const handleUpdate = async () => {
    if (!title.trim() || !destination.trim()) {
      alert("Title and destination cannot be empty");
      return;
    }

    try {
      await updateTrip(id, {
        title: title.trim(),
        destination: destination.trim(),
      });

      setEditing(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update trip");
    }
  };

  if (loading && !currentTrip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!currentTrip) return null;

  const isAdmin =
    currentTrip.admin?._id === user?.id || currentTrip.admin === user?.id;

  const duration = Math.ceil(
    (new Date(currentTrip.endDate) - new Date(currentTrip.startDate)) /
      (1000 * 60 * 60 * 24),
  );

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* HEADER */}
      <div className="bg-white dark:bg-surface-900 border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm mb-4"
          >
            <ArrowLeft size={15} /> Dashboard
          </button>

          {/* TITLE */}
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              {editing ? (
                <div className="space-y-2">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input-field"
                  />

                  <input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="input-field"
                  />

                  <button
                    onClick={handleUpdate}
                    className="btn-primary text-sm"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold">{currentTrip.title}</h1>

                  <div className="text-sm text-gray-500 mt-1">
                    📍 {currentTrip.destination}
                  </div>
                </>
              )}

              <div className="text-sm mt-2 flex gap-3 flex-wrap text-gray-500">
                <span>
                  <Calendar size={14} />{" "}
                  {format(new Date(currentTrip.startDate), "MMM d")} –{" "}
                  {format(new Date(currentTrip.endDate), "MMM d yyyy")}
                </span>

                <span>
                  <Clock size={14} /> {duration} days
                </span>

                <span>
                  <Users size={14} /> {currentTrip.members?.length} members
                </span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Invite code */}
              <button
                onClick={copyInviteCode}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-600 dark:text-primary-400 transition"
              >
                {copied ? "Copied!" : currentTrip.inviteCode}
              </button>

              {isAdmin && (
                <>
                  <button
                    onClick={() => setEditing(!editing)}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-surface-800 hover:bg-gray-200 dark:hover:bg-surface-700 transition"
                  >
                    <Edit size={14} />
                    Edit
                  </button>

                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </>
              )}

              {!isAdmin && (
                <button
                  onClick={handleLeave}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition"
                >
                  <LogOut size={14} />
                  Leave
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="border-b bg-white dark:bg-surface-900">
        <div className="max-w-6xl mx-auto flex gap-2 px-4 py-3 overflow-x-auto">
          {TABS.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={
                activeTab === tabId ? "tab-btn-active" : "tab-btn-inactive"
              }
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === "itinerary" && (
          <ItineraryBoard tripId={id} trip={currentTrip} />
        )}

        {activeTab === "expenses" && (
          <ExpenseWidget tripId={id} trip={currentTrip} />
        )}

        {activeTab === "chat" && <ChatBox tripId={id} />}

        {activeTab === "photos" && (
          <PhotoGallery tripId={id} trip={currentTrip} />
        )}

        {activeTab === "members" && (
          <MembersTab trip={currentTrip} userId={user?.id} />
        )}
      </div>
    </div>
  );
}

function MembersTab({ trip, userId }) {
  return (
    <div className="max-w-lg">
      <h2 className="section-title mb-5">Members ({trip.members?.length})</h2>

      <div className="space-y-4">
        {trip.members?.map((m) => (
          <div
            key={m.user?._id}
            className="card p-4 flex items-center justify-between hover:shadow-lg transition-all"
          >
            {/* Left section */}
            <div className="flex items-center gap-3">
              {/* Gradient Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-violet-500 flex items-center justify-center font-bold text-white text-sm">
                {m.user?.name?.[0]?.toUpperCase()}
              </div>

              {/* Name + Email */}
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {m.user?.name}
                  {m.user?._id === userId && (
                    <span className="text-gray-400 dark:text-gray-500 font-normal text-xs">
                      {" "}
                      (you)
                    </span>
                  )}
                </p>

                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {m.user?.email}
                </p>
              </div>
            </div>

            {/* Role badge */}
            <span
              className={`badge text-xs ${
                m.role === "admin"
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                  : "bg-gray-100 dark:bg-surface-850 text-gray-600 dark:text-gray-400"
              }`}
            >
              {m.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
