import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  UserCheck,
  UserX,
  Briefcase,
  Mail,
  Phone,
} from "lucide-react";

const apiBase = import.meta.env.VITE_API_URL || "/api/v1";

function getToken() {
  return localStorage.getItem("hr-auth-token") || "";
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const res = await fetch(`${apiBase}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok || data.success === false) throw new Error(data.message || "Request failed");
  return data;
}

function StatusBadge({ status }) {
  const map = {
    active: { bg: "#dcfce7", color: "#16a34a", label: "Active" },
    inactive: { bg: "#fee2e2", color: "#b91c1c", label: "Inactive" },
    terminated: { bg: "#f1f5f9", color: "#64748b", label: "Terminated" },
    on_leave: { bg: "#fef3c7", color: "#b45309", label: "On Leave" },
  };
  const s = map[status] || { bg: "#f1f5f9", color: "#64748b", label: status || "—" };
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: "2px 10px",
        borderRadius: "999px",
        fontSize: "11.5px",
        fontWeight: "600",
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

function EmployeeDetailModal({ emp, onClose }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div
        className="admin-modal"
        style={{ width: "580px", maxHeight: "82vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <h3 className="admin-modal-title">Employee Profile</h3>
          <button className="admin-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="admin-modal-body">
          {/* Avatar row */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
            <div
              style={{
                width: "52px", height: "52px", borderRadius: "50%",
                background: "#2563eb", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px", fontWeight: "700", flexShrink: 0,
              }}
            >
              {(emp.name || emp.fullName || "E").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
                {emp.name || emp.fullName || "—"}
              </div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>{emp.designation || emp.position || emp.jobTitle || "—"}</div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <StatusBadge status={emp.status || emp.employmentStatus} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            {[
              ["Employee ID", emp.employeeId || emp.empId],
              ["Email", emp.email],
              ["Phone", emp.phone || emp.mobile],
              ["Department", emp.department],
              ["Designation", emp.designation || emp.position],
              ["Manager", emp.reportingManager || (typeof emp.manager === "object" ? emp.manager?.name : emp.manager)],
              ["Joining Date", emp.dateOfJoining || emp.joiningDate ? new Date(emp.dateOfJoining || emp.joiningDate).toLocaleDateString() : null],
              ["Employment Type", emp.employmentType],
              ["Location", emp.location || emp.workLocation],
              ["Status", <StatusBadge key="s" status={emp.status || emp.employmentStatus} />],
            ].map(([label, val]) =>
              val ? (
                <div key={label}>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
                  <div style={{ fontSize: "13.5px", fontWeight: "600", color: "#1e293b" }}>{val}</div>
                </div>
              ) : null
            )}
          </div>

          {emp.skills?.length > 0 && (
            <div style={{ marginTop: "14px" }}>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Skills</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {emp.skills.map((sk) => (
                  <span key={sk} style={{ background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" }}>{sk}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="admin-modal-footer">
          <button className="admin-btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function EmployeesView() {
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const limit = 15;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      if (deptFilter) q.set("department", deptFilter);
      if (statusFilter) q.set("status", statusFilter);
      q.set("page", page);
      q.set("limit", limit);
      const data = await apiFetch(`/employees?${q.toString()}`);
      setEmployees(data.employees || data.data || []);
      setTotal(data.total || data.pagination?.total || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, deptFilter, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);

  // Collect unique departments from loaded employees for filter dropdown
  const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Employees</h1>
          <p className="admin-page-subtitle">View all employees across the organisation</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div
            style={{
              background: "#dbeafe", color: "#1d4ed8",
              padding: "6px 14px", borderRadius: "999px",
              fontSize: "12.5px", fontWeight: "600",
            }}
          >
            {total} Employee{total !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search
            size={15}
            style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
          />
          <input
            className="admin-input"
            placeholder="Search name, email, ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: "32px", width: "100%" }}
          />
        </div>
        {departments.length > 0 && (
          <select
            className="admin-input"
            style={{ width: "170px" }}
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        )}
        <select
          className="admin-input"
          style={{ width: "150px" }}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="terminated">Terminated</option>
          <option value="on_leave">On Leave</option>
        </select>
        <button className="admin-btn-secondary" onClick={load} title="Refresh">
          <RefreshCw size={15} />
        </button>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error" style={{ marginBottom: "12px" }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Email</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                    Loading employees…
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <Briefcase size={32} style={{ opacity: 0.3 }} />
                      <span>No employees found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "30px", height: "30px", borderRadius: "50%",
                            background: "#2563eb", color: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "11px", fontWeight: "700", flexShrink: 0,
                          }}
                        >
                          {(emp.name || emp.fullName || "E").slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: "600", fontSize: "13.5px" }}>
                          {emp.name || emp.fullName || "—"}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "12px", color: "#475569" }}>
                      {emp.employeeId || emp.empId || "—"}
                    </td>
                    <td>{emp.department || "—"}</td>
                    <td style={{ color: "#475569" }}>{emp.designation || emp.position || "—"}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#64748b", fontSize: "12.5px" }}>
                        <Mail size={12} />
                        {emp.email || "—"}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={emp.status || emp.employmentStatus} />
                    </td>
                    <td style={{ color: "#64748b", fontSize: "12.5px" }}>
                      {emp.dateOfJoining || emp.joiningDate
                        ? new Date(emp.dateOfJoining || emp.joiningDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      <button
                        className="admin-btn-icon"
                        title="View details"
                        onClick={() => setSelected(emp)}
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="admin-pagination" style={{ borderTop: "1px solid #f1f5f9", padding: "12px 20px" }}>
            <span style={{ fontSize: "13px", color: "#64748b" }}>
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </span>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <button
                className="admin-btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={15} />
              </button>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="admin-btn-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && <EmployeeDetailModal emp={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
