import React from "react";

export default function StatCard({ title, value, meta, icon: Icon, onClick }) {
  return (
    <div
      className="admin-stat-card"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="admin-stat-header">
        <span className="admin-stat-title">{title}</span>
        {Icon && (
          <div className="admin-stat-icon-wrap">
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="admin-stat-value">{value}</div>
      {meta && <div className="admin-stat-meta">{meta}</div>}
    </div>
  );
}
