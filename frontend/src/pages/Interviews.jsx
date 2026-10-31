
import { useCallback, useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { apiRequest } from "../api.js";
import DataTable from "../components/DataTable.jsx";

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
  const normalized = String(status || "Scheduled").toLowerCase();

  const styles = {
    scheduled: "bg-blue-50 text-blue-700 ring-blue-600/20",
    pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    cancelled: "bg-rose-50 text-rose-700 ring-rose-600/20",
    rescheduled: "bg-violet-50 text-violet-700 ring-violet-600/20",
    selected: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${
        styles[normalized] || "bg-slate-100 text-slate-700 ring-slate-500/20"
      }`}
    >
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
      interviewer.fullName ||
      interviewer.email ||
      interviewer._id ||
      "Assigned"
    );
  }

  return String(interviewer);
}

export default function Interviews() {
  const [interviews, setInterviews] = useState([]);
  const [candidates, setCandidates] = useState([]);
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

  const loadInterviews = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const candidateResult = await apiRequest("/candidates?limit=100&page=1");
      console.log(
  "Candidates returned by API:",
  candidateResult.data?.map((candidate) => ({
    id: candidate._id,
    name: candidate.name || candidate.fullName,
  }))
);
      const candidateList = Array.isArray(candidateResult.data)
        ? candidateResult.data
        : [];

      setCandidates(candidateList);

      const results = await Promise.all(
        candidateList.map(async (candidate) => {
          try {
  const result = await apiRequest(
  `/interviews/candidates/${candidate._id}/interviews`
);

console.log("Interview API candidate:", candidate._id);
console.log("Interview API response:", result);

            return (Array.isArray(result.data) ? result.data : []).map(
              (interview) => ({
                ...interview,
                candidateName: getCandidateName(candidate),
                candidateEmail: candidate.email || "",
                candidateId: candidate._id,
              })
            );
          } catch (err) {
            throw new Error(
              `Could not load interviews for ${getCandidateName(candidate)}: ${err.message}`
            );
          }
        })
      );

      setInterviews(results.flat());
    } catch (err) {
      setError(err.message || "Unable to load interviews.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

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
          getInterviewerLabel(interview),
        ].some((value) => String(value || "").toLowerCase().includes(term));

      return matchesStatus && matchesSearch;
    });
  }, [interviews, search, statusFilter]);

  const stats = useMemo(() => {
    const now = Date.now();

    return {
      total: interviews.length,
      upcoming: interviews.filter(
        (item) => item.scheduledAt && new Date(item.scheduledAt).getTime() >= now
      ).length,
      completed: interviews.filter(
        (item) => String(item.status || "").toLowerCase() === "completed"
      ).length,
    };
  }, [interviews]);

  function openCreateForm() {
    setEditing(null);
    setCandidateId(candidates[0]?._id || "");
    setForm(EMPTY_FORM);
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function openEditForm(interview) {
    setEditing(interview);
    setCandidateId(interview.candidateId);
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

    setSaving(true);
    setError("");
    setNotice("");

    const body = {
      roundName: form.roundName.trim(),
     interviewType: String(form.interviewType || "technical").toLowerCase(),
      interviewerId: form.interviewerId.trim() || null,
      scheduledAt: form.scheduledAt
        ? new Date(form.scheduledAt).toISOString()
        : null,
      meetingLink: form.meetingLink.trim(),
    };

    if (editing) body.status = form.status;

    try {
      const endpoint = editing
        ? `/interviews/candidates/${candidateId}/interviews/${editing._id}`
        : `/interviews/candidates/${candidateId}/interviews`;

      await apiRequest(endpoint, {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });

      setShowForm(false);
      setNotice(editing ? "Interview updated successfully." : "Interview scheduled successfully.");
      await loadInterviews();
    } catch (err) {
      setError(err.message || "Unable to save interview.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteInterview(interview) {
    const confirmed = window.confirm(
      `Delete "${interview.roundName || "this interview"}" for ${interview.candidateName}?`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await apiRequest(
        `/interviews/candidates/${interview.candidateId}/interviews/${interview._id}`,
        { method: "DELETE" }
      );

      setNotice("Interview deleted successfully.");
      await loadInterviews();
    } catch (err) {
      setError(err.message || "Unable to delete interview.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            HR Workspace
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Interviews
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Schedule interviews and manage recruitment rounds.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadInterviews}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreateForm}
            disabled={candidates.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={17} />
            Schedule interview
          </button>
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
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <CalendarDays size={21} />
            </span>
            <div>
              <p className="text-sm text-slate-500">Total interviews</p>
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
              <p className="text-sm text-slate-500">Completed</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3">
          <Search size={17} className="shrink-0 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search candidate, round, interviewer..."
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
          {["Scheduled", "Pending", "Completed", "Cancelled", "Rescheduled"].map(
            (status) => (
              <option key={status} value={status}>
                {status}
              </option>
            )
          )}
        </select>
      </div>

      <DataTable
        columns={[
          {
            key: "candidate",
            label: "Candidate",
            render: (item) => (
              <div className="min-w-36">
                <p className="font-semibold text-slate-800">{item.candidateName}</p>
                <p className="mt-1 text-xs text-slate-500">{item.candidateEmail || "—"}</p>
              </div>
            ),
          },
          {
            key: "roundName",
            label: "Interview round",
            render: (item) => (
              <div>
                <p className="font-semibold text-slate-800">{item.roundName || "—"}</p>
                <p className="mt-1 text-xs text-slate-500">{item.interviewType || "—"}</p>
              </div>
            ),
          },
          {
            key: "interviewer",
            label: "Interviewer",
            render: (item) => (
              <span className="text-sm text-slate-700">{getInterviewerLabel(item)}</span>
            ),
          },
          {
            key: "scheduledAt",
            label: "Scheduled at",
            render: (item) => (
              <div className="min-w-36 text-sm text-slate-700">
                {formatDate(item.scheduledAt)}
                {item.meetingLink && (
                  <a
                    href={item.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                  >
                    <Video size={13} />
                    Join meeting
                  </a>
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
                <button
                  type="button"
                  onClick={() => openEditForm(item)}
                  title="Edit interview"
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => deleteInterview(item)}
                  title="Delete interview"
                  className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ),
          },
        ]}
        data={filteredInterviews}
        loading={loading}
        emptyMessage={
          search || statusFilter
            ? "No interviews match your filters."
            : "No interviews have been scheduled yet."
        }
        getRowKey={(item) => item._id}
      />

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
                  {editing ? "Edit interview" : "Schedule interview"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editing
                    ? "Update the interview details."
                    : "Create an interview round for a candidate."}
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
                    disabled={Boolean(editing)}
                    onChange={(event) => setCandidateId(event.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50"
                  >
                    <option value="">Select candidate</option>
                    {candidates.map((candidate) => (
                      <option key={candidate._id} value={candidate._id}>
                        {getCandidateName(candidate)} — {candidate.email || "No email"}
                      </option>
                    ))}
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
                      setForm((current) => ({ ...current, interviewType: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                   {["technical", "hr", "managerial", "other"].map((type) => (
  <option key={type} value={type}>
    {type === "hr" ? "HR" : type.charAt(0).toUpperCase() + type.slice(1)}
  </option>
))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Interviewer ID (optional)
                  </span>
                  <input
                    value={form.interviewerId}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, interviewerId: event.target.value }))
                    }
                    placeholder="Interviewer user ID"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Date and time
                  </span>
                  <input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, scheduledAt: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Meeting link (optional)
                  </span>
                  <input
                    type="url"
                    value={form.meetingLink}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, meetingLink: event.target.value }))
                    }
                    placeholder="https://..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </label>

                {editing && (
                  <label className="block sm:col-span-2">
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
                      {["Scheduled", "Pending", "Completed", "Cancelled", "Rescheduled"].map(
                        (status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editing ? "Save changes" : "Schedule interview"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
