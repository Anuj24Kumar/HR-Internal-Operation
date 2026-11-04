import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  CalendarPlus,
  Eye,
  Trash2,
  Send,
  Clock,
} from "lucide-react";
import { apiRequest } from "../api.js";
import DataTable from "../components/DataTable.jsx";
import CandidateDetailsModal from "../components/CandidateDetailsModal.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { useAlert } from "../components/AlertProvider.jsx";

const APPLICATION_STATUSES = [
  "applied",
  "interview",
  "selected",
  "offer_sent",
  "offer_received",
  "accepted",
  "converted",
  "rejected",
];

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function StatusBadge({ status }) {
  const styles = {
    applied: "bg-blue-50 text-blue-700 ring-blue-600/20",
    screening: "bg-amber-50 text-amber-700 ring-amber-600/20",
    interview: "bg-violet-50 text-violet-700 ring-violet-600/20",
    selected: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    offer: "bg-teal-50 text-teal-700 ring-teal-600/20",
    rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
  };

  const normalized = String(status || "applied").toLowerCase();

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${
        styles[normalized] || "bg-slate-100 text-slate-700 ring-slate-500/20"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {normalized}
    </span>
  );
}

export default function Candidates() {
  const navigate = useNavigate();
  const alert = useAlert();
  const [candidates, setCandidates] = useState([]);
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Details Modal
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [interviewCandidate, setInterviewCandidate] = useState(null);
  const [interviewMode, setInterviewMode] = useState("view");
  const [interviewers, setInterviewers] = useState([]);
  const [loadingInterviewers, setLoadingInterviewers] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    roundName: "",
    interviewType: "technical",
    interviewerId: "",
    scheduledAt: "",
    meetingLink: "",
  });

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    type: "danger",
    loading: false,
    action: null,
  });

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams({
        page: "1",
        limit: "100",
      });

      if (jobTypeFilter && jobTypeFilter !== "all") query.set("jobType", jobTypeFilter);
      if (statusFilter && statusFilter !== "all") query.set("status", statusFilter);
      if (search.trim()) query.set("search", search.trim());

      const result = await apiRequest(`/candidates?${query.toString()}`);
      const candidatesOnly = (Array.isArray(result.data) ? result.data : []).filter(
        (c) => String(c.role || "").trim().toLowerCase() === "candidate"
      );
      setCandidates(candidatesOnly);
    } catch (err) {
      setError(err.message || "Unable to load candidates.");
    } finally {
      setLoading(false);
    }
  }, [jobTypeFilter, statusFilter, search]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const filteredCandidates = useMemo(() => {
    const candidateList = candidates.filter(
      (c) => String(c.role || "").trim().toLowerCase() === "candidate"
    );
    return candidateList;
  }, [candidates]);

  function assignInterview(candidate) {
    const query = new URLSearchParams({ candidateId: candidate._id });
    navigate(`/hr/interviews?${query.toString()}`);
  }

  function generateOffer(candidate) {
    const query = new URLSearchParams({
      candidateId: candidate._id,
      candidateName: candidate.name || "",
      position: candidate.position || "",
    });
    navigate(`/hr/offers?${query.toString()}`);
  }

  function promptDeleteCandidate(candidate) {
    setConfirmModal({
      isOpen: true,
      title: "Delete Candidate Record",
      message: `Are you sure you want to permanently delete candidate record for "${candidate.name}" (${candidate.email})? This action cannot be undone.`,
      confirmText: "Delete Candidate",
      type: "danger",
      loading: false,
      action: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, loading: true }));
          await apiRequest(`/candidates/${candidate._id}`, { method: "DELETE" });
          setNotice(`Candidate "${candidate.name}" deleted successfully.`);
          setConfirmModal({ isOpen: false });
          await loadCandidates();
        } catch (err) {
          setError(err.message || "Failed to delete candidate.");
          setConfirmModal({ isOpen: false });
        }
      },
    });
  }

  async function openCandidateDetails(candidate) {
    try {
      const result = await apiRequest(`/candidates/${candidate._id}`);
      setSelectedCandidate(result.data || candidate);
    } catch (err) {
      setError(err.message || "Unable to load candidate details.");
    }
  }

  async function openAssignInterview(candidate) {
    setError("");
    setNotice("");
    setInterviewCandidate(candidate);
    setInterviewMode("assign");
    setInterviewForm((current) => ({ ...current, roundName: "Technical Round 1" }));
    setLoadingInterviewers(true);
    try {
      const result = await apiRequest("/interviews/interviewers");
      const list = Array.isArray(result.data) ? result.data : [];
      setInterviewers(list);
      setInterviewForm((current) => ({
        ...current,
        interviewerId: current.interviewerId || list[0]?._id || "",
      }));
    } catch (err) {
      setError(err.message || "Unable to load interviewers.");
      setInterviewCandidate(null);
    } finally {
      setLoadingInterviewers(false);
    }
  }

  async function submitInterviewAssignment(event) {
    event.preventDefault();
    if (!interviewCandidate) return;
    setAssigning(true);
    setError("");
    try {
      await apiRequest(`/interviews/candidates/${interviewCandidate._id}/interviews`, {
        method: "POST",
        body: JSON.stringify({
          ...interviewForm,
          scheduledAt: new Date(interviewForm.scheduledAt).toISOString(),
        }),
      });
      alert.toastSuccess("Interview assigned", `Interview assigned to ${interviewCandidate.name}.`);
      setInterviewCandidate(null);
      await loadCandidates();
    } catch (err) {
      setError(err.message || "Unable to assign interviewer.");
    } finally {
      setAssigning(false);
    }
  }

  function openOffer(candidate) {
    navigate(`/hr/offers?candidateId=${encodeURIComponent(candidate._id)}`);
  }

  const columns = useMemo(
    () => [
      {
        key: "candidate",
        label: "Candidate",
        render: (candidate) => (
          <div className="flex min-w-48 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-50 font-semibold text-blue-700">
              {String(candidate.name || "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => openCandidateDetails(candidate)}
                className="font-semibold text-slate-800 hover:text-blue-600 hover:underline text-left truncate block max-w-[180px]"
              >
                {candidate.name || "—"}
              </button>
              <p className="mt-0.5 text-xs text-slate-500 truncate max-w-[180px]">
                {candidate.email || "—"}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "position",
        label: "Position",
        render: (candidate) => candidate.position || "—",
      },
      {
        key: "jobType",
        label: "Job Type",
        render: (candidate) => candidate.jobType === "internship" ? "Internship" : "Full-time",
      },
      {
        key: "status",
        label: "Stage Status",
        render: (candidate) => <StatusBadge status={candidate.status} />,
      },
      {
        key: "appliedDate",
        label: "Applied Date",
        render: (candidate) => (
          <span className="text-xs text-slate-600 whitespace-nowrap">
            {formatDate(candidate.appliedAt || candidate.appliedDate || candidate.createdAt)}
          </span>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        render: (candidate) => {
          const status = String(candidate.status || "").toLowerCase();

          return (
            <div className="flex items-center gap-2 min-w-44" onClick={(event) => event.stopPropagation()}>
              {status === "applied" && (
                <button
                  type="button"
                  onClick={() => openAssignInterview(candidate)}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
                  title="Assign Interview"
                >
                  <CalendarPlus size={14} />
                  Assign Interview
                </button>
              )}

              {status === "interview" && (
                <button
                  type="button"
                  onClick={() => {
                    setInterviewCandidate(candidate);
                    setInterviewMode("view");
                  }}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-violet-50 text-violet-700 border border-violet-200 px-2.5 py-1.5 text-xs font-semibold hover:bg-violet-100 transition"
                  title="View Scheduled Interview"
                >
                  <Clock size={14} />
                  Scheduled
                </button>
              )}

              {status === "selected" && (
                <button
                  type="button"
                  onClick={() => openOffer(candidate)}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
                  title="Generate Offer Letter"
                >
                  <Send size={14} />
                  Generate Offer
                </button>
              )}

              {["offer_sent", "offer_received"].includes(status) && (
                <button type="button" onClick={() => openOffer(candidate)} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg">
                  <Eye size={13} /> View Offer
                </button>
              )}
              {status === "accepted" && (
                <button type="button" onClick={() => navigate("/hr/employees?tab=accepted")} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  Convert
                </button>
              )}
              {status === "converted" && (
                <button type="button" onClick={() => navigate(`/hr/employees?userId=${encodeURIComponent(candidate._id)}`)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                  View Profile
                </button>
              )}

              <button
                type="button"
                onClick={() => openCandidateDetails(candidate)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                title="View Full Candidate Details & Evaluations"
              >
                <Eye size={16} />
              </button>

              <button
                type="button"
                onClick={() => promptDeleteCandidate(candidate)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                title="Delete Candidate"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        },
      },
    ],
    [navigate]
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            HR Workspace
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Candidates & Applications
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage candidates through the 4-stage pipeline: Applied, Interview, Selected, Offer.
          </p>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss notice">
            <X size={17} />
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="Dismiss error">
            <X size={17} />
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3">
          <Search size={17} className="shrink-0 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by candidate name, email, position, ID..."
            className="w-full min-w-0 border-0 bg-transparent py-3 text-sm outline-none"
          />
        </label>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
          aria-label="Filter candidates by pipeline status"
        >
          <option value="all">All Stages</option>
          {APPLICATION_STATUSES.map((status) => (
            <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
          ))}
        </select>

        {/* Job Type Dropdown */}
        <select
          value={jobTypeFilter}
          onChange={(event) => setJobTypeFilter(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
          aria-label="Filter candidates by job type"
        >
          <option value="all">All Tracks (Full-Time & Internships)</option>
          <option value="full_time">Full-time Job Only</option>
          <option value="internship">Internship Only</option>
        </select>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={filteredCandidates}
        onRowClick={openCandidateDetails}
        loading={loading}
        emptyMessage={
          search
            ? "No candidates match your search filter."
            : "No candidates found for the selected stage and job type."
        }
        getRowKey={(candidate) => candidate._id}
      />

      {/* Details & Evaluations Modal */}
      {selectedCandidate && (
        <CandidateDetailsModal
          isOpen={Boolean(selectedCandidate)}
          onClose={() => setSelectedCandidate(null)}
          candidate={selectedCandidate}
          onGenerateOffer={generateOffer}
        />
      )}

      {interviewCandidate && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/50 p-4">
          <section role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {interviewMode === "assign" ? "Assign Interview" : "Candidate Interviews"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{interviewCandidate.name} · {interviewCandidate.position}</p>
              </div>
              <button type="button" onClick={() => setInterviewCandidate(null)} aria-label="Close dialog"><X size={20} /></button>
            </div>
            {interviewMode === "assign" ? (
              <form className="space-y-4" onSubmit={submitInterviewAssignment}>
                <label className="block text-sm font-medium">Interviewer
                  <select required value={interviewForm.interviewerId} onChange={(event) => setInterviewForm({ ...interviewForm, interviewerId: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                    <option value="">{loadingInterviewers ? "Loading interviewers..." : "Select interviewer"}</option>
                    {interviewers.map((interviewer) => <option key={interviewer._id} value={interviewer._id}>{interviewer.name} · {interviewer.email}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium">Round name
                  <input required value={interviewForm.roundName} onChange={(event) => setInterviewForm({ ...interviewForm, roundName: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium">Interview type
                    <select value={interviewForm.interviewType} onChange={(event) => setInterviewForm({ ...interviewForm, interviewType: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                      {["technical", "hr", "managerial", "other"].map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium">Scheduled date/time
                    <input required type="datetime-local" value={interviewForm.scheduledAt} onChange={(event) => setInterviewForm({ ...interviewForm, scheduledAt: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                  </label>
                </div>
                <label className="block text-sm font-medium">Meeting link (optional)
                  <input type="url" value={interviewForm.meetingLink} onChange={(event) => setInterviewForm({ ...interviewForm, meetingLink: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                </label>
                <div className="flex justify-end gap-2 border-t pt-4">
                  <button type="button" onClick={() => setInterviewCandidate(null)} className="rounded-xl border px-4 py-2 text-sm">Cancel</button>
                  <button type="submit" disabled={assigning || loadingInterviewers || !interviewers.length} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{assigning ? "Assigning..." : "Assign Interview"}</button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                {(interviewCandidate.interviews || []).length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No interviews found for this candidate.</p> : (interviewCandidate.interviews || []).map((interview) => (
                  <article key={interview._id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex justify-between gap-3">
                      <h3 className="font-semibold">{interview.roundName || "Interview"}</h3>
                      <span className="text-xs capitalize">{interview.status}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{interview.interviewType} · {formatDate(interview.scheduledAt)}</p>
                    <p className="mt-1 text-xs text-slate-500">Interviewer: {interview.interviewerId?.name || interview.interviewerId?.email || "Assigned"}</p>
                  </article>
                ))}
                <div className="flex justify-end"><button type="button" onClick={() => setInterviewCandidate(null)} className="rounded-xl border px-4 py-2 text-sm">Close</button></div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Reusable Alert Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        type={confirmModal.type}
        loading={confirmModal.loading}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal({ isOpen: false })}
      />
    </div>
  );
}
