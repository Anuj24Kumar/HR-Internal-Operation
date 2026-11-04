import { useState } from "react";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  Video,
  ExternalLink,
  Star,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import StatusBadge from "../../components/StatusBadge.jsx";
import Spinner from "../../components/Spinner.jsx";
import EmptyState from "../../components/EmptyState.jsx";

function formatDateTime(val) {
  if (!val) return "Not scheduled";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "Not scheduled";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function InterviewMain({
  interviews = [],
  selectedView = "upcoming",
  onViewChange,
  loading = false,
  refreshing = false,
  onRefresh,
  onOpenFeedback,
  successNotice = "",
  errorNotice = "",
}) {
  const [search, setSearch] = useState("");

  const pendingList = interviews
    .filter(item => {
      const s = String(item.interview?.status || "").toLowerCase();
      return s !== "completed" && s !== "cancelled";
    })
    .sort((a, b) => new Date(a.interview?.scheduledAt || 0) - new Date(b.interview?.scheduledAt || 0));

  const completedList = interviews
    .filter(item => String(item.interview?.status || "").toLowerCase() === "completed")
    .sort((a, b) => new Date(b.interview?.updatedAt || b.interview?.scheduledAt || 0) - new Date(a.interview?.updatedAt || a.interview?.scheduledAt || 0));

  const currentList = selectedView === "upcoming" ? pendingList : completedList;

  const filteredList = currentList.filter(item => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const candName = String(item.candidate?.name || "").toLowerCase();
    const pos = String(item.candidate?.position || "").toLowerCase();
    const round = String(item.interview?.roundName || "").toLowerCase();
    return candName.includes(q) || pos.includes(q) || round.includes(q);
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Notices */}
      {successNotice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}
      {errorNotice && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          {errorNotice}
        </div>
      )}

      {/* Header & Sync */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Interviewer Dashboard
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Manage your scheduled interview rounds, submit scorecards, and provide hiring recommendations.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>{refreshing ? "Refreshing..." : "Refresh Schedule"}</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Upcoming Interviews</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{pendingList.length}</p>
          <p className="mt-1 text-[11px] text-slate-400">Scheduled rounds awaiting evaluation</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Completed Interviews</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{completedList.length}</p>
          <p className="mt-1 text-[11px] text-slate-400">Completed and submitted evaluations</p>
        </div>
      </div>

      {/* Main Content Area with Tabs */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        {/* Tab switcher & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 p-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onViewChange?.("upcoming")}
              aria-pressed={selectedView === "upcoming"}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                selectedView === "upcoming"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Upcoming ({pendingList.length})
            </button>
            <button
              type="button"
              onClick={() => onViewChange?.("completed")}
              aria-pressed={selectedView === "completed"}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                selectedView === "completed"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Completed ({completedList.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate, role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* List items */}
        {loading ? (
          <Spinner message="Loading assigned interviews..." />
        ) : filteredList.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredList.map((item, idx) => {
              const { candidate = {}, interview = {} } = item;
              const isCompleted = String(interview.status || "").toLowerCase() === "completed";

              return (
                <div
                  key={interview._id || idx}
                  className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 hover:bg-slate-50/70 transition"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700 font-bold text-xs">
                      {(candidate.name || "C").slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {candidate.name || "Candidate"}
                        </h3>
                        <StatusBadge status={interview.status || "scheduled"} />
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        {candidate.position || "Applicant"} · Round:{" "}
                        <span className="font-semibold text-slate-700">
                          {interview.roundName || `Round ${interview.round || 1}`}
                        </span>
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                          {formatDateTime(interview.scheduledAt)}
                        </span>
                        {candidate.email && <span>· {candidate.email}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end lg:self-auto">
                    {/* Meeting link */}
                    {interview.meetingLink && !isCompleted && (
                      <a
                        href={interview.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                      >
                        <Video className="h-3.5 w-3.5" />
                        Meeting Link
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}

                    {/* Score badge if completed */}
                    {isCompleted && (
                      <div className="flex items-center gap-2 text-xs">
                        {interview.score !== undefined && (
                          <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-bold text-blue-700">
                            {interview.score}/100
                          </span>
                        )}
                        {interview.rating && (
                          <span className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 font-bold text-amber-700">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {interview.rating}/5
                          </span>
                        )}
                      </div>
                    )}

                    {/* Open Button */}
                    <button
                      type="button"
                      onClick={() => !isCompleted && onOpenFeedback(item)}
                      disabled={isCompleted}
                      aria-label={isCompleted ? "Completed interview; evaluation is closed" : "Open interview evaluation"}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shadow-2xs ${
                        isCompleted
                          ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-500"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {isCompleted ? "Completed" : "Open Evaluation"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8">
            <EmptyState
              title={selectedView === "upcoming" ? "No upcoming interviews" : "No completed interviews"}
              message={
                selectedView === "upcoming"
                  ? "You don't have any pending interviews scheduled right now."
                  : "You haven't completed any interviews yet."
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
