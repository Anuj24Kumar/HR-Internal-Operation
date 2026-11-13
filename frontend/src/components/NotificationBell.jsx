import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, ExternalLink } from "lucide-react";
import { apiRequest } from "../api.js";

function relativeTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((new Date() - date) / 1000);
  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

function notificationTitle(type) {
  switch (type) {
    case "interview":
    case "interview_scheduled":
      return "Interview Update";
    case "offer":
    case "offer_sent":
    case "offer_accepted":
      return "Offer Letter";
    case "onboarding":
      return "Onboarding";
    case "approval":
      return "Approval Request";
    case "document":
      return "Document Status";
    default:
      return "Notification";
  }
}

export default function NotificationBell({ className = "" }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dropdownRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    const token = localStorage.getItem("hr-auth-token") || localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await apiRequest("/notifications");
      const list = res.data?.notifications || res.notifications || [];
      setNotifications(list);
      setUnreadCount(res.data?.unreadCount ?? list.filter(n => !n.isRead).length);
      setError("");
    } catch (err) {
      // Quiet fail on network/unmounted
      console.warn("Notifications load failed:", err.message);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const markAsRead = async (notification) => {
    const id = notification._id || notification.id;
    if (!id || notification.isRead) return;

    try {
      await apiRequest(`/notifications/${id}/read`, { method: "PATCH" });
      setNotifications(prev =>
        prev.map(n => (n._id === id || n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Mark read error:", err.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiRequest("/notifications/read-all", { method: "PATCH" });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all read error:", err.message);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition"
              >
                <Check className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-0.5">
            {error ? (
              <p className="px-3 py-4 text-center text-xs text-rose-600">{error}</p>
            ) : notifications.length > 0 ? (
              notifications.slice(0, 15).map((n, idx) => {
                const isRead = n.isRead;
                return (
                  <div
                    key={n._id || n.id || idx}
                    className={`relative rounded-xl border p-3 text-xs transition ${
                      isRead
                        ? "border-slate-100 bg-slate-50/70 text-slate-600"
                        : "border-blue-100 bg-blue-50/50 text-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900">
                        {notificationTitle(n.type)}
                      </p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {relativeTime(n.createdAt)}
                      </span>
                    </div>

                    <p className="mt-1 text-slate-600 leading-relaxed">{n.message}</p>

                    <div className="mt-2 flex items-center justify-between gap-2 pt-1 border-t border-slate-100/60">
                      {n.link ? (
                        <a
                          href={n.link}
                          onClick={() => {
                            markAsRead(n);
                            setOpen(false);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                        >
                          View Details
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span />
                      )}

                      {!isRead && (
                        <button
                          type="button"
                          onClick={() => markAsRead(n)}
                          className="text-[11px] font-medium text-slate-500 hover:text-blue-600 transition"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No notifications right now
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
