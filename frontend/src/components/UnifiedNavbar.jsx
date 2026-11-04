import { useState, useRef, useEffect, useCallback } from "react";
import { Bell, User, LogOut, Menu, Check } from "lucide-react";
import { apiRequest } from "../api.js";

function relativeTime(value) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function notificationTitle(type) {
  return String(type || "info")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function UnifiedNavbar({
  user,
  roleLabel = "User",
  onViewProfile,
  onLogout,
  onToggleMobile,
  leftContent,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationError, setNotificationError] = useState("");

  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const showNotifications =
    roleLabel.toLowerCase() !== "admin" && user?.role !== "admin";

  const loadNotifications = useCallback(async () => {
    try {
      const result = await apiRequest("/notifications");
      setNotifications(result.data?.notifications || []);
      setUnreadCount(Number(result.data?.unreadCount) || 0);
      setNotificationError("");
    } catch (error) {
      console.error("Unable to load notifications:", error.message);
      setNotificationError("Unable to load notifications.");
    }
  }, []);

  useEffect(() => {
    if (!showNotifications || !localStorage.getItem("hr-auth-token")) {
      return undefined;
    }

    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(intervalId);
  }, [loadNotifications, showNotifications]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.name ||
    roleLabel;

  const initials =
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || roleLabel.slice(0, 2).toUpperCase();

  async function markAsRead(notification) {
    const id = notification._id || notification.id;
    if (!id || notification.isRead) return;

    try {
      await apiRequest(`/notifications/${id}/read`, { method: "PATCH" });
      await loadNotifications();
    } catch (error) {
      console.error("Unable to mark notification as read:", error.message);
      setNotificationError("Unable to update this notification.");
    }
  }

  async function markAllAsRead() {
    try {
      await apiRequest("/notifications/read-all", { method: "PATCH" });
      await loadNotifications();
    } catch (error) {
      console.error("Unable to mark notifications as read:", error.message);
      setNotificationError("Unable to update notifications.");
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-[70px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Left side: Welcome <username>!! */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleMobile && (
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
            onClick={onToggleMobile}
            aria-label="Toggle navigation"
          >
            <Menu size={20} />
          </button>
        )}

        {leftContent ? (
          leftContent
        ) : (
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate tracking-tight">
              Welcome {fullName}!!
            </h2>
          </div>
        )}
      </div>

      {/* Right side: Notification icon & Profile icon in circle */}
      <div className="flex items-center gap-3">
        {/* Notification Icon */}
        {showNotifications && (
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen(!notifOpen);
              setProfileOpen(false);
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold leading-none text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                      {unreadCount} new
                    </span>
                  )}
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1.5 py-1">
                {notificationError ? (
                  <p className="px-2 py-4 text-center text-xs text-rose-600">
                    {notificationError}
                  </p>
                ) : notifications.length > 0 ? (
                  notifications.slice(0, 10).map((notification, index) => {
                    const item = (
                      <>
                        <p className="font-semibold text-slate-900">
                          {notificationTitle(notification.type)}
                        </p>
                        <p className="mt-0.5 text-slate-600">{notification.message}</p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {relativeTime(notification.createdAt)}
                        </p>
                      </>
                    );
                    const className = `block rounded-lg border p-2.5 text-xs text-slate-700 ${
                      notification.isRead
                        ? "border-slate-100 bg-slate-50"
                        : "border-blue-100 bg-blue-50/60"
                    }`;

                    return (
                      <div key={notification._id || notification.id || index} className="relative">
                        {notification.link ? (
                          <a
                            href={notification.link}
                            className={`${className} pr-16 hover:bg-slate-100`}
                          >
                            {item}
                          </a>
                        ) : (
                          <div className={`${className} pr-16`}>{item}</div>
                        )}
                        {!notification.isRead && (
                          <button
                            type="button"
                            onClick={() => markAsRead(notification)}
                            className="absolute right-2 top-2 text-[10px] font-medium text-blue-600 hover:underline"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No notifications
                  </div>
                )}
              </div>
              {unreadCount > 0 && (
                <div className="mt-2 border-t border-slate-100 pt-2">
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="flex w-full items-center justify-center gap-1 py-1 text-[11px] font-medium text-blue-600 hover:underline"
                  >
                    <Check size={12} />
                    Mark all read
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Profile Icon in Circle */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotifOpen(false);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-semibold text-sm transition-all hover:ring-2 hover:ring-blue-500/30 cursor-pointer shadow-xs select-none"
            aria-label="User profile menu"
          >
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </button>

          {/* Profile Dropdown: Exactly View Profile and Logout as requested */}
          {profileOpen && (
            <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  onViewProfile?.();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors font-medium text-left"
              >
                <User size={16} className="text-slate-500 shrink-0" />
                <span>View Profile</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  onLogout?.();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-left"
              >
                <LogOut size={16} className="shrink-0" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
