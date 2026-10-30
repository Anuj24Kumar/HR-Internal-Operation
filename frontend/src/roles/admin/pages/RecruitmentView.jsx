import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Briefcase,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Trash2,
  Timer,
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

// ──────────────────────────────────────────────
// STATUS BADGE
// ──────────────────────────────────────────────
const STATUS_COLORS = {
  applied: { bg: "#dbeafe", color: "#1d4ed8", label: "Applied" },
  screening: { bg: "#fef3c7", color: "#b45309", label: "Screening" },
  interview: { bg: "#ede9fe", color: "#7c3aed", label: "Interview" },
  offer: { bg: "#d1fae5", color: "#065f46", label: "Offer" },
  hired: { bg: "#dcfce7", color: "#16a34a", label: "Hired" },
  rejected: { bg: "#fee2e2", color: "#b91c1c", label: "Rejected" },
  archived: { bg: "#f1f5f9", color: "#64748b", label: "Archived" },
  draft: { bg: "#f1f5f9", color: "#475569", label: "Draft" },
  pending_approval: { bg: "#fef3c7", color: "#b45309", label: "Pending Approval" },
  approved: { bg: "#d1fae5", color: "#065f46", label: "Approved" },
  sent: { bg: "#dbeafe", color: "#1d4ed8", label: "Sent" },
  accepted: { bg: "#dcfce7", color: "#16a34a", label: "Accepted" },
  declined: { bg: "#fee2e2", color: "#b91c1c", label: "Declined" },
  expired: { bg: "#f1f5f9", color: "#64748b", label: "Expired" },
  revoked: { bg: "#fce7f3", color: "#9d174d", label: "Revoked" },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: "#f1f5f9", color: "#64748b", label: status };
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

