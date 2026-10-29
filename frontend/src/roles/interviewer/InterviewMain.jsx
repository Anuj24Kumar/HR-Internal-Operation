import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Lock,
  MessageSquare,
  MessageSquareCheck,
  RefreshCw,
  Star,
} from "lucide-react";

const TAB_DETAILS = {
  assigned: {
    title: "Assigned Interviews",
    description: "All interview rounds assigned to you.",
    emptyMessage: "You currently have no interviews assigned to you.",
  },
  completed: {
    title: "Completed Interviews",
    description: "Submit or update feedback for completed interviews.",
    emptyMessage: "You have no completed interviews yet.",
  },
  "feedback-completed": {
    title: "Feedback Completed",
    description: "Review submitted interview feedback.",
    emptyMessage: "You have not submitted any interview feedback yet.",
  },
};

export default function InterviewMain({
  user,
  actionMessage,
  actionError,
  handleRefresh,
  refreshing,
  totalRounds,
  pendingInterviewRounds,
  completedInterviewRounds,
  pendingFeedbackRounds,
  feedbackCompletedRounds,
  activeTab,
  loading,
  filteredInterviews,
  openFeedbackModal,
}) {
  const isDashboard = activeTab === "dashboard";
  const tabDetails = TAB_DETAILS[activeTab];

  return (
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

      <section className="page-header">
        <div>
          <h1 className="page-title">
            {isDashboard ? "Dashboard" : tabDetails.title}
          </h1>
          <p className="page-subtitle">
            {isDashboard
              ? `Welcome back, ${user?.name || "Interviewer"}. Here is your interview overview.`
              : tabDetails.description}
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

      {isDashboard ? (
        <section className="metrics-grid" aria-label="Interview summary">
          <div className="metric-card">
            <div className="metric-top">
              <span className="metric-label">Total Assigned Interviews</span>
              <span className="metric-icon-wrap indigo">
                <CalendarDays size={18} />
              </span>
            </div>
            <p className="metric-value">{totalRounds}</p>
            <p className="metric-trend"><span>All assigned rounds</span></p>
          </div>

          <div className="metric-card">
            <div className="metric-top">
              <span className="metric-label">Pending Interviews</span>
              <span className="metric-icon-wrap amber">
                <Clock size={18} />
              </span>
            </div>
            <p className="metric-value">{pendingInterviewRounds}</p>
            <p className="metric-trend"><span>Scheduled or upcoming</span></p>
          </div>

          <div className="metric-card">
            <div className="metric-top">
              <span className="metric-label">Completed Interviews</span>
              <span className="metric-icon-wrap emerald">
                <CheckCircle2 size={18} />
              </span>
            </div>
            <p className="metric-value">{completedInterviewRounds}</p>
            <p className="metric-trend"><span>Interview rounds completed</span></p>
          </div>

          <div className="metric-card">
            <div className="metric-top">
              <span className="metric-label">Pending Feedback</span>
              <span className="metric-icon-wrap amber">
                <MessageSquare size={18} />
              </span>
            </div>
            <p className="metric-value">{pendingFeedbackRounds}</p>
            <p className="metric-trend"><span>Awaiting your evaluation</span></p>
          </div>

          <div className="metric-card">
            <div className="metric-top">
              <span className="metric-label">Feedback Completed</span>
              <span className="metric-icon-wrap emerald">
                <MessageSquareCheck size={18} />
              </span>
            </div>
            <p className="metric-value">{feedbackCompletedRounds}</p>
            <p className="metric-trend"><span>Feedback submitted</span></p>
          </div>
        </section>
      ) : (
        <div className="card-box">
          <div className="card-box-header">
            <div>
              <h2 className="card-box-title">{tabDetails.title}</h2>
              <p className="card-box-subtitle">{tabDetails.description}</p>
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
              <p className="empty-desc">{tabDetails.emptyMessage}</p>
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
                    <th>Interview Status</th>
                    {activeTab !== "assigned" && (
                      <th>
                        {activeTab === "feedback-completed" ? "Feedback Details" : "Rating & Feedback"}
                      </th>
                    )}
                    {activeTab === "completed" && (
                      <th style={{ textAlign: "right" }}>Assessment</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredInterviews.map((item, index) => {
                    const { candidate, interview } = item;
                    const hasFeedback =
                      interview.rating != null || Boolean(interview.feedback?.trim());
                    const isLocked = interview.lockedAt || interview.feedbackLocked;
                    const canSubmitFeedback = interview.status === "completed" || hasFeedback;

                    return (
                      <tr key={interview._id || index}>
                        <td>
                          <div>
                            <strong style={{ fontWeight: 600 }}>
                              {candidate?.name || "Candidate"}
                            </strong>
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
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "TBD"}
                        </td>
                        <td>
                          <span
                            className={`status-pill ${
                              interview.status === "completed" ? "interview" : "pending"
                            }`}
                          >
                            {interview.status === "completed"
                              ? "Completed"
                              : interview.status === "cancelled"
                                ? "Cancelled"
                                : "Scheduled"}
                          </span>
                        </td>
                        {activeTab !== "assigned" && (
                          <td>
                            {activeTab === "feedback-completed" ? (
                              <div>
                                {interview.rating != null && (
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <div className="stars-row">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          size={14}
                                          className={`star-icon ${
                                            star <= interview.rating ? "filled" : ""
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span style={{ fontSize: "12px", fontWeight: 700 }}>
                                      {interview.rating}/5
                                    </span>
                                  </div>
                                )}
                                <p style={{ marginTop: "6px", fontSize: "12px", whiteSpace: "pre-wrap" }}>
                                  {interview.feedback}
                                </p>
                                {interview.feedbackSubmittedAt && (
                                  <p style={{ marginTop: "4px", fontSize: "11px", color: "var(--muted-foreground)" }}>
                                    Submitted {new Date(interview.feedbackSubmittedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            ) : interview.rating != null ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <div className="stars-row">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      size={14}
                                      className={`star-icon ${
                                        star <= interview.rating ? "filled" : ""
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span style={{ fontSize: "12px", fontWeight: 700 }}>
                                  {interview.rating}/5
                                </span>
                              </div>
                            ) : hasFeedback ? (
                              <span className="status-pill interview">Feedback Submitted</span>
                            ) : (
                              <span className="status-pill pending">Feedback Pending</span>
                            )}
                          </td>
                        )}
                        {activeTab === "completed" && (
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className={hasFeedback ? "btn-action-outline" : "btn-action-primary"}
                              disabled={isLocked || !canSubmitFeedback}
                              onClick={() => openFeedbackModal(item)}
                            >
                              {isLocked ? (
                                <>
                                  <Lock size={13} />
                                  <span>Locked</span>
                                </>
                              ) : !canSubmitFeedback ? (
                                <>
                                  <Clock size={13} />
                                  <span>Interview Pending</span>
                                </>
                              ) : hasFeedback ? (
                                <>
                                  <MessageSquare size={13} />
                                  <span>Edit Feedback</span>
                                </>
                              ) : (
                                <>
                                  <Star size={13} />
                                  <span>Submit Feedback</span>
                                </>
                              )}
                            </button>
                          </td>
                        )}
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
  );
}
