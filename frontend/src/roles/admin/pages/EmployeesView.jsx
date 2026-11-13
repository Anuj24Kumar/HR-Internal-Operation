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
import { useAlert } from "../../../components/AlertProvider.jsx";

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
          {emp.documents && (
            <div style={{ marginTop: 16 }}>
              <strong>Documents ({emp.documents.length})</strong>
              {emp.documents.map((document) => <div key={document._id} style={{ fontSize: 13, padding: "5px 0" }}>{document.name || document.title || document.fileName || "Document"}</div>)}
            </div>
          )}
          {emp.letters && (
            <div style={{ marginTop: 12 }}>
              <strong>Letters ({emp.letters.length})</strong>
              {emp.letters.map((letter) => <div key={letter._id} style={{ fontSize: 13, padding: "5px 0" }}>{letter.title || letter.type || "Letter"} · {letter.status || "available"}</div>)}
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
  const alertApi = useAlert();
  const [activeTab, setActiveTab] = useState("intern");
  const [employees, setEmployees] = useState([]);
  const [acceptedOffers, setAcceptedOffers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [convertingOffer, setConvertingOffer] = useState(null);
  const [conversion, setConversion] = useState({ targetRole: "employee", designation: "", department: "", salary: "", domain: "", track: "", stipend: "" });
  const limit = 15;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      if (search && activeTab !== "accepted") q.set("search", search);
      if (deptFilter) q.set("department", deptFilter);
      if (statusFilter) q.set("status", statusFilter);
      if (activeTab !== "accepted") q.set("role", activeTab);
      q.set("page", page);
      q.set("limit", limit);
      if (activeTab === "accepted") {
        const data = await apiFetch("/employees/accepted-offers");
        const offers = data.data || [];
        const filtered = search ? offers.filter((offer) => `${offer.candidateId?.name || ""} ${offer.candidateId?.email || ""} ${offer.designation || ""}`.toLowerCase().includes(search.toLowerCase())) : offers;
        setAcceptedOffers(filtered);
        setEmployees([]);
        setTotal(filtered.length);
      } else {
        const data = await apiFetch(`/employees?${q.toString()}`);
        setEmployees(data.users || data.data || []);
        setTotal(data.total || data.pagination?.total || 0);
        setAcceptedOffers([]);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, deptFilter, statusFilter, page, activeTab]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);

  // Collect unique departments from loaded employees for filter dropdown
  const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))];

  async function showDetails(employee) {
    try {
      const response = await apiFetch(`/employees/${employee._id}`);
      setSelected({ ...response.data.user, documents: response.data.documents || [], letters: response.data.letters || [] });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function convertAcceptedOffer(event) {
    event.preventDefault();
    if (!convertingOffer) return;
    const confirmed = await alertApi.confirm({
      title: "Convert accepted offer?",
      message: `Convert ${convertingOffer.candidateId?.name || "this candidate"} to ${conversion.targetRole}?`,
      confirmText: "Convert",
    });
    if (!confirmed) return;
    try {
      await apiFetch("/employees/convert", {
        method: "POST",
        body: JSON.stringify({
          offerId: convertingOffer._id,
          ...conversion,
          salary: conversion.salary ? Number(conversion.salary) : undefined,
          stipend: conversion.stipend ? Number(conversion.stipend) : undefined,
        }),
      });
      setConvertingOffer(null);
      alertApi.toastSuccess("Candidate converted", "The accepted offer was converted successfully.");
      load();
    } catch (requestError) {
      alertApi.toastError("Conversion failed", requestError.message);
    }
  }

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

      <div role="tablist" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["intern", "Interns"], ["employee", "Employees"], ["accepted", "Accepted Offers"]].map(([value, title]) => (
          <button key={value} type="button" role="tab" aria-selected={activeTab === value} className={`admin-btn ${activeTab === value ? "admin-btn-primary" : "admin-btn-secondary"}`} onClick={() => { setActiveTab(value); setPage(1); }}>
            {title}
          </button>
        ))}
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
        {activeTab !== "accepted" && departments.length > 0 && (
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
        {activeTab !== "accepted" && <select
          className="admin-input"
          style={{ width: "150px" }}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
          <option value="notice">Notice</option>
          <option value="exited">Exited</option>
          <option value="completed">Completed</option>
          <option value="terminated">Terminated</option>
        </select>}
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
                {activeTab === "accepted" ? <><th>Candidate</th><th>Position</th><th>Salary</th><th>Accepted</th><th>Action</th></> : <><th>Name</th><th>Employee ID</th><th>Department</th><th>Designation</th><th>Email</th><th>Status</th><th>Joined</th><th>Actions</th></>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                    Loading employees…
                  </td>
                </tr>
              ) : activeTab === "accepted" ? acceptedOffers.length ? acceptedOffers.map((offer) => (
                <tr key={offer._id}>
                  <td>{offer.candidateId?.name}<small style={{ display: "block", color: "#64748b" }}>{offer.candidateId?.email}</small></td>
                  <td>{offer.designation || offer.applicationId?.position || "—"}</td>
                  <td>{offer.salary != null ? Number(offer.salary).toLocaleString() : "—"}</td>
                  <td>{offer.acceptedAt ? new Date(offer.acceptedAt).toLocaleDateString() : "—"}</td>
                  <td><button type="button" className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => { setConvertingOffer(offer); setConversion((current) => ({ ...current, designation: offer.designation || offer.applicationId?.position || "" })); }}>Convert</button></td>
                </tr>
              )) : <tr><td colSpan={5} style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>No accepted offers are awaiting conversion.</td></tr> : employees.length === 0 ? (
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
                        onClick={() => showDetails(emp)}
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
      {convertingOffer && (
        <div className="admin-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setConvertingOffer(null)}>
          <form className="admin-modal" onSubmit={convertAcceptedOffer}>
            <div className="admin-modal-header"><h3 className="admin-modal-title">Convert Accepted Offer</h3><button type="button" className="admin-modal-close" onClick={() => setConvertingOffer(null)}>×</button></div>
            <div className="admin-modal-body">
              <label className="admin-form-label">Target role</label><select className="admin-select" value={conversion.targetRole} onChange={(e) => setConversion({ ...conversion, targetRole: e.target.value })}><option value="employee">Employee</option><option value="intern">Intern</option></select>
              <label className="admin-form-label">Designation</label><input className="admin-input" required value={conversion.designation} onChange={(e) => setConversion({ ...conversion, designation: e.target.value })} />
              <label className="admin-form-label">Department</label><input className="admin-input" value={conversion.department} onChange={(e) => setConversion({ ...conversion, department: e.target.value })} />
              {conversion.targetRole === "employee" ? <><label className="admin-form-label">Salary</label><input className="admin-input" type="number" min="0" value={conversion.salary} onChange={(e) => setConversion({ ...conversion, salary: e.target.value })} /></> : <><label className="admin-form-label">Domain</label><input className="admin-input" value={conversion.domain} onChange={(e) => setConversion({ ...conversion, domain: e.target.value })} /><label className="admin-form-label">Track</label><input className="admin-input" value={conversion.track} onChange={(e) => setConversion({ ...conversion, track: e.target.value })} /><label className="admin-form-label">Stipend</label><input className="admin-input" type="number" min="0" value={conversion.stipend} onChange={(e) => setConversion({ ...conversion, stipend: e.target.value })} /></>}
            </div>
            <div className="admin-modal-footer"><button type="button" className="admin-btn-secondary" onClick={() => setConvertingOffer(null)}>Cancel</button><button type="submit" className="admin-btn-primary">Convert</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
