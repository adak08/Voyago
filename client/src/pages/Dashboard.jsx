import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, LogOut, Plane, Users, Search, Sun, Moon, MapPin } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useTripStore } from "../store/tripStore";
import { useSocketStore } from "../store/socketStore";
import { useThemeStore } from "../store/themeStore";
import TripCard from "../components/TripCard";
import NotificationBell from "../components/NotificationBell";

export default function Dashboard() {
  const { user, logout, token } = useAuthStore();
  const { trips, fetchTrips, loading, joinTrip } = useTripStore();
  const { connect } = useSocketStore();
  const { dark, toggle } = useThemeStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [showJoin, setShowJoin] = useState(false);

  useEffect(() => {
    fetchTrips();
    connect(token);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoinError("");
    setJoining(true);
    try {
      const trip = await joinTrip(joinCode.trim().toUpperCase());
      setShowJoin(false);
      setJoinCode("");
      navigate(`/trip/${trip._id}`);
    } catch (err) {
      setJoinError(err.response?.data?.message || "Invalid invite code");
    }
    setJoining(false);
  };

  const filtered = trips.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.destination.toLowerCase().includes(search.toLowerCase())
  );

  const upcoming  = filtered.filter((t) => t.status === "upcoming");
  const ongoing   = filtered.filter((t) => t.status === "ongoing");
  const completed = filtered.filter((t) => t.status === "completed");

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* ─── Navbar ─── */}
      <nav className="nav-glass sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20">
              <Plane className="text-white" size={17} />
            </div>
            <span className="font-extrabold text-lg text-gray-900 dark:text-white tracking-tight">TripSync</span>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <button onClick={toggle} className="theme-toggle">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {/* User avatar */}
            <div className="flex items-center gap-2 ml-1 pl-2 border-l border-gray-200 dark:border-surface-850">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-violet-500 flex items-center justify-center font-bold text-white text-sm">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">{user?.name}</span>
            </div>
            <button onClick={handleLogout}
              className="btn-ghost ml-1 p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
              title="Logout">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 page-enter">
        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              My Trips
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {trips.length} trip{trips.length !== 1 ? "s" : ""} • Hey, {user?.name?.split(" ")[0]} 👋
            </p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => setShowJoin(!showJoin)} className="btn-secondary text-sm">
              <Users size={15} /> Join Trip
            </button>
            <button onClick={() => navigate("/trip/new")} className="btn-primary text-sm">
              <Plus size={15} /> New Trip
            </button>
          </div>
        </div>

        {/* ─── Join Trip form ─── */}
        {showJoin && (
          <div className="card p-4 mb-6 border border-primary-100 dark:border-primary-900/40 bg-primary-50/50 dark:bg-primary-900/10 animate-fade-in">
            <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide mb-3">Enter Invite Code</p>
            <form onSubmit={handleJoin} className="flex gap-3">
              <input type="text" className="input-field uppercase tracking-widest font-mono"
                placeholder="AB12CD34"
                value={joinCode} onChange={(e) => setJoinCode(e.target.value)} required />
              <button type="submit" disabled={joining} className="btn-primary whitespace-nowrap text-sm">
                {joining ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : "Join"}
              </button>
            </form>
            {joinError && <p className="text-red-500 dark:text-red-400 text-sm mt-2">{joinError}</p>}
          </div>
        )}

        {/* ─── Search ─── */}
        <div className="relative mb-8">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" size={16} />
          <input type="text" className="input-field pl-10" placeholder="Search trips by name or destination…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* ─── Content ─── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="skeleton h-36 rounded-none" />
                <div className="p-4 space-y-2.5">
                  <div className="skeleton h-5 w-3/4 rounded" />
                  <div className="skeleton h-3.5 w-1/2 rounded" />
                  <div className="skeleton h-3.5 w-2/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-gray-100 dark:bg-surface-850 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <MapPin className="text-gray-300 dark:text-gray-600" size={36} />
            </div>
            <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400 mb-2">No trips yet</h3>
            <p className="text-gray-400 dark:text-gray-600 text-sm mb-6">Create your first trip or join one with a code</p>
            <button onClick={() => navigate("/trip/new")} className="btn-primary text-sm">
              <Plus size={15} /> Plan your first trip
            </button>
          </div>
        ) : (
          <>
            {ongoing.length   > 0 && <Section title="🌍 Ongoing"   trips={ongoing} />}
            {upcoming.length  > 0 && <Section title="📅 Upcoming"  trips={upcoming} />}
            {completed.length > 0 && <Section title="✅ Completed" trips={completed} />}
            {filtered.length === 0 && search && (
              <div className="text-center py-16 text-gray-400 dark:text-gray-600">
                <Search className="mx-auto mb-3" size={32} />
                <p>No trips matching "<strong>{search}</strong>"</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, trips }) {
  const navigate = useNavigate();
  return (
    <div className="mb-10">
      <h2 className="text-sm font-bold text-gray-500 dark:text-gray-500 uppercase tracking-widest mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {trips.map((trip) => (
          <TripCard key={trip._id} trip={trip} onClick={() => navigate(`/trip/${trip._id}`)} />
        ))}
      </div>
    </div>
  );
}
