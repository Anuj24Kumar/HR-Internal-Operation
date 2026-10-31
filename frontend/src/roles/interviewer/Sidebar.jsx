import {
  CalendarDays,
  CheckCircle2,
  LayoutDashboard,
  LogOut,
  MessageSquareCheck,
  UserRound,
} from "lucide-react";

export default function Sidebar({
  user,
  logout,
  activeTab,
  setActiveTab,
  onOpenProfile,
  assignedInterviewRounds,
  completedInterviewRounds,
  feedbackCompletedRounds,
}) {
  return (
    <aside className="sidebar" aria-label="Interviewer Navigation">
      <a
        className="brand"
        href="#interviews"
        onClick={(event) => {
          event.preventDefault();
          setActiveTab("dashboard");
        }}
      >
        <svg className="brand-mark" viewBox="0 0 32 36" fill="none" aria-hidden="true">
          <path d="M3 3h13c9 0 14 5 14 12s-5 12-14 12h-5v7H3V3Z" fill="currentColor" />
          <path d="M11 11h5c3 0 5 1 5 4s-2 4-5 4h-5v-8Z" fill="#111827" />
          <path d="M3 27h8v7H3z" fill="#818cf8" />
        </svg>
        <span>PeopleOps</span>
      </a>

      <nav className="nav-group">
        <button
          type="button"
          className={`nav-link ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          <span className="nav-link-content">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </span>
        </button>

        <button
          type="button"
          className={`nav-link ${activeTab === "assigned" ? "active" : ""}`}
          onClick={() => setActiveTab("assigned")}
        >
          <span className="nav-link-content">
            <CalendarDays size={18} />
            <span>Assigned Interviews</span>
          </span>
          <span className="nav-badge">{assignedInterviewRounds}</span>
        </button>

        <button
          type="button"
          className={`nav-link ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          <span className="nav-link-content">
            <CheckCircle2 size={18} />
            <span>Completed Interviews</span>
          </span>
          <span className="nav-badge">{completedInterviewRounds}</span>
        </button>

        <button
          type="button"
          className={`nav-link ${activeTab === "feedback-completed" ? "active" : ""}`}
          onClick={() => setActiveTab("feedback-completed")}
        >
          <span className="nav-link-content">
            <MessageSquareCheck size={18} />
            <span>Feedback Completed</span>
          </span>
          <span className="nav-badge">{feedbackCompletedRounds}</span>
        </button>
      </nav>

      <div className="sidebar-bottom">
        <div className="user-snippet">
          <button
            type="button"
            className="sidebar-profile-button"
            onClick={onOpenProfile}
            aria-label="Open your profile"
          >
            <div className="user-avatar-circle" style={{ background: "#059669" }}>
              {(user?.name || "IV").slice(0, 2).toUpperCase()}
            </div>
            <div className="user-info-text">
              <p className="user-name-text">{user?.name || "Interviewer"}</p>
              <p className="user-role-text">{user?.email || "Interviewer account"}</p>
            </div>
            <UserRound size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={logout}
            title="Log out"
            style={{ color: "var(--sidebar-muted)", padding: "4px" }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
