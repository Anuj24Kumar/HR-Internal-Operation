import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  Clock3,
  RefreshCw,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Video,
  Users,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { apiRequest } from "../api.js";
import DataTable from "../components/DataTable.jsx";
import CandidateDetailsModal from "../components/CandidateDetailsModal.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";

const EMPTY_FORM = {
  roundName: "",
  interviewType: "technical",
  interviewerId: "",
  scheduledAt: "",
  meetingLink: "",
  status: "Scheduled",
};

function formatDate(value) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function StatusBadge({ status }) {
  const normalized = String(status || "Scheduled").toLowerCase().replace("_", " ");

  const styles = {
    scheduled: "bg-blue-50 text-blue-700 ring-blue-600/20",
    "pending schedule": "bg-amber-50 text-amber-700 ring-amber-600/20",
    pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    cancelled: "bg-rose-50 text-rose-700 ring-rose-600/20",
    rescheduled: "bg-violet-50 text-violet-700 ring-violet-600/20",
    selected: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    interview: "bg-purple-50 text-purple-700 ring-purple-600/20",
    rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${
        styles[normalized] || "bg-slate-100 text-slate-700 ring-slate-500/20"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status || "Scheduled"}
    </span>
  );
}

function getCandidateName(candidate) {
  return candidate?.name || candidate?.fullName || "Unknown candidate";
}

function getInterviewerLabel(interview) {
  const interviewer = interview.interviewerId;
  if (!interviewer) return "Not assigned";

  if (typeof interviewer === "object") {
    return (
      interviewer.name ||
      [interviewer.firstName, interviewer.lastName].filter(Boolean).join(" ") ||
      interviewer.email ||
      interviewer._id ||
      "Assigned"
    );
  }

  return String(interviewer);
}

