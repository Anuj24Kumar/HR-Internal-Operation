import { Bell } from "lucide-react";

export default function Topbar({
  userName,
  pendingRounds,
  showNotifications,
  setShowNotifications,
}) {
  return (
    <header className="topbar">
      <p className="topbar-welcome">Welcome, {userName || "Interviewer"}!</p>
      <div className="top-actions" style={{ marginLeft: "auto" }}>
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="top-icon-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {pendingRounds > 0 && <span className="notification-dot"></span>}
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
              {pendingRounds > 0 ? (
                <div style={{ fontSize: "12px", color: "var(--foreground)" }}>
                  You have <strong>{pendingRounds} interview evaluation(s)</strong> awaiting rating
                  and feedback.
                </div>
              ) : (
                <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                  All assigned interview feedbacks have been submitted!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
