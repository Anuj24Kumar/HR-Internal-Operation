import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  UserPlus,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Archive,
  CheckCircle2,
  Eye,
  FileText,
  ExternalLink,
  Briefcase,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { apiRequest } from "../api.js";
import DataTable from "../components/DataTable.jsx";
import CandidateDetailsModal from "../components/CandidateDetailsModal.jsx";

const STATUSES = ["applied", "screening", "interview", "selected", "rejected"];

const initialForm = {
  name: "",
  email: "",
  phone: "",
  position: "",
  source: "Other",
};

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
    rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
  };

  const normalized = String(status || "").toLowerCase();

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${
        styles[normalized] || "bg-slate-100 text-slate-700 ring-slate-500/20"
      }`}
    >
      {normalized || "unspecified"}
    </span>
  );
}

function JobTypeBadge({ jobType, hasApplied }) {
  if (!hasApplied && !jobType) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
        No Application
      </span>
    );
  }

  const isIntern = /^intern/i.test(jobType);

  if (isIntern) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700 ring-1 ring-inset ring-purple-600/20">
        <GraduationCap className="h-3.5 w-3.5" />
        Internship
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
      <Briefcase className="h-3.5 w-3.5" />
      Full-time Job
    </span>
  );
}

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [summary, setSummary] = useState({
    totalCandidates: 0,
    totalApplications: 0,
    fullTimeCount: 0,
    internshipCount: 0,
  });

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("all"); // "all" | "Full-time" | "Internship"
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: "10",
      });

      if (statusFilter) query.set("status", statusFilter);
      if (jobTypeFilter && jobTypeFilter !== "all") query.set("jobType", jobTypeFilter);

      const result = await apiRequest(`/candidates?${query.toString()}`);

      setCandidates(Array.isArray(result.data) ? result.data : []);
      if (result.summary) {
        setSummary(result.summary);
      }
      setPagination(
        result.pagination || {
          total: 0,
          page,
          limit: 10,
          totalPages: 0,
        }
      );
    } catch (err) {
      setError(err.message || "Unable to load candidates.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, jobTypeFilter]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const filteredCandidates = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return candidates;

    return candidates.filter((candidate) =>
      [
        candidate.name,
        candidate.email,
        candidate.phone,
        candidate.position,
        candidate.jobType,
        candidate.source,
        candidate.applicationSource,
        candidate.applicationId,
      ].some((value) => String(value || "").toLowerCase().includes(term))
    );
  }, [candidates, search]);

  async function createCandidate(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      await apiRequest("/candidates", {
        method: "POST",
        body: JSON.stringify(form),
      });

      setForm(initialForm);
      setShowCreate(false);
      setPage(1);
      setNotice("Candidate created successfully.");
      await loadCandidates();
    } catch (err) {
      setError(err.message || "Unable to create candidate.");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(candidate, status) {
    setError("");
    setNotice("");

    try {
      await apiRequest(`/candidates/${candidate._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setNotice(`Status updated to ${status} for ${candidate.name}.`);
      setSelectedCandidate((prev) =>
        prev && prev._id === candidate._id ? { ...prev, status } : prev
      );
      await loadCandidates();
    } catch (err) {
      setError(err.message || "Unable to update status.");
    }
  }

  async function selectCandidate(candidate) {
    const defaultType = candidate.jobType?.toLowerCase().includes("intern") ? "intern" : "employee";
    const selectedAs = window.prompt(
      `Select ${candidate.name} as "intern" or "employee":`,
      defaultType
    );

    if (selectedAs === null) return;

    const normalized = selectedAs.trim().toLowerCase();
    if (!["intern", "employee"].includes(normalized)) {
      setError('Selection type must be "intern" or "employee".');
      return;
    }

    setError("");
    setNotice("");

    try {
      await apiRequest(`/candidates/${candidate._id}/select`, {
        method: "PATCH",
        body: JSON.stringify({ selectedAs: normalized }),
      });
      setNotice(`${candidate.name} selected as ${normalized}.`);
      setSelectedCandidate((prev) =>
        prev && prev._id === candidate._id
          ? { ...prev, status: "selected", selectedAs: normalized }
          : prev
      );
      await loadCandidates();
    } catch (err) {
      setError(err.message || "Unable to select candidate.");
    }
  }

  async function archiveCandidate(candidate) {
    const confirmed = window.confirm(
      `Archive ${candidate.name}? They will disappear from the active candidates list.`
    );
    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await apiRequest(`/candidates/${candidate._id}/archive`, {
        method: "PATCH",
      });
      setNotice(`${candidate.name} archived successfully.`);
      if (selectedCandidate && selectedCandidate._id === candidate._id) {
        setSelectedCandidate(null);
      }
      await loadCandidates();
    } catch (err) {
      setError(err.message || "Unable to archive candidate.");
    }
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
              <p className="font-semibold text-slate-800 truncate">
                {candidate.name || "—"}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 truncate">
                {candidate.email || "—"}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "position",
        label: "Applied Role & Track",
        render: (candidate) => (
          <div className="min-w-48 space-y-1.5">
            <p className="font-semibold text-slate-800">
              {candidate.position || "—"}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <JobTypeBadge jobType={candidate.jobType} hasApplied={candidate.hasApplied} />
              {(candidate.source || candidate.applicationSource) && (
                <span className="text-[11px] text-slate-400">
                  via {candidate.source || candidate.applicationSource}
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        key: "phone",
        label: "Phone",
        render: (candidate) => (
          <span className="text-sm text-slate-700">
            {candidate.phone || "—"}
          </span>
        ),
      },
      {
        key: "resume",
        label: "Resume",
        render: (candidate) =>
          candidate.resumeUrl ? (
            <a
              href={candidate.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/70 px-2.5 py-1.5 text-xs font-semibold text-blue-700 shadow-2xs hover:bg-blue-100 transition"
              title="Open Resume in new tab"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Resume</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          ) : (
            <span className="text-xs text-slate-400">No resume</span>
          ),
      },
      {
        key: "status",
        label: "Status",
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
        render: (candidate) => (
          <div className="flex min-w-56 flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCandidate(candidate)}
              title="View full application details"
              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50/40 p-2 text-blue-700 shadow-2xs hover:bg-blue-100/60 transition"
            >
              <Eye size={16} />
            </button>

            <select
              aria-label={`Update status for ${candidate.name}`}
              value={STATUSES.includes(candidate.status) ? candidate.status : ""}
              onChange={(event) => {
                if (event.target.value) {
                  updateStatus(candidate, event.target.value);
                }
              }}
              className="max-w-32 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-500"
            >
              {!STATUSES.includes(candidate.status) && (
                <option value="">Unknown status</option>
              )}
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => selectCandidate(candidate)}
              title="Select candidate as intern or employee"
              className="rounded-lg border border-emerald-200 p-2 text-emerald-700 transition hover:bg-emerald-50"
            >
              <CheckCircle2 size={16} />
            </button>

            <button
              type="button"
              onClick={() => archiveCandidate(candidate)}
              title="Archive candidate"
              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
            >
              <Archive size={16} />
            </button>
          </div>
        ),
      },
    ],
    [page, statusFilter]
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
            Review candidates who applied for Full-Time jobs and Internships.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadCandidates}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setError("");
              setNotice("");
              setShowCreate(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <UserPlus size={16} />
            Add candidate
          </button>
        </div>
      </div>

      {/* Track Filter Tabs (All / Full-time Job / Internship) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => {
            setPage(1);
            setJobTypeFilter("all");
          }}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            jobTypeFilter === "all"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Users size={16} />
          All Candidates
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              jobTypeFilter === "all"
                ? "bg-slate-700 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {summary.totalCandidates || pagination.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setPage(1);
            setJobTypeFilter("Full-time");
          }}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            jobTypeFilter === "Full-time"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Briefcase size={16} />
          Full-Time Jobs
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              jobTypeFilter === "Full-time"
                ? "bg-blue-700 text-white"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            {summary.fullTimeCount || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setPage(1);
            setJobTypeFilter("Internship");
          }}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            jobTypeFilter === "Internship"
              ? "bg-purple-600 text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <GraduationCap size={16} />
          Internships
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              jobTypeFilter === "Internship"
                ? "bg-purple-700 text-white"
                : "bg-purple-50 text-purple-700"
            }`}
          >
            {summary.internshipCount || 0}
          </span>
        </button>
      </div>

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

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          {notice}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => {
            setPage(1);
            setJobTypeFilter("all");
          }}
          className={`text-left rounded-2xl border p-5 shadow-xs transition hover:border-slate-300 ${
            jobTypeFilter === "all" ? "border-slate-800 bg-white ring-2 ring-slate-800/10" : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-700">
              <Users size={21} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                All Candidates
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {summary.totalCandidates || pagination.total}
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setPage(1);
            setJobTypeFilter("Full-time");
          }}
          className={`text-left rounded-2xl border p-5 shadow-xs transition hover:border-blue-300 ${
            jobTypeFilter === "Full-time" ? "border-blue-600 bg-blue-50/30 ring-2 ring-blue-600/10" : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Briefcase size={21} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Full-Time Job Applicants
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {summary.fullTimeCount || 0}
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setPage(1);
            setJobTypeFilter("Internship");
          }}
          className={`text-left rounded-2xl border p-5 shadow-xs transition hover:border-purple-300 ${
            jobTypeFilter === "Internship" ? "border-purple-600 bg-purple-50/30 ring-2 ring-purple-600/10" : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-purple-50 text-purple-600">
              <GraduationCap size={21} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
                Internship Applicants
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {summary.internshipCount || 0}
              </p>
            </div>
          </div>
        </button>
      </div>

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

        {/* Job Type Dropdown */}
        <select
          value={jobTypeFilter}
          onChange={(event) => {
            setPage(1);
            setJobTypeFilter(event.target.value);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
          aria-label="Filter candidates by job type"
        >
          <option value="all">All Tracks (Full-Time & Internships)</option>
          <option value="Full-time">Full-time Job Only</option>
          <option value="Internship">Internship Only</option>
        </select>

        {/* Status Dropdown */}
        <select
          value={statusFilter}
          onChange={(event) => {
            setPage(1);
            setStatusFilter(event.target.value);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
          aria-label="Filter candidates by status"
        >
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={filteredCandidates}
        loading={loading}
        emptyMessage={
          search
            ? "No candidates match your search on this page."
            : jobTypeFilter === "Full-time"
            ? "No candidates currently applied for Full-time jobs."
            : jobTypeFilter === "Internship"
            ? "No candidates currently applied for Internships."
            : "No candidates found for this filter."
        }
        getRowKey={(candidate) => candidate._id}
      />

      {/* Pagination Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Showing {pagination.total === 0 ? 0 : (page - 1) * pagination.limit + 1}
          {"–"}
          {Math.min(page * pagination.limit, pagination.total)} of{" "}
          {pagination.total} candidates
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <button
            type="button"
            disabled={!pagination.totalPages || page >= pagination.totalPages || loading}
            onClick={() =>
              setPage((current) => Math.min(pagination.totalPages, current + 1))
            }
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Candidate Details Modal */}
      <CandidateDetailsModal
        isOpen={Boolean(selectedCandidate)}
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onStatusUpdate={updateStatus}
        onSelectCandidate={selectCandidate}
      />

      {/* Add Candidate Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-candidate-title"
            className="my-auto w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <h2
                  id="create-candidate-title"
                  className="text-xl font-bold text-slate-900"
                >
                  Add candidate
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the candidate details to create a record.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close form"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={createCandidate} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  { key: "name", label: "Full name", type: "text" },
                  { key: "email", label: "Email address", type: "email" },
                  { key: "phone", label: "Phone number", type: "tel" },
                  { key: "position", label: "Position applied for", type: "text" },
                ].map((field) => (
                  <label key={field.key} className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">
                      {field.label}
                    </span>
                    <input
                      required
                      type={field.type}
                      value={form[field.key]}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [field.key]: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                ))}

                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Source
                  </span>
                  <select
                    value={form.source}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        source: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    {["Other", "LinkedIn", "Referral", "Company Website", "Job Portal"].map(
                      (source) => (
                        <option key={source} value={source}>
                          {source}
                        </option>
                      )
                    )}
                  </select>
                </label>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Create candidate"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
