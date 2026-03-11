import { useState, useEffect, useRef } from "react";
import { Bell, X, Check } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useSocketStore } from "../store/socketStore";
import api from "../services/api";
import { formatDistanceToNow } from "date-fns";

const TYPE_ICONS = {
  TRIP_INVITE: "✈️", NEW_EXPENSE: "💳", SETTLEMENT_REQUEST: "💸",
  ADMIN_TRANSFER: "👑", NEW_MESSAGE: "💬", ITINERARY_UPDATE: "🗺️", MEMBER_JOINED: "👋", MEMBER_LEFT: "👋",
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const { token } = useAuthStore();
  const { socket } = useSocketStore();
  const ref = useRef();

  useEffect(() => { fetchNotifications(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("new_notification", (n) => {
      setNotifications((prev) => [n, ...prev]);
      setUnread((u) => u + 1);
    });
    return () => socket.off("new_notification");
  }, [socket]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications);
      setUnread(res.data.unreadCount);
    } catch {}
  };

  const markAllRead = async () => {
    await api.patch("/notifications/read-all");
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="relative theme-toggle">
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold px-1">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2.5 w-80 bg-white dark:bg-surface-900 rounded-2xl shadow-xl dark:shadow-black/40 border border-gray-100 dark:border-surface-850 z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50 dark:border-surface-850">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-primary-500 dark:text-primary-400 hover:underline font-medium">
                  <Check size={11} /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-surface-850">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="mx-auto mb-2 text-gray-300 dark:text-gray-700" size={24} />
                <p className="text-sm text-gray-400 dark:text-gray-600">All caught up!</p>
              </div>
            ) : notifications.map((n) => (
              <div key={n._id}
                className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-surface-850 transition-colors ${
                  !n.read ? "bg-primary-50/60 dark:bg-primary-900/10" : ""
                }`}>
                <div className="flex gap-3">
                  <span className="text-lg flex-shrink-0 leading-none mt-0.5">{TYPE_ICONS[n.type] || "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{n.message}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400 mt-1.5 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
