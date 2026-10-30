import React, { useState, useEffect } from "react";
import {
  History,
  Download,
  Filter,
  Eye,
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";
import { fetchAuditLogs, fetchAuditLogById, downloadAuditLogsExport } from "../adminApi.js";
import Modal from "../components/Modal.jsx";

const MODULES = [
  { value: "users", label: "Users & Accounts (users)" },
  { value: "workflows", label: "Workflows (workflows)" },
  { value: "letter_templates", label: "Letter Templates (letter_templates)" },
  { value: "candidates", label: "Candidates (candidates)" },
  { value: "employees", label: "Employees (employees)" },
  { value: "offers", label: "Offers (offers)" },
  { value: "approvals", label: "Approvals (approvals)" },
  { value: "exits", label: "Exits (exits)" },
];

const ACTIONS = [
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "role_change", label: "Role Change" },
];

export default function AuditLogsView() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [alert, setAlert] = useState(null);

  // Filters
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Inspect Modal
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    loadLogs();
  }, [page, moduleFilter, actionFilter, startDate, endDate]);

  async function loadLogs() {
    setLoading(true);
    setAlert(null);
    try {
      const res = await fetchAuditLogs({
        module: moduleFilter,
        action: actionFilter,
        startDate,
        endDate,
        page,
        limit: 20,
      });
      setLogs(res.logs || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setAlert({ type: "error", message: err.message || "Failed to retrieve audit logs" });
    } finally {
      setLoading(false);
    }
  }

  async function openInspectModal(log) {
    try {
      const res = await fetchAuditLogById(log._id);
      setSelectedLog(res.log);
      setInspectModalOpen(true);
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    }
  }

  async function handleExport(format) {
    try {
      setExporting(true);
      await downloadAuditLogsExport(format, {
        module: moduleFilter,
        action: actionFilter,
        startDate,
        endDate,
      });
      setAlert({ type: "success", message: `Audit logs exported as ${format.toUpperCase()} successfully!` });
    } catch (err) {
      setAlert({ type: "error", message: "Export failed: " + err.message });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="admin-page-header">
        <div className="admin-breadcrumbs">
          <span>Workspace</span>
          <span>&gt;</span>
          <span style={{ color: "#0f172a", fontWeight: "600" }}>Audit Logs</span>
        </div>

        <div className="admin-header-title-row">
          <h1 className="admin-page-title">Immutable Audit Trail</h1>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              disabled={exporting}
              className="admin-btn admin-btn-secondary"
              onClick={() => handleExport("csv")}
            >
              <FileSpreadsheet size={15} />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              disabled={exporting}
              className="admin-btn admin-btn-secondary"
              onClick={() => handleExport("json")}
            >
              <Download size={15} />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        <p className="admin-page-subtitle">
          Append-only compliance log capturing all administrative mutations, user actions, and state transitions.
        </p>
      </div>

      {alert && (
        <div className={`admin-alert ${alert.type === "success" ? "admin-alert-success" : "admin-alert-error"}`}>
          {alert.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{alert.message}</span>
          <button
            type="button"
            onClick={() => setAlert(null)}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontWeight: "700" }}
          >
            ×
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="admin-card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Module Filter */}
          <div style={{ width: "200px" }}>
            <select
              className="admin-select"
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Modules</option>
              {MODULES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div style={{ width: "160px" }}>
            <select
              className="admin-select"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Actions</option>
              {ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Pickers */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12.5px", color: "#64748b" }}>From:</span>
            <input
              type="date"
              className="admin-input"
              style={{ width: "140px" }}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12.5px", color: "#64748b" }}>To:</span>
            <input
              type="date"
              className="admin-input"
              style={{ width: "140px" }}
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => {
              setModuleFilter("");
              setActionFilter("");
              setStartDate("");
              setEndDate("");
              setPage(1);
            }}
          >
            <RefreshCw size={13} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="admin-card" style={{ padding: 0 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: "700", fontSize: "15px" }}>
            Total Recorded Events: <span style={{ color: "#2563eb" }}>{total}</span>
          </div>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#64748b" }}>
              <Loader2 size={14} className="spin" />
              <span>Fetching audit logs...</span>
            </div>
          )}
        </div>

        <div className="admin-table-container" style={{ border: "none" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Module</th>
                <th>Entity ID</th>
                <th style={{ textAlign: "right" }}>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                    No audit records found matching current criteria.
                  </td>
                </tr>
              )}

              {logs.map((log) => (
                <tr key={log._id}>
                  <td style={{ fontSize: "12.5px", color: "#64748b", whiteSpace: "nowrap" }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ fontWeight: "600", fontSize: "13.5px" }}>
                      {log.userId?.name || "System Automated"}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#64748b" }}>
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
                          : log.action === "role_change"
                          ? "badge-warning"
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
                  <td style={{ fontFamily: "monospace", fontSize: "12px", color: "#475569" }}>
                    {log.entityId ? log.entityId : "—"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary admin-btn-sm"
                      onClick={() => openInspectModal(log)}
                      title="Inspect payload diff"
                    >
                      <Eye size={13} />
                      <span>Diff</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              padding: "14px 20px",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "13px",
            }}
          >
            <div style={{ color: "#64748b" }}>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* INSPECT LOG DETAILS MODAL */}
      <Modal
        isOpen={inspectModalOpen}
        onClose={() => setInspectModalOpen(false)}
        title="Audit Log Entry Details & Payload Diff"
        size="lg"
        footer={
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => setInspectModalOpen(false)}
          >
            Close
          </button>
        }
      >
        {selectedLog && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "10px",
                background: "#f8fafc",
                padding: "14px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "12.5px",
              }}
            >
              <div>
                <span style={{ color: "#64748b", display: "block" }}>Action</span>
                <strong style={{ textTransform: "capitalize" }}>{selectedLog.action}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block" }}>Module</span>
                <strong style={{ textTransform: "capitalize" }}>{selectedLog.module}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block" }}>Actor</span>
                <strong>{selectedLog.userId?.name || "System"}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block" }}>Timestamp</span>
                <span>{new Date(selectedLog.timestamp).toISOString()}</span>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block" }}>Entity ID</span>
                <span style={{ fontFamily: "monospace" }}>{selectedLog.entityId || "N/A"}</span>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block" }}>Log ID</span>
                <span style={{ fontFamily: "monospace" }}>{selectedLog._id}</span>
              </div>
            </div>

            {/* Old Value vs New Value Diff */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#dc2626", marginBottom: "6px" }}>
                  OLD VALUE (Prior to Mutation)
                </div>
                <pre
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "8px",
                    padding: "12px",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    maxHeight: "260px",
                    overflowY: "auto",
                    margin: 0,
                  }}
                >
                  {selectedLog.oldValue ? JSON.stringify(selectedLog.oldValue, null, 2) : "null (New entity created)"}
                </pre>
              </div>

              <div>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#059669", marginBottom: "6px" }}>
                  NEW VALUE (After Mutation)
                </div>
                <pre
                  style={{
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    borderRadius: "8px",
                    padding: "12px",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    maxHeight: "260px",
                    overflowY: "auto",
                    margin: 0,
                  }}
                >
                  {selectedLog.newValue ? JSON.stringify(selectedLog.newValue, null, 2) : "null (Entity deleted)"}
                </pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
