import React, { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  SlidersHorizontal,
  Activity,
  ArrowRight,
  Server,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  RefreshCw,
} from "lucide-react";
import StatCard from "../components/StatCard.jsx";
import QuickActions from "../components/QuickActions.jsx";
import { fetchAdminDashboard, fetchPipelineDistribution, fetchAuditLogs } from "../adminApi.js";
import { StatusBadge, RoleBadge } from "../components/Badge.jsx";

export default function DashboardView({ user, onSelectTab }) {
  const [stats, setStats] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, pipeRes, auditRes] = await Promise.all([
        fetchAdminDashboard().catch(() => null),
        fetchPipelineDistribution().catch(() => null),
        fetchAuditLogs({ limit: 5 }).catch(() => null),
      ]);

      if (dashRes?.stats) setStats(dashRes.stats);
      if (pipeRes?.pipeline) setPipeline(pipeRes.pipeline);
      if (auditRes?.logs) setRecentLogs(auditRes.logs);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  const activeUsersCount = stats?.activeUsers ?? 0;
  const totalHeadcount = stats?.totalHeadcount ?? 0;
  const pendingApprovalsCount = stats?.pendingApprovals ?? 0;
  const openCandidatesCount = stats?.openCandidates ?? 0;

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="admin-page-header">
        <div className="admin-header-title-row">
          <div>
            <h1 className="admin-page-title">Dashboard</h1>
            <p className="admin-page-subtitle">
              Welcome back, {user?.name || "Admin"}. Your accounts, approvals, and workspace activity at a glance.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-sm"
              onClick={loadDashboardData}
              title="Refresh dashboard"
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            type="button"
            className="admin-btn admin-btn-sm admin-btn-secondary"
            onClick={loadDashboardData}
            style={{ marginLeft: "auto" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Top 4 Stat Cards — Powered by GET /admin/dashboard */}
      <div className="admin-stats-grid">
        <StatCard
          title="Active Users"
          value={activeUsersCount}
          meta="System accounts with active status"
          icon={Users}
          onClick={() => onSelectTab("users")}
        />
        <StatCard
          title="Total Headcount"
          value={totalHeadcount}
          meta={`${stats?.totalEmployees || 0} Employees · ${stats?.totalInterns || 0} Interns`}
          icon={UserCheck}
          onClick={() => onSelectTab("employees")}
        />
        <StatCard
          title="Pending Approvals"
          value={pendingApprovalsCount}
          meta={`${stats?.offersInFlight || 0} Offers in flight`}
          icon={SlidersHorizontal}
          onClick={() => onSelectTab("workflows")}
        />
        <StatCard
          title="Open Candidates"
          value={openCandidatesCount}
          meta="In active recruitment pipeline"
          icon={Activity}
          onClick={() => onSelectTab("recruitment")}
        />
      </div>

      {/* Quick Actions Row — Matching Screenshot */}
      <QuickActions onSelectTab={onSelectTab} />

      {/* Hiring Pipeline Stage Breakdown */}
      {pipeline && (
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2 className="admin-card-title">Hiring Pipeline Distribution</h2>
              <div className="admin-card-subtitle">
                Total Candidates in Flight: <strong>{pipeline.total || 0}</strong>
              </div>
            </div>
            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-sm"
              onClick={loadDashboardData}
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "12px",
              marginTop: "8px",
            }}
          >
            {[
              { stage: "Applied", count: pipeline.applied || 0, color: "#3b82f6", bg: "#eff6ff" },
              { stage: "Screening", count: pipeline.screening || 0, color: "#8b5cf6", bg: "#f5f3ff" },
              { stage: "Interview", count: pipeline.interview || 0, color: "#f59e0b", bg: "#fffbeb" },
              { stage: "Selected", count: pipeline.selected || 0, color: "#10b981", bg: "#ecfdf5" },
              { stage: "Rejected", count: pipeline.rejected || 0, color: "#ef4444", bg: "#fef2f2" },
            ].map((item) => (
              <div
                key={item.stage}
                style={{
                  backgroundColor: item.bg,
                  borderRadius: "10px",
                  padding: "16px 14px",
                  border: `1px solid ${item.color}33`,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>
                  {item.stage}
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: item.color,
                    margin: "4px 0",
                  }}
                >
                  {item.count}
                </div>
                <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                  {pipeline.total > 0
                    ? `${Math.round((item.count / pipeline.total) * 100)}% of candidates`
                    : "0%"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Health Stats */}
      {stats?.systemHealth && (
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2 className="admin-card-title">System Health & Metrics</h2>
              <div className="admin-card-subtitle">
                Core infrastructure status monitored in real-time
              </div>
            </div>
            <span className="admin-badge badge-active">
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
              Operational
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "14px",
            }}
          >
            <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "12px", color: "#64748b" }}>Database Status</div>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "#10b981", marginTop: "4px" }}>
                ● {stats.systemHealth.databaseStatus || "Connected"}
              </div>
            </div>

            <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "12px", color: "#64748b" }}>Server Uptime</div>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginTop: "4px" }}>
                {stats.systemHealth.uptime || "Running"}
              </div>
            </div>

            <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "12px", color: "#64748b" }}>Memory RSS</div>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginTop: "4px" }}>
                {stats.systemHealth.memoryUsedMB ? `${stats.systemHealth.memoryUsedMB} MB` : "Normal"}
              </div>
            </div>

            <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "12px", color: "#64748b" }}>Total Headcount</div>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginTop: "4px" }}>
                {stats.totalHeadcount || 0} Employees/Interns
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity Section — Matching Screenshot */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">Recent activity</h2>
            <div className="admin-card-subtitle">
              Account and workspace updates · System audit activity
            </div>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={() => onSelectTab("audit")}
            style={{ color: "#2563eb", fontWeight: "600" }}
          >
            <span>View all</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {recentLogs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
            No recent audit activity recorded yet.
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Entity ID</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => (
                  <tr key={log._id}>
                    <td style={{ color: "#64748b", fontSize: "12.5px" }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: "600" }}>{log.userId?.name || "System"}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        {log.userId?.email || ""}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`admin-badge ${
                          log.action === "create"
                            ? "badge-success"
                            : log.action === "delete"
                            ? "badge-danger"
                            : "badge-blue"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: "500", textTransform: "capitalize" }}>
                        {log.module}
                      </span>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "11.5px", color: "#64748b" }}>
                      {log.entityId ? log.entityId.slice(-8) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
