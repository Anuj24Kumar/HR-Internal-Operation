import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle, Eye, RefreshCw, ShieldAlert } from "lucide-react";
import { apiRequest } from "../../../api.js";
import { useAlert } from "../../../components/AlertProvider.jsx";
import { fetchPipeline, overrideApplicationStatus } from "../adminApi.js";
import { StatusBadge } from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";

const STATUSES = ["applied", "interview", "selected", "offer_sent", "offer_received", "accepted", "converted", "rejected"];
const label = (value) => String(value || "").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const formatDate = (value) => value ? new Date(value).toLocaleDateString() : "—";

export default function RecruitmentView({ initialStatus = "" }) {
  const alert = useAlert();
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [overrideTarget, setOverrideTarget] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [offers, setOffers] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchPipeline({ status, search, page, limit: 20 });
      setApplications(response.data?.applications || []);
      setTotal(response.data?.total || 0);
      setPages(response.data?.pages || 1);
    } catch (requestError) {
      setError(requestError.message || "Unable to load recruitment pipeline.");
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (initialStatus !== status) { setStatus(initialStatus); setPage(1); } }, [initialStatus]);
  useEffect(() => { loadOffers(); }, []);

  async function loadOffers() {
    try {
      const response = await apiRequest("/offers");
      setOffers(response.offers || response.data || []);
    } catch (requestError) {
      alert.toastError("Offers unavailable", requestError.message);
    }
  }

  async function expireOffer(offer) {
    const confirmed = await alert.confirm({
      title: "Expire this offer?",
      message: `Mark the offer for ${offer.candidateId?.name || "this candidate"} as expired?`,
      confirmText: "Expire offer",
    });
    if (!confirmed) return;
    try {
      await apiRequest(`/offers/${offer._id}/expire`, { method: "PATCH" });
      await loadOffers();
      alert.toastSuccess("Offer expired", "The offer status was updated.");
    } catch (requestError) {
      alert.toastError("Could not expire offer", requestError.message);
    }
  }

  function startOverride(application) {
    setOverrideTarget(application);
    setNewStatus(application.status);
    setReason("");
  }

  async function saveOverride(event) {
    event.preventDefault();
    if (!overrideTarget || reason.trim().length < 10) return;
    const confirmed = await alert.confirm({
      title: "Override application status?",
      message: `Change status from ${label(overrideTarget.status)} to ${label(newStatus)}? This will be audit-logged and the candidate and HR will be notified.`,
      confirmText: "Override status",
      type: "warning",
    });
    if (!confirmed) return;
    setSaving(true);
    try {
      await overrideApplicationStatus(overrideTarget._id, newStatus, reason.trim());
      setOverrideTarget(null);
      await load();
      alert.toastSuccess("Status updated", "The application status was overridden.");
    } catch (requestError) {
      alert.toastError("Override failed", requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Recruitment Pipeline</h1>
        <p className="admin-page-subtitle">Review applications, interviews, and offers across every workflow stage.</p>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {[["", "All"], ...STATUSES.map((value) => [value, label(value)])].map(([value, title]) => (
          <button key={value || "all"} type="button" className={`admin-btn admin-btn-sm ${status === value ? "admin-btn-primary" : "admin-btn-secondary"}`} onClick={() => { setStatus(value); setPage(1); }}>
            {title}
          </button>
        ))}
        <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={load} title="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="admin-card" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input className="admin-input" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search candidate, email, or position" style={{ flex: 1, minWidth: 240 }} />
        <button type="button" className="admin-btn admin-btn-secondary" onClick={loadOffers}>Refresh offers</button>
      </div>

      {error && <div className="admin-alert admin-alert-error"><AlertCircle size={16} />{error}</div>}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="admin-table-container"><table className="admin-table">
          <thead><tr><th>Candidate</th><th>Position</th><th>Job Type</th><th>Status</th><th>Applied</th><th>Interview</th><th>Offer</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={8}>Loading pipeline…</td></tr> : applications.map((application) => {
              const interview = application.currentInterviewId;
              const offer = application.currentOfferId;
              return <tr key={application._id}>
                <td>{application.candidateId?.name || application.candidateName}<small style={{ display: "block", color: "#64748b" }}>{application.candidateId?.email || application.email}</small></td>
                <td>{application.position}</td>
                <td>{label(application.jobType)}</td>
                <td><StatusBadge label={application.status} /></td>
                <td>{formatDate(application.createdAt)}</td>
                <td>{interview ? `${label(interview.status)}${interview.rating ? ` · ${interview.rating}/5` : ""}` : "—"}</td>
                <td>{offer ? `${label(offer.status)}${offer.salary != null ? ` · ${Number(offer.salary).toLocaleString()}` : ""}` : "—"}</td>
                <td><div style={{ display: "flex", gap: 6 }}>
                  <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setSelected(application)} title="View application details"><Eye size={14} /></button>
                  <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => startOverride(application)}><ShieldAlert size={14} /> Override</button>
                </div></td>
              </tr>;
            })}
            {!loading && applications.length === 0 && <tr><td colSpan={8}>No applications found.</td></tr>}
          </tbody>
        </table></div>
        <div className="admin-pagination">
          <span>{total} application{total === 1 ? "" : "s"}</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button type="button" disabled={page <= 1} className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setPage((value) => value - 1)}>Previous</button>
            <span>{page} / {pages}</span>
            <button type="button" disabled={page >= pages} className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setPage((value) => value + 1)}>Next</button>
          </div>
        </div>
      </div>

      {selected && <Modal isOpen onClose={() => setSelected(null)} title="Application Details">
        <div style={{ display: "grid", gap: 10 }}>
          <div><strong>{selected.candidateId?.name || selected.candidateName}</strong> · {selected.candidateId?.email || selected.email}</div>
          <div>{selected.position} · {label(selected.jobType)} · <StatusBadge label={selected.status} /></div>
          <h4>Interview</h4>
          {selected.currentInterviewId ? <pre>{JSON.stringify(selected.currentInterviewId, null, 2)}</pre> : <p>No current interview.</p>}
          <h4>Offer</h4>
          {selected.currentOfferId ? <pre>{JSON.stringify(selected.currentOfferId, null, 2)}</pre> : <p>No current offer.</p>}
          <h4>Timeline</h4>
          {(selected.timeline || []).map((item) => <div key={item.stage}>{label(item.stage)}: {item.completed ? formatDate(item.date) : "Pending"}</div>)}
        </div>
      </Modal>}

      {overrideTarget && <Modal isOpen onClose={() => setOverrideTarget(null)} title="Override Application Status">
        <form onSubmit={saveOverride}>
          <div className="admin-form-group"><label className="admin-form-label">Current status</label><input className="admin-input" value={label(overrideTarget.status)} readOnly /></div>
          <div className="admin-form-group"><label className="admin-form-label">New status</label>
            <select className="admin-select" value={newStatus} onChange={(event) => setNewStatus(event.target.value)}>
              {STATUSES.map((value) => <option key={value} value={value}>{label(value)}</option>)}
            </select>
          </div>
          <div className="admin-form-group"><label className="admin-form-label">Reason (at least 10 characters)</label><textarea className="admin-input" rows={4} minLength={10} required value={reason} onChange={(event) => setReason(event.target.value)} /></div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setOverrideTarget(null)}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={saving || reason.trim().length < 10}>{saving ? "Saving…" : "Confirm override"}</button>
          </div>
        </form>
      </Modal>}

      {offers.length > 0 && <section className="admin-card">
        <h2 className="admin-card-title">Offers</h2>
        {offers.map((offer) => <div key={offer._id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
          <span>{offer.candidateId?.name || offer.candidateName || "Candidate"} · {offer.designation} · <StatusBadge label={offer.status} /></span>
          {["draft", "sent", "offer_received"].includes(offer.status) && <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => expireOffer(offer)}>Expire offer</button>}
        </div>)}
      </section>}
    </div>
  );
}