// ──────────────────────────────────────────────
// CANDIDATES SUB-VIEW
// ──────────────────────────────────────────────
function CandidatesTab() {
  const [candidates, setCandidates] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
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
      if (statusFilter) q.set("status", statusFilter);
      q.set("page", page);
      q.set("limit", limit);
      const data = await apiFetch(`/candidates?${q.toString()}`);
      setCandidates(data.candidates || data.data || []);
      setTotal(data.total || data.pagination?.total || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search
            size={15}
            style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
          />
          <input
            className="admin-input"
            placeholder="Search by name, position..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: "32px", width: "100%" }}
          />
        </div>
        <select
          className="admin-input"
          style={{ width: "160px" }}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="applied">Applied</option>
          <option value="screening">Screening</option>
          <option value="interview">Interview</option>
          <option value="offer">Offer</option>
          <option value="hired">Hired</option>
          <option value="rejected">Rejected</option>
          <option value="archived">Archived</option>
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

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Position Applied</th>
              <th>Email</th>
              <th>Status</th>
              <th>Applied On</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>
                  Loading candidates…
                </td>
              </tr>
            ) : candidates.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>
                  No candidates found
                </td>
              </tr>
            ) : (
              candidates.map((c) => (
                <tr key={c._id}>
                  <td style={{ fontWeight: "600" }}>{c.name || c.fullName || "—"}</td>
                  <td>{c.positionApplied || c.position || "—"}</td>
                  <td style={{ color: "#64748b" }}>{c.email || "—"}</td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td style={{ color: "#64748b", fontSize: "12.5px" }}>
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    <button
                      className="admin-btn-icon"
                      title="View details"
                      onClick={() => setSelected(c)}
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
        <div className="admin-pagination">
          <span style={{ fontSize: "13px", color: "#64748b" }}>
            {total} candidate{total !== 1 ? "s" : ""}
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
              {page} / {totalPages}
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

      {/* Detail Modal */}
      {selected && (
        <CandidateDetailModal candidate={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function CandidateDetailModal({ candidate: c, onClose }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div
        className="admin-modal"
        style={{ width: "560px", maxHeight: "80vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <h3 className="admin-modal-title">Candidate Details</h3>
          <button className="admin-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="admin-modal-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            {[
              ["Name", c.name || c.fullName],
              ["Email", c.email],
              ["Phone", c.phone],
              ["Position", c.positionApplied || c.position],
              ["Status", <StatusBadge key="s" status={c.status} />],
              ["Experience", c.experience ? `${c.experience} yrs` : null],
              ["Applied", c.createdAt ? new Date(c.createdAt).toLocaleString() : null],
              ["Updated", c.updatedAt ? new Date(c.updatedAt).toLocaleString() : null],
            ].map(([label, val]) =>
              val ? (
                <div key={label}>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
                  <div style={{ fontSize: "13.5px", fontWeight: "600", color: "#1e293b" }}>{val}</div>
                </div>
              ) : null
            )}
          </div>
          {c.skills?.length > 0 && (
            <div style={{ marginTop: "14px" }}>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Skills</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {c.skills.map((sk) => (
                  <span key={sk} style={{ background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" }}>{sk}</span>
                ))}
              </div>
            </div>
          )}
          {c.notes && (
            <div style={{ marginTop: "14px" }}>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Notes</div>
              <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.5", margin: 0 }}>{c.notes}</p>
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

// ──────────────────────────────────────────────
// OFFERS SUB-VIEW
// ──────────────────────────────────────────────
function OffersTab() {
  const [offers, setOffers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionNote, setActionNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/offers");
      setOffers(data.offers || data.data || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleApproval(offerId, decision) {
    setActionLoading(offerId + decision);
    try {
      await apiFetch(`/offers/${offerId}/approval`, {
        method: "PATCH",
        body: JSON.stringify({ decision, notes: actionNote || undefined }),
      });
      await load();
      setSelected(null);
      setActionNote("");
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleExpire(offerId) {
    if (!window.confirm("Mark this offer as expired?")) return;
    setActionLoading(offerId + "expire");
    try {
      await apiFetch(`/offers/${offerId}/expire`, { method: "PATCH" });
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <span style={{ fontSize: "13px", color: "#64748b" }}>{total} offer{total !== 1 ? "s" : ""} total</span>
        <button className="admin-btn-secondary" onClick={load} title="Refresh">
          <RefreshCw size={15} />
        </button>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error" style={{ marginBottom: "12px" }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Position</th>
              <th>Salary</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>Loading offers…</td>
              </tr>
            ) : offers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>No offers found</td>
              </tr>
            ) : (
              offers.map((o) => (
                <tr key={o._id}>
                  <td style={{ fontWeight: "600" }}>{o.candidateName || o.candidate?.name || "—"}</td>
                  <td>{o.position || o.jobTitle || "—"}</td>
                  <td style={{ color: "#16a34a", fontWeight: "600" }}>
                    {o.salary ? `₹${Number(o.salary).toLocaleString()}` : o.ctc ? `₹${Number(o.ctc).toLocaleString()}` : "—"}
                  </td>
                  <td><StatusBadge status={o.status} /></td>
                  <td style={{ color: "#64748b", fontSize: "12.5px" }}>
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button className="admin-btn-icon" title="View" onClick={() => setSelected(o)}>
                        <Eye size={15} />
                      </button>
                      {o.status === "pending_approval" && (
                        <>
                          <button
                            className="admin-btn-icon"
                            title="Approve"
                            style={{ color: "#16a34a" }}
                            disabled={!!actionLoading}
                            onClick={() => handleApproval(o._id, "approved")}
                          >
                            <CheckCircle size={15} />
                          </button>
                          <button
                            className="admin-btn-icon"
                            title="Reject"
                            style={{ color: "#b91c1c" }}
                            disabled={!!actionLoading}
                            onClick={() => handleApproval(o._id, "rejected")}
                          >
                            <XCircle size={15} />
                          </button>
                        </>
                      )}
                      {["sent", "approved"].includes(o.status) && (
                        <button
                          className="admin-btn-icon"
                          title="Mark Expired"
                          style={{ color: "#b45309" }}
                          disabled={!!actionLoading}
                          onClick={() => handleExpire(o._id)}
                        >
                          <Timer size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Offer Detail Modal */}
      {selected && (
        <OfferDetailModal
          offer={selected}
          onClose={() => { setSelected(null); setActionNote(""); }}
          onApprove={(note) => { setActionNote(note); handleApproval(selected._id, "approved"); }}
          onReject={(note) => { setActionNote(note); handleApproval(selected._id, "rejected"); }}
          actionLoading={!!actionLoading}
        />
      )}
    </div>
  );
}

function OfferDetailModal({ offer: o, onClose, onApprove, onReject, actionLoading }) {
  const [note, setNote] = useState("");

  useEffect(() => {
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div
        className="admin-modal"
        style={{ width: "560px", maxHeight: "82vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <h3 className="admin-modal-title">Offer Details</h3>
          <button className="admin-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="admin-modal-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            {[
              ["Candidate", o.candidateName || o.candidate?.name],
              ["Position", o.position || o.jobTitle],
              ["Status", <StatusBadge key="s" status={o.status} />],
              ["Salary / CTC", o.salary ? `₹${Number(o.salary).toLocaleString()}` : o.ctc ? `₹${Number(o.ctc).toLocaleString()}` : null],
              ["Joining Date", o.joiningDate ? new Date(o.joiningDate).toLocaleDateString() : null],
              ["Expiry Date", o.expiryDate ? new Date(o.expiryDate).toLocaleDateString() : null],
              ["Created", o.createdAt ? new Date(o.createdAt).toLocaleString() : null],
              ["Updated", o.updatedAt ? new Date(o.updatedAt).toLocaleString() : null],
            ].map(([label, val]) =>
              val ? (
                <div key={label}>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
                  <div style={{ fontSize: "13.5px", fontWeight: "600", color: "#1e293b" }}>{val}</div>
                </div>
              ) : null
            )}
          </div>

          {/* Approve/Reject for pending_approval */}
          {o.status === "pending_approval" && (
            <div style={{ marginTop: "20px", padding: "16px", background: "#fef9ec", border: "1px solid #fcd34d", borderRadius: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <Clock size={15} style={{ color: "#b45309" }} />
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#b45309" }}>Awaiting Approval</span>
              </div>
              <textarea
                className="admin-input"
                placeholder="Optional: add approval note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                style={{ width: "100%", resize: "vertical", marginBottom: "10px" }}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="admin-btn-primary"
                  style={{ background: "#16a34a", flex: 1 }}
                  disabled={actionLoading}
                  onClick={() => onApprove(note)}
                >
                  <CheckCircle size={14} /> Approve
                </button>
                <button
                  className="admin-btn-primary"
                  style={{ background: "#b91c1c", flex: 1 }}
                  disabled={actionLoading}
                  onClick={() => onReject(note)}
                >
                  <XCircle size={14} /> Reject
                </button>
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

// ──────────────────────────────────────────────
// MAIN RECRUITMENT VIEW
// ──────────────────────────────────────────────
export default function RecruitmentView() {
  const [subTab, setSubTab] = useState("candidates");

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Recruitment</h1>
          <p className="admin-page-subtitle">View candidates and manage offer approvals</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", borderBottom: "1px solid #e2e8f0" }}>
        {[
          { id: "candidates", label: "Candidates", icon: Users },
          { id: "offers", label: "Offers", icon: Briefcase },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "10px 18px",
              background: "none",
              border: "none",
              borderBottom: subTab === id ? "2px solid #2563eb" : "2px solid transparent",
              color: subTab === id ? "#2563eb" : "#64748b",
              fontWeight: subTab === id ? "600" : "400",
              fontSize: "13.5px",
              cursor: "pointer",
              marginBottom: "-1px",
              transition: "all 0.15s",
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <div className="admin-card" style={{ padding: "20px" }}>
        {subTab === "candidates" && <CandidatesTab />}
        {subTab === "offers" && <OffersTab />}
      </div>
    </div>
  );
}
