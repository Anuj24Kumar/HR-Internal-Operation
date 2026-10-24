import { useState, useEffect } from "react";
import { 
  Building2, 
  LayoutGrid, 
  CalendarDays, 
  CheckCircle2, 
  Clock, 
  Search, 
  Bell, 
  LogOut, 
  ChevronRight, 
  ChevronDown, 
  Star, 
  AlertCircle, 
  HelpCircle, 
  RefreshCw, 
  User, 
  MessageSquare, 
  Lock, 
  FileText, 
  Check, 
  Sparkles 
} from "lucide-react";
import useRoleAuth from "../useRoleAuth.js";
import { apiRequest } from "../../api.js";

const RATING_LABELS = {
  1: "1 - Does not meet requirements",
  2: "2 - Below expectations / partial fit",
  3: "3 - Meets job requirements",
  4: "4 - Strong hire / exceeds expectations",
  5: "5 - Exceptional candidate / top tier",
};

export default function InterviewerEntry() {
  const { user, logout, isAuthenticated } = useRoleAuth("interviewer");

  // Navigation & filter state
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'pending' | 'completed'
  const [searchQuery, setSearchQuery] = useState("");

  // Data states
  const [interviewList, setInterviewList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Selected round for submitting/updating feedback
  const [selectedRound, setSelectedRound] = useState(null);
  const [rating, setRating] = useState(4);
  const [feedback, setFeedback] = useState("");
  const [isUpdate, setIsUpdate] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  // Notifications dropdown
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadInterviews();
    }
  }, [isAuthenticated]);

  async function loadInterviews() {
    setLoading(true);
    setActionError(null);
    try {
      const res = await apiRequest("/interviewer/interviews?limit=50");
      if (res.data) {
        setInterviewList(res.data);
      }
    } catch (err) {
      console.error("Failed to load interviewer interviews:", err);
      setActionError("Failed to load interview rounds: " + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadInterviews();
  }

  // Open feedback dialog
  function openFeedbackModal(item) {
    setSelectedRound(item);
    const existingRating = item.interview.rating;
    const existingFeedback = item.interview.feedback;
    const alreadySubmitted = existingRating != null || Boolean(existingFeedback?.trim());

    setIsUpdate(alreadySubmitted);
    setRating(existingRating || 4);
    setFeedback(existingFeedback || "");
  }

  // Submit or update interview evaluation
  async function handleSubmitFeedback(e) {
    e.preventDefault();
    if (!feedback.trim()) {
      alert("Please provide detailed assessment feedback before submitting.");
      return;
    }

    setSubmittingFeedback(true);
    setActionError(null);

    const candId = selectedRound.candidate._id;
    const roundId = selectedRound.interview._id || selectedRound.interview.round;

    try {
      const method = isUpdate ? "PATCH" : "POST";
      const endpoint = `/candidates/${candId}/interviews/${roundId}/feedback`;

      await apiRequest(endpoint, {
        method,
        body: JSON.stringify({
          rating: Number(rating),
          feedback: feedback.trim(),
        }),
      });

      setActionMessage(
        isUpdate 
          ? "Interview assessment updated successfully." 
          : "Interview rating and feedback submitted successfully!"
      );
      setTimeout(() => setActionMessage(null), 4000);

      setSelectedRound(null);
      loadInterviews();
    } catch (err) {
      console.error("Feedback submission error:", err);
      alert("Failed to submit feedback: " + err.message);
    } finally {
      setSubmittingFeedback(false);
    }
  }

  // Derived metrics
  const totalRounds = interviewList.length;
  const pendingRounds = interviewList.filter(
    (i) => i.interview.rating == null && !i.interview.feedback?.trim()
  ).length;
  const completedRounds = totalRounds - pendingRounds;

  const filteredInterviews = interviewList.filter((item) => {
    const candName = item.candidate?.name || "";
    const pos = item.candidate?.position || "";
    const matchesSearch = 
      candName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pos.toLowerCase().includes(searchQuery.toLowerCase());

    const hasFeedback = item.interview.rating != null || Boolean(item.interview.feedback?.trim());

    if (activeTab === "pending") {
      return matchesSearch && !hasFeedback;
    }
    if (activeTab === "completed") {
      return matchesSearch && hasFeedback;
    }
    return matchesSearch;
  });

  return (
    <div className="shell">
      {/* SIDEBAR NAVIGATION MATCHING LOVABLE DESIGN */}
      <aside className="sidebar" aria-label="Interviewer Navigation">
        <a className="brand" href="#interviews" onClick={(e) => { e.preventDefault(); setActiveTab("all"); }}>
          <svg className="brand-mark" viewBox="0 0 32 36" fill="none" aria-hidden="true">
            <path d="M3 3h13c9 0 14 5 14 12s-5 12-14 12h-5v7H3V3Z" fill="currentColor" />
            <path d="M11 11h5c3 0 5 1 5 4s-2 4-5 4h-5v-8Z" fill="#111827" />
            <path d="M3 27h8v7H3z" fill="#818cf8" />
          </svg>
          <span>PeopleOps</span>
        </a>

        {/* Enterprise Workspace */}
        <div className="workspace">
          <span className="workspace-avatar">
            <Building2 size={18} />
          </span>
          <div className="workspace-info">
            <p className="workspace-title">Acme Corporation</p>
            <p className="workspace-subtitle">Interviewer Portal</p>
          </div>
          <ChevronDown size={14} style={{ color: "var(--sidebar-muted)", marginLeft: "auto" }} />
        </div>

        {/* Navigation Items */}
        <p className="nav-heading">WORKSPACE</p>
        <nav className="nav-group">
          <button
            type="button"
            className={`nav-link ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <span className="nav-link-content">
              <CalendarDays size={18} />
              <span>Assigned Interviews</span>
            </span>
            <span className="nav-badge">{totalRounds}</span>
          </button>

          <button
            type="button"
            className={`nav-link ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            <span className="nav-link-content">
              <Clock size={18} />
              <span>Pending Feedback</span>
            </span>
            {pendingRounds > 0 && (
              <span className="nav-badge alert">{pendingRounds}</span>
            )}
          </button>

          <button
            type="button"
            className={`nav-link ${activeTab === "completed" ? "active" : ""}`}
            onClick={() => setActiveTab("completed")}
          >
            <span className="nav-link-content">
              <CheckCircle2 size={18} />
              <span>Completed Reviews</span>
            </span>
            <span className="nav-badge">{completedRounds}</span>
          </button>
        </nav>

        <p className="nav-heading">ORGANIZATION</p>
        <nav className="nav-group">
          <a className="nav-link" href="#help" onClick={(e) => { e.preventDefault(); alert("Interviewer Guidelines & Criteria: Refer to Acme Engineering Rubric v2.4"); }}>
            <span className="nav-link-content">
              <HelpCircle size={18} />
              <span>Evaluation Rubric</span>
            </span>
          </a>
        </nav>

        {/* User Card at Bottom */}
        <div className="sidebar-bottom">
          <div className="user-snippet">
            <div className="user-avatar-circle" style={{ background: "#059669" }}>
              {(user?.name || "IV").slice(0, 2).toUpperCase()}
            </div>
            <div className="user-info-text">
              <p className="user-name-text">{user?.name || "David Chen"}</p>
              <p className="user-role-text">Technical Interviewer</p>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Log out"
              style={{ color: "var(--sidebar-muted)", padding: "4px" }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN SHELL */}
      <div className="main-shell">
        {/* TOPBAR */}
        <header className="topbar">
          <div className="search">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="search-input"
              placeholder="Search candidate name or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="search-key">⌘ K</span>
          </div>

          <div className="top-actions">
            <span className="role-tag-badge">
              <Sparkles size={14} />
              <span>Interviewer Panel</span>
            </span>

            <div style={{ position: "relative" }}>
              <button
                type="button"
                className="top-icon-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
              >
                <Bell size={18} />
                {pendingRounds > 0 && <span className="notification-dot"></span>}
              </button>

              {showNotifications && (
                <div style={{
                  position: "absolute",
                  right: 0,
                  top: "42px",
                  width: "280px",
                  background: "#ffffff",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-lg)",
                  padding: "12px",
                  zIndex: 50
                }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>Notifications</p>
                  {pendingRounds > 0 ? (
                    <div style={{ fontSize: "12px", color: "var(--foreground)" }}>
                      You have <strong>{pendingRounds} interview evaluation(s)</strong> awaiting rating and feedback.
                    </div>
                  ) : (
                    <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                      All assigned interview feedbacks have been submitted!
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="topbar-divider"></div>

            <button type="button" className="btn-logout" onClick={logout}>
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
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

          {/* PAGE HEADER */}
          <section className="page-header">
            <div>
              <h1 className="page-title">Interviews & Evaluations</h1>
              <p className="page-subtitle">
                Welcome back, {user?.name || "Interviewer"}. Conduct assessments, assign star ratings, and submit evaluation notes.
              </p>
            </div>
            <button
              type="button"
              className="btn-action-outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={14} className={refreshing ? "spin" : ""} />
              <span>{refreshing ? "Refreshing..." : "Sync Schedule"}</span>
            </button>
          </section>

          {/* METRIC STATS CARDS */}
          <section className="metrics-grid">
            <div className="metric-card">
              <div className="metric-top">
                <span className="metric-label">Assigned Rounds</span>
                <span className="metric-icon-wrap indigo">
                  <CalendarDays size={18} />
                </span>
              </div>
              <p className="metric-value">{totalRounds}</p>
              <p className="metric-trend">
                <span>Total interviews assigned</span>
              </p>
            </div>

            <div className="metric-card">
              <div className="metric-top">
                <span className="metric-label">Pending Feedback</span>
                <span className="metric-icon-wrap amber">
                  <Clock size={18} />
                </span>
              </div>
              <p className="metric-value" style={{ color: pendingRounds > 0 ? "#d97706" : "inherit" }}>
                {pendingRounds}
              </p>
              <p className="metric-trend" style={{ color: pendingRounds > 0 ? "#d97706" : "inherit" }}>
                <span>{pendingRounds > 0 ? "Awaiting your rating" : "All ratings complete"}</span>
              </p>
            </div>

            <div className="metric-card">
              <div className="metric-top">
                <span className="metric-label">Submitted Reviews</span>
                <span className="metric-icon-wrap emerald">
                  <CheckCircle2 size={18} />
                </span>
              </div>
              <p className="metric-value">{completedRounds}</p>
              <p className="metric-trend">
                <span>Evaluations logged</span>
              </p>
            </div>
          </section>

          {/* TAB NAVIGATION */}
          <div className="tabs-nav">
            <button
              type="button"
              className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              <CalendarDays size={16} />
              <span>All Assigned Interviews</span>
              <span className="tab-count-badge">{interviewList.length}</span>
            </button>

            <button
              type="button"
              className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
              onClick={() => setActiveTab("pending")}
            >
              <Clock size={16} />
              <span>Needs Feedback</span>
              {pendingRounds > 0 && (
                <span className="tab-count-badge" style={{ background: "#fef3c7", color: "#92400e" }}>
                  {pendingRounds}
                </span>
              )}
            </button>

            <button
              type="button"
              className={`tab-btn ${activeTab === "completed" ? "active" : ""}`}
              onClick={() => setActiveTab("completed")}
            >
              <CheckCircle2 size={16} />
              <span>Completed</span>
              <span className="tab-count-badge">{completedRounds}</span>
            </button>
          </div>

          {/* DATA TABLE */}
          <div className="card-box">
            <div className="card-box-header">
              <div>
                <h2 className="card-box-title">Interview Schedule & Feedback</h2>
                <p className="card-box-subtitle">Review candidate profile and submit your evaluation</p>
              </div>
            </div>

            {loading ? (
              <div className="empty-state">
                <p>Loading assigned interview rounds...</p>
              </div>
            ) : filteredInterviews.length === 0 ? (
              <div className="empty-state">
                <CalendarDays className="empty-icon" />
                <p className="empty-title">No interviews found</p>
                <p className="empty-desc">
                  {searchQuery 
                    ? "No scheduled interviews match your search query." 
                    : "You currently have no interview rounds assigned to you."}
                </p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Target Position</th>
                      <th>Round #</th>
                      <th>Scheduled Date</th>
                      <th>Rating & Status</th>
                      <th style={{ textAlign: "right" }}>Assessment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInterviews.map((item, idx) => {
                      const { candidate, interview } = item;
                      const hasFeedback = interview.rating != null;
                      const isLocked = interview.lockedAt || interview.feedbackLocked;

                      return (
                        <tr key={interview._id || idx}>
                          <td>
                            <div>
                              <strong style={{ fontWeight: 600 }}>{candidate?.name || "Candidate"}</strong>
                              <p style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                                {candidate?.email}
                              </p>
                            </div>
                          </td>
                          <td>
                            <div>
                              <span style={{ fontWeight: 500 }}>{candidate?.position}</span>
                              <p style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                                {candidate?.department || "Engineering"}
                              </p>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, fontSize: "13px" }}>
                              Round {interview.round}
                            </span>
                          </td>
                          <td style={{ fontSize: "12px" }}>
                            {interview.scheduledAt 
                              ? new Date(interview.scheduledAt).toLocaleDateString(undefined, { 
                                  month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" 
                                })
                              : "TBD"}
                          </td>
                          <td>
                            {hasFeedback ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <div className="stars-row">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      size={14}
                                      className={`star-icon ${star <= interview.rating ? "filled" : ""}`}
                                    />
                                  ))}
                                </div>
                                <span style={{ fontSize: "12px", fontWeight: 700 }}>
                                  {interview.rating}/5
                                </span>
                              </div>
                            ) : (
                              <span className="status-pill pending">
                                Feedback Pending
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className={hasFeedback ? "btn-action-outline" : "btn-action-primary"}
                              disabled={isLocked}
                              onClick={() => openFeedbackModal(item)}
                            >
                              {isLocked ? (
                                <>
                                  <Lock size={13} />
                                  <span>Locked</span>
                                </>
                              ) : hasFeedback ? (
                                <>
                                  <MessageSquare size={13} />
                                  <span>Edit Feedback</span>
                                </>
                              ) : (
                                <>
                                  <Star size={13} />
                                  <span>Submit Rating</span>
                                </>
                              )}
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
        </main>

        {/* FOOTER MATCHING LOVABLE */}
        <footer className="shell-footer">
          <span>People first. Everything else follows.</span>
          <div className="system-status">
            <span className="system-status-dot"></span>
            <span>All systems operational</span>
          </div>
        </footer>
      </div>

      {/* ============================================================
          FEEDBACK SUBMISSION MODAL
          ============================================================ */}
      {selectedRound && (
        <div className="modal-overlay" onClick={() => setSelectedRound(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h3 className="modal-title">
                {isUpdate ? "Update Interview Evaluation" : "Submit Interview Assessment"}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedRound(null)}
              >
                ✕
              </button>
            </header>

            <form onSubmit={handleSubmitFeedback}>
              <div className="modal-body">
                {/* Candidate Overview Banner */}
                <div className="candidate-detail-header">
                  <div className="candidate-avatar" style={{ background: "#ecfdf5", color: "#059669" }}>
                    {(selectedRound.candidate?.name || "C").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ fontSize: "17px", fontWeight: 700 }}>{selectedRound.candidate?.name}</h4>
                    <p style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
                      {selectedRound.candidate?.position} • Round {selectedRound.interview.round}
                    </p>
                  </div>
                  <div style={{ marginLeft: "auto", textAlign: "right" }}>
                    <span className="status-pill interview">In Interview</span>
                  </div>
                </div>

                {/* Candidate details (PII & Salary stripped as per PRD) */}
                <div className="detail-info-grid">
                  <div className="detail-info-item">
                    <span className="detail-info-label">Candidate Email</span>
                    <span className="detail-info-val">{selectedRound.candidate?.email || "—"}</span>
                  </div>
                  <div className="detail-info-item">
                    <span className="detail-info-label">Phone</span>
                    <span className="detail-info-val">{selectedRound.candidate?.phone || "—"}</span>
                  </div>
                  <div className="detail-info-item">
                    <span className="detail-info-label">Source</span>
                    <span className="detail-info-val">{selectedRound.candidate?.source || "Direct"}</span>
                  </div>
                  <div className="detail-info-item">
                    <span className="detail-info-label">Interview Date</span>
                    <span className="detail-info-val">
                      {new Date(selectedRound.interview.scheduledAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* 5-STAR INTERACTIVE RATING SELECTOR */}
                <div className="form-group">
                  <label className="form-label">
                    <span>Performance Rating (1 to 5 Stars)</span>
                    <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>Required</span>
                  </label>

                  <div className="interactive-stars">
                    {[1, 2, 3, 4, 5].map((starValue) => {
                      const isFilled = (hoverRating || rating) >= starValue;
                      return (
                        <button
                          key={starValue}
                          type="button"
                          className="star-select-btn"
                          onMouseEnter={() => setHoverRating(starValue)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(starValue)}
                        >
                          <Star
                            size={28}
                            className={`star-icon ${isFilled ? "filled" : ""}`}
                          />
                        </button>
                      );
                    })}

                    <span className="rating-descriptor">
                      {RATING_LABELS[hoverRating || rating]}
                    </span>
                  </div>
                </div>

                {/* FEEDBACK COMMENTS TEXTAREA */}
                <div className="form-group">
                  <label className="form-label" htmlFor="feedback-text">
                    <span>Detailed Evaluation & Technical Notes</span>
                    <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>Required</span>
                  </label>
                  <textarea
                    id="feedback-text"
                    rows={4}
                    required
                    className="form-textarea"
                    placeholder="Assess technical depth, problem-solving, architectural thinking, strengths, and areas of concern..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>
              </div>

              <footer className="modal-footer">
                <button
                  type="button"
                  className="btn-action-outline"
                  onClick={() => setSelectedRound(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="auth-btn-primary"
                  style={{ width: "auto", margin: 0 }}
                  disabled={submittingFeedback}
                >
                  {submittingFeedback ? (
                    <span>Submitting Assessment...</span>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>{isUpdate ? "Save Changes" : "Submit Evaluation"}</span>
                    </>
                  )}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
