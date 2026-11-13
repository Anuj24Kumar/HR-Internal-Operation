import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle, RefreshCw, Users, BriefcaseBusiness, CalendarDays, BadgeCheck, ClipboardCheck } from "lucide-react";
import { fetchOverview, fetchConversions, fetchPipelineDistribution } from "../adminApi.js";
import { RoleBadge } from "../components/Badge.jsx";

const STAGES = [
  ["applied", "#3b82f6"], ["interview", "#8b5cf6"], ["selected", "#10b981"],
  ["offer_sent", "#6366f1"], ["offer_received", "#0ea5e9"],
  ["accepted", "#059669"], ["converted", "#0f766e"], ["rejected", "#ef4444"],
];
const OFFER_STATES = ["draft", "sent", "offer_received", "accepted", "declined", "expired"];
const formatLabel = (value) => value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const countMap = (items = []) => Object.fromEntries(items.map(({ _id, count }) => [_id, Number(count) || 0]));

export default function DashboardView({ user, onSelectTab, onSelectStatus }) {
  const [overview, setOverview] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [conversions, setConversions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewResponse, pipelineResponse, conversionResponse] = await Promise.all([
        fetchOverview(),
        fetchPipelineDistribution(),
        fetchConversions({ limit: 5 }),
      ]);
      setOverview(overviewResponse.data || {});
      setPipeline(pipelineResponse.pipeline || {});
      setConversions(conversionResponse.data?.conversions || []);
    } catch (requestError) {
      setError(requestError.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const applications = countMap(overview?.appsByStatus);
  const offers = countMap(overview?.offersByStatus);
  const roles = countMap(overview?.usersByRole);
  const totalUsers = Object.values(roles).reduce((sum, count) => sum + count, 0);
  const activeApplications = Object.entries(applications)
    .filter(([status]) => !["converted", "rejected"].includes(status))
    .reduce((sum, [, count]) => sum + count, 0);
  const pendingOffers = ["draft", "pending_approval", "approved", "sent", "offer_received"]
    .reduce((sum, status) => sum + (offers[status] || 0), 0);

  const card = (title, value, icon, tab) => (
    <button type="button" className="admin-card" onClick={() => onSelectTab(tab)} style={{ textAlign: "left", cursor: "pointer" }}>
      <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
        <span>{title}</span>{icon}
      </div>
      <strong style={{ display: "block", fontSize: 28, color: "#0f172a", marginTop: 10 }}>{value ?? 0}</strong>
    </button>
  );

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div className="admin-header-title-row">
          <div>
            <h1 className="admin-page-title">Dashboard</h1>
            <p className="admin-page-subtitle">Welcome back, {user?.name || "Admin"}. Workflow activity and account oversight.</p>
          </div>
          <button type="button" className="admin-btn admin-btn-secondary" onClick={load} disabled={loading}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>
      {error && <div className="admin-alert admin-alert-error"><AlertCircle size={16} />{error}</div>}
      {loading && !overview ? <div className="admin-card">Loading overview…</div> : (
        <>
          <div className="admin-stats-grid">
            {card("Total Users", totalUsers, <Users size={18} />, "users")}
            {card("Active Applications", activeApplications, <BriefcaseBusiness size={18} />, "recruitment")}
            {card("Pending Offers", pendingOffers, <ClipboardCheck size={18} />, "recruitment")}
            {card("Interviews This Week", overview?.interviewsThisWeek, <CalendarDays size={18} />, "recruitment")}
            {card("Conversions (30d)", overview?.conversionsLast30d, <BadgeCheck size={18} />, "audit")}
          </div>

          <div className="admin-card">
            <h2 className="admin-card-title">Users by Role</h2>
            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              {["admin", "hr", "hiring_manager", "interviewer", "candidate", "intern", "employee"].map((role) => (
                <div key={role} style={{ display: "grid", gridTemplateColumns: "150px 1fr 40px", alignItems: "center", gap: 10 }}>
                  <span>{formatLabel(role)}</span>
                  <div style={{ height: 10, borderRadius: 8, background: "#e2e8f0", overflow: "hidden" }}>
                    <div style={{ width: `${totalUsers ? Math.min(100, (roles[role] || 0) / totalUsers * 100) : 0}%`, height: "100%", background: "#4f46e5" }} />
                  </div>
                  <strong>{roles[role] || 0}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header"><div><h2 className="admin-card-title">Application Pipeline</h2><p className="admin-card-subtitle">Select a status to inspect its applications.</p></div></div>
            <div style={{ display: "flex", height: 24, borderRadius: 8, overflow: "hidden", margin: "16px 0" }}>
              {STAGES.map(([status, color]) => {
                const count = pipeline?.[status] || applications[status] || 0;
                const total = pipeline?.total || 0;
                return total && count ? (
                  <button key={status} title={`${formatLabel(status)}: ${count}`} onClick={() => onSelectStatus?.(status)} style={{ width: `${count / total * 100}%`, minWidth: 3, background: color, border: 0, cursor: "pointer" }} />
                ) : null;
              })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
              {STAGES.map(([status, color]) => (
                <button key={status} type="button" onClick={() => onSelectStatus?.(status)} className="admin-btn admin-btn-secondary admin-btn-sm" style={{ justifyContent: "space-between", borderLeft: `4px solid ${color}` }}>
                  {formatLabel(status)} <strong>{pipeline?.[status] || applications[status] || 0}</strong>
                </button>
              ))}
            </div>
          </div>

          <div className="admin-card">
            <h2 className="admin-card-title">Offers by State</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginTop: 14 }}>
              {OFFER_STATES.map((status) => {
                const max = Math.max(1, ...OFFER_STATES.map((key) => offers[key] || 0));
                return <div key={status} style={{ padding: 12, background: "#f8fafc", borderRadius: 8 }}>
                  <div style={{ color: "#64748b", fontSize: 12 }}>{formatLabel(status)}</div>
                  <div style={{ height: 6, background: "#e2e8f0", borderRadius: 5, margin: "8px 0" }}>
                    <div style={{ width: `${(offers[status] || 0) / max * 100}%`, height: "100%", background: "#6366f1", borderRadius: 5 }} />
                  </div>
                  <strong>{offers[status] || 0}</strong>
                </div>;
              })}
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <div><h2 className="admin-card-title">Recent Conversions</h2><p className="admin-card-subtitle">Most recent role-change audit records.</p></div>
              <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => onSelectTab("audit")}>View audit logs</button>
            </div>
            <div className="admin-table-container"><table className="admin-table">
              <thead><tr><th>User</th><th>Role Change</th><th>Admin</th><th>Timestamp</th></tr></thead>
              <tbody>{conversions.map((log) => (
                <tr key={log._id}>
                  <td>{log.targetUser?.name || "Deleted user"}</td>
                  <td>{log.oldValue?.role || "—"} → {log.newValue?.role || "—"}</td>
                  <td>{log.userId?.name || log.userId?.email || "System"}</td>
                  <td>{log.timestamp ? new Date(log.timestamp).toLocaleString() : "—"}</td>
                </tr>
              ))}{!conversions.length && <tr><td colSpan={4}>No conversions recorded.</td></tr>}</tbody>
            </table></div>
          </div>

          <div className="admin-card">
            <h2 className="admin-card-title">Quick Actions</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {[["Create / Manage Users", "users"], ["View Pipeline", "recruitment"], ["View Audit Logs", "audit"], ["Manage Templates", "templates"], ["Employees & Interns", "employees"]].map(([label, tab]) => (
                <button key={tab} type="button" className="admin-btn admin-btn-secondary" onClick={() => onSelectTab(tab)}>{label}</button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