export default function Interviews() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [interviews, setInterviews] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [candidateId, setCandidateId] = useState("");
  const [candidateLocked, setCandidateLocked] = useState(false);
  const [selectedCandidateModal, setSelectedCandidateModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: "", message: "", loading: false, action: null });

  const loadInterviews = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // 1. Fetch candidates list
      const [candidateResult, interviewerResult, interviewResult] = await Promise.all([
        apiRequest("/candidates?limit=100&page=1"),
        apiRequest("/interviews/interviewers"),
        apiRequest("/interviews"),
      ]);
      const candidateList = Array.isArray(candidateResult.data)
        ? candidateResult.data.filter(
            (candidate) =>
              String(candidate.role || "").trim().toLowerCase() === "candidate"
          )
        : [];

      setCandidates(candidateList);
      setInterviewers(
        (Array.isArray(interviewerResult.data) ? interviewerResult.data : []).filter(
          (u) => String(u.role || "interviewer").toLowerCase() === "interviewer"
        )
      );

      const interviewRows = (Array.isArray(interviewResult.data) ? interviewResult.data : [])
        .map((interview) => {
          const populatedCandidate =
            interview.candidateId && typeof interview.candidateId === "object"
              ? interview.candidateId
              : null;
          const candidate =
            candidateList.find(
              (item) => item._id === (populatedCandidate?._id || interview.candidateId)
            ) || populatedCandidate;

          if (!candidate?._id) return null;

          return {
            _id: interview._id,
            candidateId: candidate._id,
            candidateName: getCandidateName(candidate),
            candidateEmail: candidate.email || "—",
            candidatePhone: candidate.phone || "—",
            candidatePosition: candidate.position || "Candidate",
            candidateJobType: candidate.jobType || "",
            candidateDepartment: candidate.department || "",
            candidateStatus: candidate.status,
            candidateData: candidate,
            hasRound: true,
            roundName: interview.roundName || "Interview Round",
            interviewType: interview.interviewType || "technical",
            interviewerId: interview.interviewerId,
            scheduledAt: interview.scheduledAt,
            meetingLink: interview.meetingLink || "",
            status: interview.status || "Scheduled",
            rawInterview: interview,
          };
        })
        .filter(Boolean);

      const candidateIdsWithRecords = new Set(
        interviewRows.map((interview) => interview.candidateId)
      );

      // Include legacy embedded rounds that do not yet have a standalone interview record.
      const interviewCandidates = candidateList.filter(
        (candidate) => String(candidate.status || "").toLowerCase() === "interview"
      );

      const legacyRows = await Promise.all(
        interviewCandidates.map(async (candidate) => {
          if (candidateIdsWithRecords.has(candidate._id)) return [];
          let rounds = [];
          try {
            const result = await apiRequest(
              `/interviews/candidates/${candidate._id}/interviews`
            );
            if (Array.isArray(result.data) && result.data.length > 0) {
              rounds = result.data;
            }
          } catch (err) {
            console.warn(`Could not load rounds for ${getCandidateName(candidate)}:`, err.message);
          }

          // Fallback to embedded interviews on candidate document if any
          if (rounds.length === 0 && Array.isArray(candidate.interviews) && candidate.interviews.length > 0) {
            rounds = candidate.interviews.map((r, idx) => ({
              _id: r._id || `emb-${candidate._id}-${idx}`,
              roundName: `Round ${r.round || idx + 1}`,
              interviewType: "technical",
              interviewerId: r.interviewerId,
              scheduledAt: r.scheduledAt,
              status: r.status || "scheduled",
              meetingLink: r.meetingLink || "",
            }));
          }

          // If this candidate has interview round(s) scheduled
          if (rounds.length > 0) {
            return rounds.map((round) => ({
              _id: round._id,
              candidateId: candidate._id,
              candidateName: getCandidateName(candidate),
              candidateEmail: candidate.email || "—",
              candidatePhone: candidate.phone || "—",
              candidatePosition: candidate.position || "Candidate",
              candidateJobType: candidate.jobType || "",
              candidateDepartment: candidate.department || "",
              candidateStatus: candidate.status,
              candidateData: candidate,
              hasRound: true,
              roundName: round.roundName || "Technical Round",
              interviewType: round.interviewType || "technical",
              interviewerId: round.interviewerId,
              scheduledAt: round.scheduledAt,
              meetingLink: round.meetingLink || "",
              status: round.status || "Scheduled",
              rawInterview: round,
            }));
          }

          // If this candidate is in interview status but no round has been scheduled yet
          return [
            {
              _id: `pending-${candidate._id}`,
              candidateId: candidate._id,
              candidateName: getCandidateName(candidate),
              candidateEmail: candidate.email || "—",
              candidatePhone: candidate.phone || "—",
              candidatePosition: candidate.position || "Candidate",
              candidateJobType: candidate.jobType || "",
              candidateDepartment: candidate.department || "",
              candidateStatus: candidate.status,
              candidateData: candidate,
              hasRound: false,
              roundName: "Awaiting Schedule",
              interviewType: "technical",
              interviewerId: null,
              scheduledAt: null,
              meetingLink: "",
              status: "Pending Schedule",
              rawInterview: null,
            },
          ];
        })
      );

      setInterviews([...interviewRows, ...legacyRows.flat()]);
    } catch (err) {
      setError(err.message || "Unable to load interviews.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  useEffect(() => {
    const requestedCandidateId = searchParams.get("candidateId");
    if (!requestedCandidateId || candidates.length === 0) return;

    const candidateExists = candidates.some(
      (candidate) => candidate._id === requestedCandidateId
    );
    if (!candidateExists) return;

    setEditing(null);
    setCandidateId(requestedCandidateId);
    setCandidateLocked(true);
    setForm(EMPTY_FORM);
    setError("");
    setNotice("");
    setShowForm(true);
    setSearchParams({}, { replace: true });
  }, [candidates, searchParams, setSearchParams]);

  const filteredInterviews = useMemo(() => {
    const term = search.trim().toLowerCase();

    return interviews.filter((interview) => {
      const matchesStatus =
        !statusFilter ||
        String(interview.status || "Scheduled").toLowerCase() ===
          statusFilter.toLowerCase();

      const matchesSearch =
        !term ||
        [
          interview.roundName,
          interview.interviewType,
          interview.status,
          interview.candidateName,
          interview.candidateEmail,
          interview.candidatePhone,
          interview.candidatePosition,
          getInterviewerLabel(interview),
        ].some((value) => String(value || "").toLowerCase().includes(term));

      return matchesStatus && matchesSearch;
    });
  }, [interviews, search, statusFilter]);

  const stats = useMemo(() => {
    const now = Date.now();
    const uniqueCandidates = new Set(interviews.map((item) => item.candidateId));

    return {
      total: uniqueCandidates.size,
      upcoming: interviews.filter(
        (item) => item.scheduledAt && new Date(item.scheduledAt).getTime() >= now
      ).length,
      completed: interviews.filter(
        (item) => String(item.status || "").toLowerCase() === "completed"
      ).length,
    };
  }, [interviews]);

  const sortedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => {
      const aIsInterview = String(a.status || "").toLowerCase() === "interview" ? 0 : 1;
      const bIsInterview = String(b.status || "").toLowerCase() === "interview" ? 0 : 1;
      return aIsInterview - bIsInterview;
    });
  }, [candidates]);

  function openCreateForm() {
    setEditing(null);
    setCandidateLocked(false);
    const firstInterviewCandidate = candidates.find(
      (c) => String(c.status || "").toLowerCase() === "interview"
    );
    setCandidateId(firstInterviewCandidate?._id || candidates[0]?._id || "");
    setForm(EMPTY_FORM);
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function openCreateFormForCandidate(targetCandidateId) {
    setEditing(null);
    setCandidateId(targetCandidateId);
    setCandidateLocked(true);
    setForm(EMPTY_FORM);
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function openEditForm(interview) {
    setEditing(interview);
    setCandidateId(interview.candidateId);
    setCandidateLocked(true);
    setForm({
      roundName: interview.roundName || "",
      interviewType: String(interview.interviewType || "technical").toLowerCase(),
      interviewerId:
        typeof interview.interviewerId === "object"
          ? interview.interviewerId?._id || ""
          : interview.interviewerId || "",
      scheduledAt: interview.scheduledAt
        ? (() => {
            const date = new Date(interview.scheduledAt);
            const local = new Date(
              date.getTime() - date.getTimezoneOffset() * 60000
            );
            return local.toISOString().slice(0, 16);
          })()
        : "",
      meetingLink: interview.meetingLink || "",
      status: interview.status || "Scheduled",
    });
    setError("");
    setNotice("");
    setShowForm(true);
  }

  async function saveInterview(event) {
    event.preventDefault();

    if (!candidateId) {
      setError("Select a candidate first.");
      return;
    }

    if (!form.roundName.trim()) {
      setError("Round name is required.");
      return;
    }

    if (!form.interviewerId) {
      setError("Select an interviewer.");
      return;
    }

    if (!form.scheduledAt || Number.isNaN(new Date(form.scheduledAt).getTime())) {
      setError("Select a valid interview date and time.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    const body = {
      roundName: form.roundName.trim(),
      interviewType: String(form.interviewType || "technical").toLowerCase(),
      interviewerId: form.interviewerId,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      meetingLink: form.meetingLink.trim(),
    };

    if (editing && editing.hasRound) {
      body.status = String(form.status).toLowerCase();
    }

    try {
      const endpoint = editing && editing.hasRound
        ? `/interviews/candidates/${candidateId}/interviews/${editing._id}`
        : `/interviews/candidates/${candidateId}/interviews`;

      await apiRequest(endpoint, {
        method: editing && editing.hasRound ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });

      setShowForm(false);
      setNotice(
        editing && editing.hasRound
          ? "Interview updated successfully."
          : "Interview scheduled successfully."
      );
      await loadInterviews();
    } catch (err) {
      setError(err.message || "Unable to save interview.");
    } finally {
      setSaving(false);
    }
  }

  function deleteInterview(interview) {
    setConfirmModal({
      isOpen: true,
      title: "Delete Interview Round",
      message: `Are you sure you want to delete "${interview.roundName || "this interview"}" for ${interview.candidateName}? This cannot be undone.`,
      confirmText: "Delete Interview",
      type: "danger",
      loading: false,
      action: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, loading: true }));
          setError("");
          setNotice("");
          await apiRequest(
            `/interviews/candidates/${interview.candidateId}/interviews/${interview._id}`,
            { method: "DELETE" }
          );
          setNotice("Interview deleted successfully.");
          setConfirmModal({ isOpen: false });
          await loadInterviews();
        } catch (err) {
          setError(err.message || "Unable to delete interview.");
          setConfirmModal({ isOpen: false });
        }
      },
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            HR Workspace
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Interviews
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Schedule interviews and manage recruitment rounds for candidates in the interview stage.
          </p>
        </div>


      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
            <X size={17} />
          </button>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <CalendarDays size={21} />
            </span>
            <div>
              <p className="text-sm text-slate-500">Candidates in interview</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-600">
              <Clock3 size={21} />
            </span>
            <div>
              <p className="text-sm text-slate-500">Upcoming interviews</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats.upcoming}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <Users size={21} />
            </span>
            <div>
              <p className="text-sm text-slate-500">Completed interviews</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3">
          <Search size={17} className="shrink-0 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search candidate name, position, round, interviewer..."
            className="w-full min-w-0 border-0 bg-transparent py-3 text-sm outline-none"
          />
        </label>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter interviews by status"
          className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-500"
        >
          <option value="">All statuses</option>
          {["Scheduled", "Pending Schedule", "Pending", "Completed", "Cancelled", "Rescheduled"].map(
            (status) => (
              <option key={status} value={status}>
                {status}
              </option>
            )
          )}
        </select>
      </div>

      {/* Candidates with status 'interview' Table */}
      <DataTable
        columns={[
          {
            key: "candidate",
            label: "Candidate",
            render: (item) => (
              <div className="min-w-44">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 ring-2 ring-white">
                    {item.candidateName?.charAt(0)?.toUpperCase() || "C"}
                  </div>
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() =>
                        item.candidateData && setSelectedCandidateModal(item.candidateData)
                      }
                      className="font-semibold text-slate-900 hover:text-blue-600 text-left transition truncate block max-w-[200px]"
                      title="View candidate profile"
                    >
                      {item.candidateName}
                    </button>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-slate-500 truncate max-w-[150px]">
                        {item.candidatePosition || "Candidate"}
                      </span>
                      {item.candidateJobType && (
                        <span className="inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          {item.candidateJobType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-1 text-xs text-slate-400 pl-11 truncate">
                  {item.candidateEmail || "—"}{" "}
                  {item.candidatePhone && item.candidatePhone !== "—" ? `• ${item.candidatePhone}` : ""}
                </div>
              </div>
            ),
          },
          {
            key: "roundName",
            label: "Interview round",
            render: (item) => (
              <div>
                {item.hasRound ? (
                  <>
                    <p className="font-semibold text-slate-800">{item.roundName || "Round 1"}</p>
                    <span className="mt-1 inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700 ring-1 ring-inset ring-purple-600/20 capitalize">
                      {item.interviewType || "technical"}
                    </span>
                  </>
                ) : (
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                      Awaiting Schedule
                    </span>
                    <p className="mt-1 text-[11px] text-slate-400">No interview round set</p>
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "interviewer",
            label: "Interviewer",
            render: (item) => (
              <span
                className={`text-sm ${
                  item.interviewerId ? "text-slate-800 font-medium" : "text-slate-400 italic"
                }`}
              >
                {getInterviewerLabel(item)}
              </span>
            ),
          },
          {
            key: "scheduledAt",
            label: "Scheduled at",
            render: (item) => (
              <div className="min-w-36 text-sm text-slate-700">
                {item.scheduledAt ? (
                  <>
                    <p className="font-medium text-slate-900">{formatDate(item.scheduledAt)}</p>
                    {item.meetingLink && (
                      <a
                        href={item.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                      >
                        <Video size={13} />
                        Join meeting
                      </a>
                    )}
                  </>
                ) : (
                  <span className="text-slate-400 text-xs italic">Not scheduled yet</span>
                )}
              </div>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (item) => <StatusBadge status={item.status} />,
          },
          {
            key: "actions",
            label: "Actions",
            render: (item) => (
              <div className="flex items-center gap-2">
                {item.hasRound ? (
                  <>
                    <button
                      type="button"
                      onClick={() => openEditForm(item)}
                      title="Edit interview round"
                      className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteInterview(item)}
                      title="Delete interview round"
                      className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => openCreateFormForCandidate(item.candidateId)}
                    title="Schedule interview round"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 transition"
                  >
                    <Plus size={14} />
                    Schedule
                  </button>
                )}

                {item.candidateData && (
                  <button
                    type="button"
                    onClick={() => setSelectedCandidateModal(item.candidateData)}
                    title="View candidate details & resume"
                    className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition"
                  >
                    <Eye size={15} />
                  </button>
                )}
              </div>
            ),
          },
        ]}
        data={filteredInterviews}
        loading={loading}
        emptyMessage={
          search || statusFilter
            ? "No candidates or interviews match your filters."
            : "No candidates currently have status 'interview'. Candidates marked with status 'interview' in the Candidates tab will automatically appear here."
        }
        getRowKey={(item) => item._id}
      />

      {/* Schedule / Edit Interview Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="interview-form-title"
            className="my-auto w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <h2 id="interview-form-title" className="text-xl font-bold text-slate-900">
                  {editing && editing.hasRound ? "Edit interview" : "Schedule interview"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editing && editing.hasRound
                    ? "Update the interview details."
                    : "Create an interview round for the candidate."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close form"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={saveInterview} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Candidate
                  </span>
                  <select
                    value={candidateId}
                    disabled={Boolean((editing && editing.hasRound) || candidateLocked)}
                    onChange={(event) => setCandidateId(event.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >
                    <option value="">Select candidate</option>
                    {sortedCandidates.map((candidate) => {
                      const isInInterview =
                        String(candidate.status || "").toLowerCase() === "interview";
                      return (
                        <option key={candidate._id} value={candidate._id}>
                          {getCandidateName(candidate)} {isInInterview ? "— ⭐ [Interview Stage]" : `(${candidate.status || "applied"})`} • {candidate.position || "Candidate"}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Round name
                  </span>
                  <input
                    required
                    value={form.roundName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, roundName: event.target.value }))
                    }
                    placeholder="e.g. Technical Round 1"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Interview type
                  </span>
                  <select
                    value={form.interviewType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        interviewType: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="technical">Technical</option>
                    <option value="hr">HR</option>
                    <option value="managerial">Managerial</option>
                    <option value="other">Other</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Assign interviewer
                  </span>
                  <select
                    value={form.interviewerId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        interviewerId: event.target.value,
                      }))
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">Select an interviewer</option>
                    {interviewers.map((interviewer) => (
                      <option key={interviewer._id} value={interviewer._id}>
                        {interviewer.name ||
                          [interviewer.firstName, interviewer.lastName]
                            .filter(Boolean)
                            .join(" ") ||
                          interviewer.email}{" "}
                        — {interviewer.email}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Scheduled date & time
                  </span>
                  <input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        scheduledAt: event.target.value,
                      }))
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </label>

                {editing && editing.hasRound && (
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">
                      Status
                    </span>
                    <select
                      value={form.status}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, status: event.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Rescheduled">Rescheduled</option>
                    </select>
                  </label>
                )}

                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Meeting link (Google Meet / Zoom)
                  </span>
                  <input
                    type="url"
                    value={form.meetingLink}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        meetingLink: event.target.value,
                      }))
                    }
                    placeholder="https://meet.google.com/..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {saving ? "Saving..." : editing && editing.hasRound ? "Update Interview" : "Schedule Interview"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText || "Delete"}
        type={confirmModal.type || "danger"}
        loading={confirmModal.loading}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal({ isOpen: false })}
      />

      {/* Candidate Profile Details Modal */}
      {selectedCandidateModal && (
        <CandidateDetailsModal
          isOpen={Boolean(selectedCandidateModal)}
          onClose={() => setSelectedCandidateModal(null)}
          candidate={selectedCandidateModal}
          onStatusUpdate={async () => {
            await loadInterviews();
          }}
        />
      )}
    </div>
  );
}
