import { useState, useEffect } from "react";
import {
  Users,
  CalendarDays,
  BriefcaseBusiness,
  Star,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  ExternalLink,
  Search,
  RefreshCw,
  X,
  Send,
  MessageSquare,
} from "lucide-react";
import useRoleAuth from "../useRoleAuth.js";
import { apiRequest } from "../../api.js";
import { useAlert } from "../../components/AlertProvider.jsx";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import Profile from "./Profile.jsx";
import Spinner from "../../components/Spinner.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";

export default function HiringManagerEntry() {
  const alert = useAlert();
  const { user, logout, isAuthenticated } = useRoleAuth("hiring_manager");

  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "pending" | "decisions" | "profile"
  const [search, setSearch] = useState("");

  const [metrics, setMetrics] = useState({
    openRoles: 0,
    pipelineCandidates: 0,
    interviewsThisWeek: 0,
  });

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [successNotice, setSuccessNotice] = useState("");

  // Review Modal State
  const [reviewCandidate, setReviewCandidate] = useState(null);
  const [decision, setDecision] = useState("select");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalMode, setModalMode] = useState("review"); // "review" | "view"

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  async function loadAllData() {
    setLoading(true);
    try {
      const [dashRes, candRes] = await Promise.allSettled([
        apiRequest("/dashboard/hiring-manager"),
        apiRequest("/hiring-manager/candidates?limit=100"),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value.data) {
        setMetrics(dashRes.value.data);
      }

      if (candRes.status === "fulfilled") {
        const list = candRes.value.data || [];
        setCandidates(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error("Failed to load HM data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadAllData();
  }

  // Open review modal
  function openReview(cand, mode = "review") {
    setReviewCandidate(cand);
    setModalMode(mode);
    setDecision(cand.hiringRecommendation?.status === "reject" ? "reject" : "select");
    setComments(cand.hiringRecommendation?.comments || "");
  }

  // Submit decision
  async function handleSubmitDecision(e) {
    e.preventDefault();
    if (!comments.trim()) {
      alert.toastError(
        "Comments Required",
        "Please provide decision comments explaining your recommendation."
      );
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest(`/hiring-manager/candidates/${reviewCandidate._id}/recommend`, {
        method: "POST",
        body: JSON.stringify({
          decision,
          comments: comments.trim(),
        }),
      });

      alert.toastSuccess(
        "Decision Submitted",
        `Candidate successfully marked as ${decision === "select" ? "Selected" : "Rejected"}.`
      );

      setReviewCandidate(null);
      await loadAllData();
    } catch (err) {
      alert.toastError("Submission Failed", err.message || "Failed to submit decision.");
    } finally {
      setSubmitting(false);
    }
  }

  // Candidates awaiting decision: application.status === "interview" and completed interview
  const pendingCandidates = candidates.filter((c) => {
    const isInterview = c.application?.status === "interview";
    const hasCompletedInterview =
      Array.isArray(c.interviews) &&
      c.interviews.some((iv) => iv.status === "completed");
    return isInterview && hasCompletedInterview;
  });

  // Candidates with decision made: application.status in ["selected", "rejected"]
  const decisionsMade = candidates.filter((c) => {
    const status = c.application?.status;
    return status === "selected" || status === "rejected";
  });

  const filterList = (list) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.position || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q)
    );
  };

  return (
    <div className="shell">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCandidates.length}
        decisionsCount={decisionsMade.length}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="main-shell md:ml-[260px]">
        <Topbar
          user={user}
          onOpenProfile={() => setActiveTab("profile")}
          logout={logout}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
        />

        <main className="content-area p-6 space-y-7 pb-20">
          {activeTab === "profile" ? (
            <Profile user={user} />
          ) : (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Hiring Manager Portal
                  </h1>
                  <p className="mt-1 text-xs text-slate-500">
                    Review completed interview assessments and make final candidate selections.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
                </button>
              </div>

              {/* TAB 1: DASHBOARD OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Stat cards: Open Roles, Candidates in Pipeline, Interviews This Week */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Open Roles</span>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <BriefcaseBusiness className="h-4 w-4" />
                        </div>
                      </div>
                      <p className="mt-3 text-2xl font-bold text-slate-900">
                        {metrics.openRoles ?? 0}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">Active hiring positions</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Candidates in Pipeline</span>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                          <Users className="h-4 w-4" />
                        </div>
                      </div>
                      <p className="mt-3 text-2xl font-bold text-slate-900">
                        {metrics.pipelineCandidates ?? candidates.length}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">Total applicants evaluated</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Interviews This Week</span>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                          <CalendarDays className="h-4 w-4" />
                        </div>
                      </div>
                      <p className="mt-3 text-2xl font-bold text-slate-900">
                        {metrics.interviewsThisWeek ?? 0}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">Completed or upcoming</p>
                    </div>
                  </div>

                  {/* Quick Action Banner */}
                  {pendingCandidates.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-amber-950">
                            {pendingCandidates.length} Candidate{pendingCandidates.length === 1 ? "" : "s"} Awaiting Final Selection
                          </h3>
                          <p className="text-xs text-amber-800 mt-0.5">
                            Interview feedback has been submitted. Review candidate scorecards to select or reject.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab("pending")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition shrink-0"
                      >
                        Review Pending Candidates →
                      </button>
                    </div>
                  )}

                  {/* Recent Activity Table */}
                  <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 p-5">
                      <h2 className="text-sm font-bold text-slate-900">
                        Candidates Awaiting Decision
                      </h2>
                      <button
                        type="button"
                        onClick={() => setActiveTab("pending")}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700"
                      >
                        View All ({pendingCandidates.length})
                      </button>
                    </div>

                    {loading ? (
                      <Spinner message="Loading candidates..." />
                    ) : pendingCandidates.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {pendingCandidates.slice(0, 5).map((cand) => {
                          const latestIv = cand.interviews?.[cand.interviews.length - 1] || {};
                          return (
                            <div
                              key={cand._id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-slate-50/60 transition"
                            >
                              <div className="min-w-0">
                                <h3 className="text-sm font-bold text-slate-900 truncate">
                                  {cand.name}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {cand.position || "Applicant"} · Round:{" "}
                                  <span className="font-semibold text-slate-700">
                                    {latestIv.roundName || "Interview"}
                                  </span>
                                </p>
                              </div>

                              <div className="flex items-center gap-3">
                                {latestIv.score !== undefined && (
                                  <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                                    Score: {latestIv.score}/100
                                  </span>
                                )}
                                {latestIv.rating && (
                                  <span className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                    {latestIv.rating}/5
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => openReview(cand, "review")}
                                  className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition"
                                >
                                  Review
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8">
                        <EmptyState
                          title="No pending decisions"
                          message="All evaluated candidates have been reviewed. New candidates will appear once interviewers complete their evaluations."
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: PENDING DECISIONS */}
              {activeTab === "pending" && (
                <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden space-y-4 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        Pending Decisions ({pendingCandidates.length})
                      </h2>
                      <p className="text-xs text-slate-500">
                        Candidates whose interviews are completed and are awaiting your selection decision.
                      </p>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search candidate or position..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {loading ? (
                    <Spinner message="Loading candidates..." />
                  ) : filterList(pendingCandidates).length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {filterList(pendingCandidates).map((cand) => {
                        const latestIv = cand.interviews?.[cand.interviews.length - 1] || {};
                        const interviewer = latestIv.interviewerId || {};
                        const interviewerName = interviewer.name || interviewer.email || "Interviewer";

                        return (
                          <div
                            key={cand._id}
                            className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-4 hover:bg-slate-50/60 transition rounded-xl px-3"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-900 truncate">
                                  {cand.name}
                                </h3>
                                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700">
                                  Interview Completed
                                </span>
                              </div>

                              <p className="text-xs text-slate-500 mt-1">
                                Position: <span className="font-semibold text-slate-700">{cand.position || "Applicant"}</span> · Round:{" "}
                                <span className="font-semibold text-slate-700">{latestIv.roundName || "Round 1"}</span>
                              </p>

                              <p className="text-[11px] text-slate-400 mt-1">
                                Interviewer: {interviewerName} · Email: {cand.email || "—"}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 self-end lg:self-auto">
                              {latestIv.score !== undefined && (
                                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                                  Score: {latestIv.score}/100
                                </span>
                              )}
                              {latestIv.rating && (
                                <span className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  {latestIv.rating}/5
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => openReview(cand, "review")}
                                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition"
                              >
                                Review Candidate
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState
                      title="No candidates found"
                      message="No candidates currently match this filter."
                    />
                  )}
                </div>
              )}

              {/* TAB 3: DECISIONS MADE */}
              {activeTab === "decisions" && (
                <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden space-y-4 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        Decisions Made ({decisionsMade.length})
                      </h2>
                      <p className="text-xs text-slate-500">
                        History of candidates you have evaluated and marked as Selected or Rejected.
                      </p>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search candidate or role..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {loading ? (
                    <Spinner message="Loading decisions history..." />
                  ) : filterList(decisionsMade).length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {filterList(decisionsMade).map((cand) => {
                        const isSelected =
                          cand.application?.status === "selected" ||
                          cand.hiringRecommendation?.status === "select";

                        return (
                          <div
                            key={cand._id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 hover:bg-slate-50/60 transition rounded-xl px-3"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-900 truncate">
                                  {cand.name}
                                </h3>
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                    isSelected
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-rose-100 text-rose-800"
                                  }`}
                                >
                                  {isSelected ? "Selected" : "Rejected"}
                                </span>
                              </div>

                              <p className="text-xs text-slate-500 mt-1">
                                Position: <span className="font-semibold text-slate-700">{cand.position || "Applicant"}</span> · Email: {cand.email || "—"}
                              </p>

                              {cand.hiringRecommendation?.comments && (
                                <p className="mt-2 text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                  "{cand.hiringRecommendation.comments}"
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => openReview(cand, "view")}
                              className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shrink-0 self-end sm:self-auto"
                            >
                              View Details
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState
                      title="No decisions recorded"
                      message="You haven't made any selection decisions yet."
                    />
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* REVIEW & DECISION MODAL */}
      {reviewCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl transition-all">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {modalMode === "review" ? "Review Candidate & Submit Decision" : "Candidate Evaluation Details"}
                </h3>
                <p className="text-xs text-slate-500">
                  {reviewCandidate.name} · {reviewCandidate.position || "Applicant"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewCandidate(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Candidate Info Grid */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Candidate</span>
                    <p className="font-bold text-slate-900 mt-0.5">{reviewCandidate.name}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Email</span>
                    <p className="font-bold text-slate-900 mt-0.5 truncate">{reviewCandidate.email}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Job Type</span>
                    <p className="font-bold text-slate-900 mt-0.5 capitalize">
                      {reviewCandidate.application?.jobType || "Full-time"}
                    </p>
                  </div>
                </div>

                {reviewCandidate.application?.resumeUrl && (
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Submitted Resume</span>
                    <a
                      href={reviewCandidate.application.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      View Resume PDF
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Interview Summary */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Interviewer Evaluations ({reviewCandidate.interviews?.length || 0})
                </h4>

                {reviewCandidate.interviews && reviewCandidate.interviews.length > 0 ? (
                  <div className="space-y-3">
                    {reviewCandidate.interviews.map((iv, idx) => {
                      const interviewer = iv.interviewerId || {};
                      const interviewerName = interviewer.name || interviewer.email || "Interviewer";

                      return (
                        <div
                          key={iv._id || idx}
                          className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-slate-900">
                                {iv.roundName || `Round ${idx + 1}`}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                Evaluator: <span className="font-medium text-slate-600">{interviewerName}</span>
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              {iv.score !== undefined && (
                                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                                  {iv.score}/100
                                </span>
                              )}
                              {iv.rating && (
                                <span className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                  {iv.rating}/5
                                </span>
                              )}
                            </div>
                          </div>

                          {iv.feedback && (
                            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700 leading-relaxed border border-slate-100">
                              <span className="font-semibold text-slate-500 block mb-1">Feedback:</span>
                              "{iv.feedback}"
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                    No completed interview feedback recorded yet.
                  </div>
                )}
              </div>

              {/* Decision Form or Read-only view */}
              {modalMode === "review" ? (
                <form onSubmit={handleSubmitDecision} className="space-y-4 pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Your Selection Decision
                  </h4>

                  {/* Decision Radio Options */}
                  <div className="grid grid-cols-2 gap-4">
                    <label
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${
                        decision === "select"
                          ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="decision"
                          value="select"
                          checked={decision === "select"}
                          onChange={() => setDecision("select")}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">Select Candidate</p>
                          <p className="text-[11px] text-slate-500">Approve for offer generation</p>
                        </div>
                      </div>
                    </label>

                    <label
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${
                        decision === "reject"
                          ? "border-rose-600 bg-rose-50/60 ring-2 ring-rose-500/20"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="decision"
                          value="reject"
                          checked={decision === "reject"}
                          onChange={() => setDecision("reject")}
                          className="h-4 w-4 text-rose-600 focus:ring-rose-500"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">Reject Candidate</p>
                          <p className="text-[11px] text-slate-500">Decline application</p>
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Comments textarea */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-800">
                      Recommendation Comments & Notes <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="e.g. Strong technical fit, excellent architectural knowledge, approved for offer..."
                      className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setReviewCandidate(null)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-xs transition disabled:opacity-50 ${
                        decision === "select"
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : "bg-rose-600 hover:bg-rose-700"
                      }`}
                    >
                      <Send className="h-3.5 w-3.5" />
                      {submitting ? "Submitting Decision..." : "Submit Decision"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Recorded Decision
                  </h4>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Decision Outcome:</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                          reviewCandidate.hiringRecommendation?.status === "select" ||
                          reviewCandidate.application?.status === "selected"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {reviewCandidate.hiringRecommendation?.status || reviewCandidate.application?.status}
                      </span>
                    </div>
                    {reviewCandidate.hiringRecommendation?.comments && (
                      <p className="text-xs text-slate-700 italic pt-1 leading-relaxed">
                        "{reviewCandidate.hiringRecommendation.comments}"
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setReviewCandidate(null)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
