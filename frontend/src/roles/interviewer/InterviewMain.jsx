import { Fragment, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Lock,
  MessageSquare,
  MessageSquareCheck,
  RefreshCw,
  Star,
  Video,
} from "lucide-react";

const TAB_DETAILS = {
  completed: {
    title: "Completed Interviews",
    description: "Completed interviews awaiting your feedback, followed by feedback you have submitted.",
    emptyMessage: "You have no completed interviews yet.",
  },
};

function ApplicantInterviewDetails({
  item,
  onCompleteInterview,
}) {
  const { candidate, interview } = item;
  const status = String(interview.status || "scheduled").toLowerCase();
  const canComplete = status === "scheduled" || status === "rescheduled";

  return (
    <div className="grid gap-6 rounded-xl border border-blue-100 bg-blue-50/40 p-5 sm:grid-cols-2">
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Applicant details
        </h3>
        <p><span className="text-slate-500">Name: </span><strong>{candidate?.name || "—"}</strong></p>
        <p><span className="text-slate-500">Email: </span>{candidate?.email || "—"}</p>
        <p><span className="text-slate-500">Phone: </span>{candidate?.phone || "—"}</p>
        <p><span className="text-slate-500">Applied role: </span>{candidate?.position || "—"}</p>
        <p><span className="text-slate-500">Department: </span>{candidate?.department || "—"}</p>
        <p><span className="text-slate-500">Application source: </span>
          {candidate?.applicationSource || candidate?.source || "—"}
        </p>
        {candidate?.resumeUrl && (
          <a
            href={candidate.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:underline"
          >
            View resume <ExternalLink size={14} />
          </a>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Interview details
        </h3>
        <p><span className="text-slate-500">Round: </span>
          {interview.roundName || `Round ${interview.round || "—"}`}
        </p>
        <p><span className="text-slate-500">Type: </span>
          <span className="capitalize">{interview.interviewType || "Technical"}</span>
        </p>
        <p><span className="text-slate-500">Scheduled for: </span>
          {interview.scheduledAt
            ? new Date(interview.scheduledAt).toLocaleString()
            : "Not scheduled"}
        </p>
        <p><span className="text-slate-500">Status: </span>
          <span className="font-semibold capitalize">{status}</span>
        </p>
        {interview.meetingLink ? (
          <div className="space-y-2">
            <p className="break-all text-sm">
              <span className="text-slate-500">Meeting link: </span>
              <a
                href={interview.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900"
              >
                {interview.meetingLink}
              </a>
            </p>
            <a
              href={interview.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Video size={15} /> Join interview <ExternalLink size={14} />
            </a>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No interview link provided.</p>
        )}
        {canComplete && (
          <button
            type="button"
            onClick={() => onCompleteInterview(item)}
            className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <CheckCircle2 size={15} />
            Mark as completed
          </button>
        )}
      </section>
    </div>
  );
}

export default function InterviewMain({
  actionMessage,
  actionError,
  handleRefresh,
  refreshing,
  totalRounds,
  pendingInterviewRounds,
  completedInterviewRounds,
  pendingFeedbackRounds,
  feedbackCompletedRounds,
  completedFeedbackInterviews,
  activeTab,
  loading,
  filteredInterviews,
  openFeedbackModal,
  onCompleteInterview,
}) {
  const [selectedInterviewId, setSelectedInterviewId] = useState(null);
  const isDashboard = activeTab === "dashboard";
  const tabDetails = TAB_DETAILS[activeTab];

  return (
    <>
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

      {!isDashboard && (
        <section className="page-header">
          <div>
            <h1 className="page-title">{tabDetails.title}</h1>
            <p className="page-subtitle">{tabDetails.description}</p>
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
      )}

      {isDashboard ? (
        <>
        <section className="metrics-grid interviewer-dashboard-metrics" aria-label="Interview summary">
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

        <section className="card-box interviewer-dashboard-applicants" aria-labelledby="assigned-applicants-title">
          <div className="card-box-header">
            <div>
              <h2 className="card-box-title" id="assigned-applicants-title">Applicants Assigned to You</h2>
              <p className="card-box-subtitle">Candidate details for your assigned interview rounds.</p>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <p>Loading assigned applicants...</p>
            </div>
          ) : filteredInterviews.length === 0 ? (
            <div className="empty-state">
              <CalendarDays className="empty-icon" />
              <p className="empty-title">No assigned applicants yet</p>
              <p className="empty-desc">Applicants assigned to your interview rounds will appear here.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Applied Role</th>
                    <th>Phone</th>
                    <th>Interview Round</th>
                    <th>Scheduled Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterviews.map((item, index) => {
                    const { candidate, interview } = item;
                    const interviewId = String(interview._id || index);
                    const isExpanded = selectedInterviewId === interviewId;

                    return (
                      <Fragment key={interviewId}>
                      <tr>
                        <td>
                          <div>
                            <strong style={{ fontWeight: 600 }}>
                              {candidate?.name || "Candidate"}
                            </strong>
                            {candidate?.email && (
                              <p style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                                {candidate.email}
                              </p>
                            )}
                          </div>
                        </td>
                        <td>{candidate?.position || "Not specified"}</td>
                        <td>{candidate?.phone || "—"}</td>
                        <td>{interview.roundName || `Round ${interview.round || "—"}`}</td>
                        <td style={{ fontSize: "12px" }}>
                          {interview.scheduledAt
                            ? new Date(interview.scheduledAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Not scheduled"}
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
                                : interview.status === "rescheduled"
                                  ? "Rescheduled"
                                  : "Scheduled"}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                            aria-expanded={isExpanded}
                            onClick={() =>
                              setSelectedInterviewId((current) =>
                                current === interviewId ? null : interviewId
                              )
                            }
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            {isExpanded ? "Hide details" : "View details"}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="!whitespace-normal !p-4">
                            <ApplicantInterviewDetails
                              item={item}
                              onCompleteInterview={onCompleteInterview}
                            />
                          </td>
                        </tr>
                      )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
        </>
      ) : (
        <>
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
              <p className="empty-title">No interviews awaiting feedback</p>
              <p className="empty-desc">
                Completed rounds with submitted feedback are listed below.
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
                    <th>Interview Status</th>
                    <th>
                      Rating & Feedback
                    </th>
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
                            {interview.roundName || `Round ${interview.round || "—"}`}
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
                        <td>
                          {interview.rating != null ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "6px" }}>
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
                              {interview.score != null && (
                                <span style={{ fontSize: "12px", fontWeight: 700 }}>
                                  Score: {interview.score}/100
                                </span>
                              )}
                            </div>
                          ) : hasFeedback ? (
                            <span className="status-pill interview">Feedback Submitted</span>
                          ) : (
                            <span className="status-pill pending">Feedback Pending</span>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="btn-action-primary"
                            disabled={isLocked || !canSubmitFeedback}
                            onClick={() => openFeedbackModal(item)}
                          >
                            {isLocked ? (
                              <>
                                <Lock size={13} />
                                <span>Locked</span>
                              </>
                            ) : (
                              <>
                                <Star size={13} />
                                <span>{hasFeedback ? "Edit Feedback" : "Submit Feedback"}</span>
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

        <section className="card-box mt-6">
              <div className="card-box-header">
                <div>
                  <h2 className="card-box-title">
                    Feedback Completed <span className="text-slate-500">({feedbackCompletedRounds})</span>
                  </h2>
                  <p className="card-box-subtitle">Interview evaluations you have submitted</p>
                </div>
              </div>

              {loading ? (
                <div className="empty-state"><p>Loading submitted feedback...</p></div>
              ) : completedFeedbackInterviews.length === 0 ? (
                <div className="empty-state">
                  <MessageSquareCheck className="empty-icon" />
                  <p className="empty-title">No feedback submitted yet</p>
                  <p className="empty-desc">Completed interview feedback will appear here after submission.</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Target Position</th>
                        <th>Round</th>
                        <th>Interview Date</th>
                        <th>Rating & Score</th>
                        <th>Feedback</th>
                        <th>Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedFeedbackInterviews.map(({ candidate, interview }, index) => (
                        <tr key={interview._id || index}>
                          <td>
                            <strong>{candidate?.name || "Candidate"}</strong>
                            <p className="text-xs text-slate-500">{candidate?.email || "—"}</p>
                          </td>
                          <td>{candidate?.position || "—"}</td>
                          <td>{interview.roundName || `Round ${interview.round || "—"}`}</td>
                          <td>
                            {interview.scheduledAt
                              ? new Date(interview.scheduledAt).toLocaleDateString()
                              : "—"}
                          </td>
                          <td>
                            <div className="flex flex-col gap-1">
                              {interview.rating != null && <span>{interview.rating}/5 stars</span>}
                              {interview.score != null && <span>{interview.score}/100</span>}
                            </div>
                          </td>
                          <td className="max-w-sm whitespace-normal">{interview.feedback || "—"}</td>
                          <td>
                            {interview.feedbackSubmittedAt
                              ? new Date(interview.feedbackSubmittedAt).toLocaleDateString()
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
        </>
      )}
    </main>
    </>
  );
}
