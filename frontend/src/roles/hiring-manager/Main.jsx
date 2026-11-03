import { useState, useEffect } from "react";
import {
  Users, 
  CalendarDays, 
  BriefcaseBusiness, 
  ChevronRight, 
  Star, 
  CheckCircle2, 
  ThumbsUp, 
  ThumbsDown, 
  FileText, 
  AlertCircle, 
  Filter,
  Search,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import useRoleAuth from "../useRoleAuth.js";
import { apiRequest } from "../../api.js";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import Profile from "./Profile.jsx";

export default function HiringManagerEntry() {
  const { user, logout, isAuthenticated } = useRoleAuth("hiring_manager");

  // Navigation tabs
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    openRoles: 0,
    pipelineCandidates: 0,
    interviewsThisWeek: 0,
  });

  // Data states
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Selected candidate for Evaluation Modal
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateDetail, setCandidateDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [recommendDecision, setRecommendDecision] = useState("select");
  const [recommendComments, setRecommendComments] = useState("");
  const [submittingRecommend, setSubmittingRecommend] = useState(false);

  // Notifications dropdown
  const [showNotifications, setShowNotifications] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);

  function showProfile() {
    setActiveTab("profile");
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  async function loadAllData() {
    setLoading(true);
    setActionError(null);
    try {
      // 1. Fetch dashboard stats
      const dashRes = await apiRequest("/dashboard/hiring-manager");
      if (dashRes.data) {
        setMetrics(dashRes.data);
      }

      // 2. Fetch candidates
      const candRes = await apiRequest("/hiring-manager/candidates?limit=50");
      if (candRes.data) {
        setCandidates(candRes.data);
      }

    } catch (err) {
      console.error("Failed to load HM data:", err);
      setActionError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadAllData();
  }

  // Open candidate details & evaluation drawer/modal
  async function openCandidateEvaluation(cand) {
    setSelectedCandidate(cand);
    setCandidateDetail(null);
    setLoadingDetail(true);
    setRecommendDecision("select");
    setRecommendComments("");
    try {
      const res = await apiRequest(`/hiring-manager/candidates/${cand._id}`);
      setCandidateDetail(res.data);
    } catch (err) {
      console.error("Failed to load candidate details:", err);
      setActionError("Failed to fetch full candidate details: " + err.message);
    } finally {
      setLoadingDetail(false);
    }
  }

  // Submit Hiring Recommendation (Select / Reject with comments)
  async function handleSubmitRecommendation(e) {
    e.preventDefault();
    if (!recommendComments.trim()) {
      alert("Please enter evaluation comments before submitting.");
      return;
    }
    setSubmittingRecommend(true);
    setActionError(null);
    try {
      await apiRequest(`/hiring-manager/candidates/${selectedCandidate._id}/recommend`, {
        method: "POST",
        body: JSON.stringify({
          decision: recommendDecision,
          comments: recommendComments.trim(),
        }),
      });

      setActionMessage(`Recommendation recorded successfully: ${recommendDecision.toUpperCase()}`);
      setTimeout(() => setActionMessage(null), 4000);

      // Refresh modal detail and global candidates
      const updatedRes = await apiRequest(`/hiring-manager/candidates/${selectedCandidate._id}`);
      setCandidateDetail(updatedRes.data);
      loadAllData();
    } catch (err) {
      console.error("Error submitting recommendation:", err);
      alert("Failed to submit recommendation: " + err.message);
    } finally {
      setSubmittingRecommend(false);
    }
  }

  // Keep offer-approved candidates in the Offers tab instead of the overview.
  const filteredCandidates = candidates.filter((c) => {
    const hasCompletedInterview = Array.isArray(c.interviews) && c.interviews.some(
      (round) => round.status === "completed" || round.rating != null || round.score != null || round.feedback
    );
    const isSelectedForOffer =
      String(c.status || "").toLowerCase() === "selected" ||
      String(c.hiringRecommendation?.status || "").toLowerCase() === "select";
    if (isSelectedForOffer || !hasCompletedInterview) return false;

    const matchesSearch = 
      (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.position || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.department || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === "all" || 
      (c.status || "").toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const evaluatedCandidates = candidates
    .filter((candidate) => candidate.hiringRecommendation?.status)
    .sort(
      (a, b) =>
        new Date(b.hiringRecommendation.recommendedAt || 0) -
        new Date(a.hiringRecommendation.recommendedAt || 0)
    );

  return (
    <div className="shell">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        evaluatedCount={evaluatedCandidates.length}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="main-shell md:ml-[260px]">
        <Topbar
          user={user}
          onOpenProfile={showProfile}
          logout={logout}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
        />

        {activeTab === "profile" ? (
          <Profile user={user} />
        ) : (
        <main className="content-area">
          {actionMessage && (
            <div className="auth-success" role="status">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{actionMessage}</span>
            </div>
          )}

          {actionError && (
            <div className="auth-error" role="alert">
              <AlertCircle size={18} className="shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {activeTab === "overview" && (
            <>
              <section className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-top">
                    <span className="metric-label">Open Roles</span>
                    <span className="metric-icon-wrap indigo">
                      <BriefcaseBusiness size={18} />
                    </span>
                  </div>
                  <p className="metric-value">{metrics.openRoles}</p>
                  <p className="metric-trend">
                    <span>In your department</span>
                  </p>
                </div>

                <div className="metric-card">
                  <div className="metric-top">
                    <span className="metric-label">Pipeline Candidates</span>
                    <span className="metric-icon-wrap emerald">
                      <Users size={18} />
                    </span>
                  </div>
                  <p className="metric-value">{metrics.pipelineCandidates}</p>
                  <p className="metric-trend">
                    <span>Assigned to your team</span>
                  </p>
                </div>

                <div className="metric-card">
                  <div className="metric-top">
                    <span className="metric-label">Interviews This Week</span>
                    <span className="metric-icon-wrap purple">
                      <CalendarDays size={18} />
                    </span>
                  </div>
                  <p className="metric-value">{metrics.interviewsThisWeek}</p>
                  <p className="metric-trend">
                    <span>Scheduled rounds</span>
                  </p>
                </div>

              </section>
            </>
          )}

          {activeTab === "overview" && (
            <div className="card-box">
              <div className="card-box-header">
                <div>
                  <h2 className="card-box-title">Assigned Candidates</h2>
                  <p className="card-box-subtitle">Review interview feedback and submit hiring recommendations</p>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <div className="input-wrapper" style={{ width: "220px" }}>
                    <Search className="input-icon-left" size={14} />
                    <input
                      type="search"
                      className="form-input input-with-left-icon"
                      style={{ padding: "6px 10px 6px 34px", fontSize: "12px" }}
                      placeholder="Search candidates..."
                      aria-label="Search candidates"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                    />
                  </div>
                  <Filter size={14} style={{ color: "var(--muted-foreground)" }} />
                  <select
                    className="form-select"
                    style={{ width: "160px", padding: "6px 10px", fontSize: "12px" }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Stages</option>
                    <option value="applied">Applied</option>
                    <option value="screening">Screening</option>
                    <option value="interview">Interview</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="empty-state">
                  <p>Loading candidates data...</p>
                </div>
              ) : filteredCandidates.length === 0 ? (
                <div className="empty-state">
                  <Users className="empty-icon" />
                  <p className="empty-title">No candidates found</p>
                  <p className="empty-desc">
                    {searchQuery || statusFilter !== "all"
                      ? "Try adjusting your search criteria or stage filters."
                      : "There are currently no candidates assigned to your department."}
                  </p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Position & Team</th>
                        <th>Stage</th>
                        <th>Interview Rounds</th>
                        <th>Recommendation</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCandidates.map((cand) => {
                        const interviewCount = cand.interviews?.length || 0;
                        const completedInterviews = cand.interviews?.filter(i => i.rating != null).length || 0;
                        const recStatus = cand.hiringRecommendation?.status;

                        return (
                          <tr key={cand._id}>
                            <td>
                              <div>
                                <strong style={{ fontWeight: 600 }}>{cand.name}</strong>
                                <p style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>{cand.email}</p>
                              </div>
                            </td>
                            <td>
                              <div>
                                <span style={{ fontWeight: 500 }}>{cand.position}</span>
                                <p style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                                  {cand.department || "Engineering"} • {cand.source || "Direct"}
                                </p>
                              </div>
                            </td>
                            <td>
                              <span className={`status-pill ${(cand.status || "").toLowerCase()}`}>
                                {cand.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "12px", fontWeight: 500 }}>
                                  {completedInterviews}/{interviewCount} rounds evaluated
                                </span>
                              </div>
                            </td>
                            <td>
                              {recStatus ? (
                                <span className={`status-pill ${recStatus === "select" ? "selected" : "rejected"}`}>
                                  {recStatus === "select" ? "Selected by HM" : "Rejected by HM"}
                                </span>
                              ) : (
                                <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                                  Awaiting review
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                type="button"
                                className="btn-action-primary"
                                onClick={() => openCandidateEvaluation(cand)}
                              >
                                <span>Evaluate Candidate</span>
                                <ChevronRight size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}


          {/* TAB CONTENT: EVALUATION HISTORY */}
          {activeTab === "history" && (
            <div className="card-box">
              <div className="card-box-header">
                <div>
                  <h2 className="card-box-title">
                    Evaluation History <span className="text-slate-500">({evaluatedCandidates.length})</span>
                  </h2>
                  <p className="card-box-subtitle">Candidates you have evaluated and your recorded decisions</p>
                </div>
              </div>

              {loading ? (
                <div className="empty-state"><p>Loading evaluation history...</p></div>
              ) : evaluatedCandidates.length === 0 ? (
                <div className="empty-state">
                  <Users className="empty-icon" />
                  <p className="empty-title">No candidate evaluations yet</p>
                  <p className="empty-desc">Your completed candidate evaluations will appear here.</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Position & Team</th>
                        <th>Interview Evaluation</th>
                        <th>Decision</th>
                        <th>Evaluation Comments</th>
                        <th>Evaluated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluatedCandidates.map((candidate) => {
                        const latestRound = candidate.interviews?.[candidate.interviews.length - 1];
                        const decision = candidate.hiringRecommendation.status;

                        return (
                          <tr key={candidate._id}>
                            <td>
                              <strong>{candidate.name}</strong>
                              <p className="text-xs text-slate-500">{candidate.email || "—"}</p>
                            </td>
                            <td>
                              <span>{candidate.position || "—"}</span>
                              <p className="text-xs text-slate-500">{candidate.department || "Engineering"}</p>
                            </td>
                            <td>
                              <div className="flex flex-wrap items-center gap-2">
                                {latestRound?.score != null && (
                                  <span className="status-pill interview">Score: {latestRound.score}/100</span>
                                )}
                                {latestRound?.rating != null ? (
                                  <span className="text-xs font-semibold">{latestRound.rating}/5 stars</span>
                                ) : (
                                  <span className="text-xs text-slate-500">No rating</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className={`status-pill ${decision === "select" ? "selected" : "rejected"}`}>
                                {decision === "select" ? "Selected" : "Rejected"}
                              </span>
                            </td>
                            <td className="max-w-sm whitespace-normal">{candidate.hiringRecommendation.comments || "—"}</td>
                            <td>
                              {candidate.hiringRecommendation.recommendedAt
                                ? new Date(candidate.hiringRecommendation.recommendedAt).toLocaleDateString()
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </main>
        )}

      </div>

      {/* ============================================================
          CANDIDATE EVALUATION MODAL / DRAWER
          ============================================================ */}
      {selectedCandidate && (
        <div className="modal-overlay" onClick={() => setSelectedCandidate(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h3 className="modal-title">Candidate Evaluation & Feedback</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedCandidate(null)}
              >
                ✕
              </button>
            </header>

            <div className="modal-body">
              {loadingDetail ? (
                <div className="empty-state">
                  <p>Loading candidate details & interview assessments...</p>
                </div>
              ) : candidateDetail ? (
                <>
                  {/* Candidate Profile Summary */}
                  <div className="candidate-detail-header">
                    <div className="candidate-avatar">
                      {candidateDetail.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ fontSize: "18px", fontWeight: 700 }}>{candidateDetail.name}</h4>
                      <p style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
                        {candidateDetail.position} • {candidateDetail.department || "Engineering"}
                      </p>
                    </div>
                    <div style={{ marginLeft: "auto" }}>
                      <span className={`status-pill ${(candidateDetail.status || "").toLowerCase()}`}>
                        {candidateDetail.status}
                      </span>
                    </div>
                  </div>

                  {/* Metadata info */}
                  <div className="detail-info-grid">
                    <div className="detail-info-item">
                      <span className="detail-info-label">Email Address</span>
                      <span className="detail-info-val">{candidateDetail.email}</span>
                    </div>
                    <div className="detail-info-item">
                      <span className="detail-info-label">Phone</span>
                      <span className="detail-info-val">{candidateDetail.phone || "Not provided"}</span>
                    </div>
                    <div className="detail-info-item">
                      <span className="detail-info-label">Application Source</span>
                      <span className="detail-info-val">{candidateDetail.source || "Direct"}</span>
                    </div>
                    <div className="detail-info-item">
                      <span className="detail-info-label">Applied Date</span>
                      <span className="detail-info-val">
                        {new Date(candidateDetail.appliedDate || candidateDetail.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {candidateDetail.resumeUrl && (
                      <div className="detail-info-item">
                        <span className="detail-info-label">Resume</span>
                        <a
                          className="detail-info-val inline-flex items-center gap-1 text-blue-700 hover:underline"
                          href={candidateDetail.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View resume <ExternalLink size={13} />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Interview Rounds & Feedbacks */}
                  <div>
                    <h5 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <CalendarDays size={16} />
                      <span>Interview Rounds & Interviewer Ratings</span>
                    </h5>

                    {(!candidateDetail.interviews || candidateDetail.interviews.length === 0) ? (
                      <div className="empty-state" style={{ padding: "16px", background: "var(--secondary)", borderRadius: "var(--radius-md)" }}>
                        <p style={{ fontSize: "13px" }}>No interview rounds scheduled yet for this candidate.</p>
                      </div>
                    ) : (
                      <div className="rounds-timeline">
                        {candidateDetail.interviews.map((round, idx) => (
                          <div key={idx} className="round-card">
                            <div className="round-card-top">
                              <span style={{ fontWeight: 600, fontSize: "13px" }}>
                                {round.roundName || `Round ${round.round}`} · {round.status || "Scheduled"}
                              </span>
                              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
                                {round.score != null && (
                                  <span className="status-pill interview">
                                    Score: {round.score}/100
                                  </span>
                                )}
                                {round.rating != null ? (
                                  <div className="stars-row">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        size={14}
                                        className={`star-icon ${star <= round.rating ? "filled" : ""}`}
                                      />
                                    ))}
                                    <span style={{ fontSize: "12px", fontWeight: 700, marginLeft: "4px" }}>
                                      {round.rating}/5
                                    </span>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                                    No rating submitted yet
                                  </span>
                                )}
                              </div>
                            </div>

                            <p style={{ fontSize: "12px", color: "var(--muted-foreground)", marginBottom: "6px" }}>
                              Type: {round.interviewType || "Interview"} • Interviewer: {round.interviewerId?.name || "Assigned Panelist"} ({round.interviewerId?.email || "Panel"})
                              {round.scheduledAt && ` • Date: ${new Date(round.scheduledAt).toLocaleString()}`}
                            </p>

                            {round.feedback ? (
                              <div style={{
                                padding: "8px 12px",
                                background: "var(--secondary)",
                                borderRadius: "var(--radius-sm)",
                                fontSize: "12px",
                                color: "var(--foreground)",
                                fontStyle: "italic",
                                marginTop: "6px"
                              }}>
                                "{round.feedback}"
                              </div>
                            ) : (
                              <p style={{ fontSize: "11px", color: "var(--muted-foreground)", fontStyle: "italic" }}>
                                Feedback pending from interviewer.
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Past Recommendations if any */}
                  {candidateDetail.recommendations && candidateDetail.recommendations.length > 0 && (
                    <div>
                      <h5 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>
                        Previous Recommendations
                      </h5>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {candidateDetail.recommendations.map((rec, i) => (
                          <div key={i} style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                              <strong style={{ textTransform: "uppercase", color: rec.decision === "select" ? "#059669" : "#dc2626" }}>
                                {rec.decision}
                              </strong>
                              <span style={{ color: "var(--muted-foreground)" }}>
                                {new Date(rec.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p>{rec.comments}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendation Submission Form */}
                  <form onSubmit={handleSubmitRecommendation} style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
                    <h5 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px" }}>
                      Submit Hiring Manager Recommendation
                    </h5>

                    <div className="form-group" style={{ marginBottom: "12px" }}>
                      <label className="form-label">Decision</label>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <label style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px",
                          border: `1.5px solid ${recommendDecision === "select" ? "#10b981" : "var(--border)"}`,
                          borderRadius: "var(--radius-md)",
                          cursor: "pointer",
                          background: recommendDecision === "select" ? "#ecfdf5" : "#ffffff",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: recommendDecision === "select" ? "#065f46" : "var(--foreground)"
                        }}>
                          <input
                            type="radio"
                            name="decision"
                            value="select"
                            checked={recommendDecision === "select"}
                            onChange={() => setRecommendDecision("select")}
                          />
                          <ThumbsUp size={16} style={{ color: "#10b981" }} />
                          <span>Recommend Selection</span>
                        </label>

                        <label style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px",
                          border: `1.5px solid ${recommendDecision === "reject" ? "#ef4444" : "var(--border)"}`,
                          borderRadius: "var(--radius-md)",
                          cursor: "pointer",
                          background: recommendDecision === "reject" ? "#fef2f2" : "#ffffff",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: recommendDecision === "reject" ? "#991b1b" : "var(--foreground)"
                        }}>
                          <input
                            type="radio"
                            name="decision"
                            value="reject"
                            checked={recommendDecision === "reject"}
                            onChange={() => setRecommendDecision("reject")}
                          />
                          <ThumbsDown size={16} style={{ color: "#ef4444" }} />
                          <span>Recommend Rejection</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: "16px" }}>
                      <label className="form-label" htmlFor="eval-comments">
                        <span>Evaluation Notes & Justification</span>
                        <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>Required</span>
                      </label>
                      <textarea
                        id="eval-comments"
                        rows={3}
                        required
                        className="form-textarea"
                        placeholder="Provide detailed feedback on technical fit, seniority, and recommendation rationale..."
                        value={recommendComments}
                        onChange={(e) => setRecommendComments(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      className="auth-btn-primary"
                      disabled={submittingRecommend}
                    >
                      {submittingRecommend ? (
                        <span>Submitting Evaluation...</span>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Submit Hiring Decision</span>
                        </>
                      )}
                    </button>
                  </form>
                </>
              ) : null}
            </div>

            <footer className="modal-footer">
              <button
                type="button"
                className="btn-action-outline"
                onClick={() => setSelectedCandidate(null)}
              >
                Close
              </button>
            </footer>
          </div>
        </div>
      )}

    </div>
  );
}
