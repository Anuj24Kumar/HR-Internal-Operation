import React from "react";

export function RoleBadge({ role }) {
  const roleStyles = {
    admin: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", label: "Admin" },
    hr: { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe", label: "HR" },
    "hiring-manager": { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa", label: "Hiring Manager" },
    interviewer: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0", label: "Interviewer" },
    candidate: { bg: "#fefce8", color: "#a16207", border: "#fef08a", label: "Candidate" },
    intern: { bg: "#ecfeff", color: "#0e7490", border: "#a5f3fc", label: "Intern" },
    employee: { bg: "#fdf2f8", color: "#be185d", border: "#fbcfe8", label: "Employee" },
  };

  const style = roleStyles[role] || {
    bg: "#f1f5f9",
    color: "#475569",
    border: "#e2e8f0",
    label: role,
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: "12px",
        fontSize: "11.5px",
        fontWeight: "600",
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        textTransform: "capitalize",
      }}
    >
      {style.label}
    </span>
  );
}

export function StatusBadge({ active, label }) {
  const isPositive = active === true || label === "active" || label === "verified" || label === "approved";
  const isPending = label === "pending" || label === "screening" || label === "interview" || label === "draft";

  let className = "admin-badge badge-neutral";
  let display = label || (active ? "Active" : "Inactive");

  if (isPositive) {
    className = "admin-badge badge-active";
  } else if (isPending) {
    className = "admin-badge badge-warning";
  } else if (active === false || label === "inactive" || label === "rejected" || label === "archived") {
    className = "admin-badge badge-inactive";
  }

  return (
    <span className={className}>
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: isPositive ? "#10b981" : isPending ? "#f59e0b" : "#ef4444",
        }}
      />
      {display}
    </span>
  );
}
