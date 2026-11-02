import { useState, useRef, useEffect } from "react";
import { Bell, User, LogOut, Menu, Check } from "lucide-react";

export default function UnifiedNavbar({
  user,
  roleLabel = "User",
  onViewProfile,
  onLogout,
  notifications = [],
  onToggleMobile,
  leftContent,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeNotifications, setActiveNotifications] = useState(notifications);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Sync notifications if prop changes
  useEffect(() => {
    setActiveNotifications(notifications);
  }, [notifications]);

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

  const unreadCount = activeNotifications.length;

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
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
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
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveNotifications([])}
                    className="text-[11px] font-medium text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Check size={12} />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1.5 py-1">
                {activeNotifications.length > 0 ? (
                  activeNotifications.map((notif, index) => (
                    <div
                      key={notif.id || index}
                      className="rounded-lg p-2.5 text-xs text-slate-700 bg-slate-50 border border-slate-100"
                    >
                      <p className="font-semibold text-slate-900">{notif.title || "Update"}</p>
                      <p className="mt-0.5 text-slate-500">{notif.message || notif.text || notif}</p>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No new notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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
