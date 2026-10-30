import React from "react";
import { Users, FileText, GitBranch, History, ArrowRight, Briefcase, UserCheck } from "lucide-react";

export default function QuickActions({ onSelectTab }) {
  const actions = [
    { id: "users", label: "Manage Users", icon: Users },
    { id: "recruitment", label: "Recruitment", icon: Briefcase },
    { id: "employees", label: "Employees", icon: UserCheck },
    { id: "workflows", label: "Approval Workflows", icon: GitBranch },
    { id: "templates", label: "Templates", icon: FileText },
    { id: "audit", label: "Audit Logs", icon: History },
  ];

  return (
    <div className="admin-quick-actions-section">
      <div className="admin-section-title">Quick actions</div>
      <div className="admin-quick-actions-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              type="button"
              className="admin-quick-action-btn"
              onClick={() => onSelectTab(act.id)}
            >
              <div className="btn-left">
                <Icon size={17} />
                <span>{act.label}</span>
              </div>
              <ArrowRight size={15} className="btn-arrow" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
