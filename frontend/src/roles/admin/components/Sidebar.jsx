import React from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  GitBranch,
  History,
  LogOut,
  Briefcase,
  UserCheck,
} from "lucide-react";

export default function Sidebar({ activeTab, onSelectTab, onLogout, user }) {
  // Only tabs that have real Admin backend APIs
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Manage Users", icon: Users },
    { id: "recruitment", label: "Recruitment", icon: Briefcase },
    { id: "employees", label: "Employees", icon: UserCheck },
    { id: "workflows", label: "Approval Workflows", icon: GitBranch },
    { id: "templates", label: "Templates", icon: FileText },
    { id: "audit", label: "Audit Logs", icon: History },
  ];

  return (
    <aside className="admin-sidebar">
      {/* Brand */}
      <div className="admin-sidebar-header">
        <div className="admin-brand">
          <div className="admin-brand-icon">P</div>
          <span className="admin-brand-text">PeopleOps</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="admin-sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`admin-nav-item ${isActive ? "active" : ""}`}
              onClick={() => onSelectTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer / Account */}
      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-user">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "#2563eb",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: "700",
              }}
            >
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "AD"}
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#ffffff", fontWeight: "600" }}>
                {user?.name || "Admin"}
              </div>
              <div style={{ fontSize: "10.5px", color: "#64748b" }}>Admin role</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Log out"
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
            }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
