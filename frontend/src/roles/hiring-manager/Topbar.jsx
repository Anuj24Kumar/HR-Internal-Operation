import { Bell } from "lucide-react";

export default function Topbar({ userName, pendingCount, showNotifications, setShowNotifications }) {
  return (
    <header className="topbar">
      <p className="topbar-welcome">Welcome, {userName || "Hiring Manager"}!</p>
      <div className="top-actions" style={{ marginLeft: "auto" }}>
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="top-icon-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {pendingCount > 0 && <span className="notification-dot"></span>}
          </button>
          {showNotifications && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "42px",
                width: "280px",
                background: "#ffffff",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-lg)",
                padding: "12px",
                zIndex: 50,
              }}
            >
              <p style={{ fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>
                Notifications
              </p>
              {pendingCount > 0 ? (
                <div style={{ fontSize: "12px", color: "var(--foreground)" }}>
                  You have <strong>{pendingCount} pending offer approval(s)</strong> awaiting your
                  sign-off.
                </div>
              ) : (
                <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                  No new pending alerts. Everything is up to date!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
