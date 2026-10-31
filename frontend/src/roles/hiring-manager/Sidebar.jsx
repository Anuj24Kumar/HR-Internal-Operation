import {
  BriefcaseBusiness,
  CheckSquare,
  LayoutGrid,
  LogOut,
  UserRound,
  Users,
} from "lucide-react";

export default function Sidebar({
  user,
  logout,
  activeTab,
  setActiveTab,
  onOpenProfile,
  candidateCount,
  approvalCount,
  roleCount,
}) {
  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "candidates", label: "Assigned Candidates", icon: Users, count: candidateCount },
    { id: "approvals", label: "Offer Approvals", icon: CheckSquare, count: approvalCount },
    { id: "roles", label: "Department Roles", icon: BriefcaseBusiness, count: roleCount },
  ];

  return (
    <aside className="sidebar" aria-label="Hiring Manager Navigation">
      <a
        className="brand"
        href="#overview"
        onClick={(event) => {
          event.preventDefault();
          setActiveTab("overview");
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
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button
            type="button"
            className={`nav-link ${activeTab === id ? "active" : ""}`}
            onClick={() => setActiveTab(id)}
            key={id}
          >
            <span className="nav-link-content">
              <Icon size={18} />
              <span>{label}</span>
            </span>
            {count !== undefined && (
              <span className={`nav-badge ${id === "approvals" && count > 0 ? "alert" : ""}`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="user-snippet">
          <button
            type="button"
            className="sidebar-profile-button"
            onClick={onOpenProfile}
            aria-label="Open your profile"
          >
            <div className="user-avatar-circle">
              {(user?.name || "HM").slice(0, 2).toUpperCase()}
            </div>
            <div className="user-info-text">
              <p className="user-name-text">{user?.name || "Hiring Manager"}</p>
              <p className="user-role-text">{user?.email || "Hiring Manager account"}</p>
            </div>
            <UserRound size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={logout}
            title="Log out"
            aria-label="Log out"
            style={{ color: "var(--sidebar-muted)", padding: "4px" }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
