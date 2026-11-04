import { useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Download,
  ExternalLink,
  FileText,
  Hash,
  Mail,
  Phone,
  User,
  Video,
  CalendarDays,
} from "lucide-react";
import ApplicationStatusBadge from "./ApplicationStatusBadge.jsx";
import ApplicationTimeline from "./ApplicationTimeline.jsx";

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ApplicationDetailView({ application, onBack }) {
  const [copied, setCopied] = useState(false);

  if (!application) return null;

  const position = application.position || "Position not specified";
  const jobType = application.jobType || "Full-time";
  const status = application.status || "Applied";
  const candidateName = application.candidateName || "Candidate";
  const candidateEmail = application.email || "—";
  const candidatePhone = application.phone || "Not provided";
  const candidateId = application.candidateId?._id || application.candidateId || "—";
  const applicationId = application._id || application.id || "—";
  const appliedDate = formatDate(application.appliedAt || application.createdAt);

  const rawTimelineEvents = Array.isArray(application.timeline) ? application.timeline : [];
  const STAGE_CONFIG = [
    {
      stage: "Applied",
      title: "Application Submitted",
      description: `Application for ${position} (${jobType}) submitted successfully.`,
    },
    {
      stage: "Interview",
      title: "Interview Scheduled",
      description: "Technical assessment and HR evaluation rounds.",
    },
    {
      stage: "Selected",
      title: "Candidate Selected",
      description: "Candidate selection and employment/internship letter issuance.",
    },
    {
      stage: "Offer",
      title: "Final Decision & Offer",
      description: "Official employment offer letter issuance and onboarding.",
    },
  ];

  const normalizedStatus = String(status || "applied").toLowerCase();
  const stageStatusIndex = {
    applied: 0,
    interview: 1,
    interviewed: 1,
    selected: 2,
    offer: 3,
    offer_sent: 3,
    accepted: 3,
  }[normalizedStatus] ?? 0;

  const timelineEvents = STAGE_CONFIG.map((cfg, idx) => {
    const existing = rawTimelineEvents.find((evt) => {
      const s = String(evt.stage || "").toLowerCase();
      const t = String(evt.title || "").toLowerCase();
      if (s.includes("screening") || t.includes("screening")) return false;
      return s === cfg.stage.toLowerCase() || t.includes(cfg.stage.toLowerCase());
    });

    const isCompleted = idx <= stageStatusIndex || existing?.completed || (idx === 0);
    const date = existing?.date || (idx === 0 ? (application.appliedAt || application.createdAt) : null);

    return {
      _id: existing?._id || cfg.stage,
      stage: cfg.stage,
      title: existing?.title && !existing.title.toLowerCase().includes("screening") ? existing.title : cfg.title,
      description: existing?.description && !existing.description.toLowerCase().includes("screening") ? existing.description : cfg.description,
      completed: isCompleted,
      date,
    };
  });

  const handleCopyId = () => {
    if (applicationId && applicationId !== "—") {
      navigator.clipboard.writeText(applicationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>

      {/* Main Header Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <div>
          {/* Top Row: Type and Status Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
              <Briefcase className="h-3.5 w-3.5" />
              {jobType}
            </span>
            <ApplicationStatusBadge status={status} />
          </div>

          {/* Position Title */}
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {position}
          </h1>

          {/* Redesigned Applied Date and Application ID Cards */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* Applied Date Card */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/90 bg-slate-50/80 p-3.5 transition hover:bg-slate-50">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Applied Date
                </p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900 truncate">
                  {appliedDate}
                </p>
              </div>
            </div>

            {/* Application ID Card */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/90 bg-slate-50/80 p-3.5 transition hover:bg-slate-50">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <Hash className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Application ID
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 transition"
                    title="Copy Application ID"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 text-slate-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p
                  className="mt-0.5 font-mono text-xs font-semibold text-slate-800 truncate"
                  title={applicationId}
                >
                  {applicationId}
                </p>
              </div>
            </div>

            {/* Candidate ID Card */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/90 bg-slate-50/80 p-3.5 transition hover:bg-slate-50">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Candidate ID
                </p>
                <p className="mt-0.5 font-mono text-xs font-semibold text-slate-800 truncate" title={candidateId}>
                  {candidateId}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Progress Timeline */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <div className="border-b border-slate-100 pb-5">
          <h2 className="text-lg font-bold text-slate-900">Application Progress</h2>
          <p className="mt-1 text-sm text-slate-500">
            Real-time status updates and recruitment stages for this application.
          </p>
        </div>

        <div className="mt-6">
          <ApplicationTimeline status={status} />
        </div>

        {timelineEvents.length > 0 && (
          <div className="mt-8 space-y-4 border-t border-slate-100 pt-6">
            <h3 className="text-sm font-semibold text-slate-800">Timeline History</h3>
            <div className="space-y-3">
              {timelineEvents.map((evt, idx) => (
                <div
                  key={evt._id || idx}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5"
                >
                  <div className={`mt-0.5 rounded-full p-1.5 ${evt.completed ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">{evt.title}</p>
                      {evt.date && (
                        <span className="text-xs text-slate-400">
                          {new Date(evt.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{evt.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      
      {/* Assigned Interview Schedule & Meet Link Card */}
      {Array.isArray(application.interviews) && application.interviews.length > 0 && (
        <section className="rounded-2xl border border-blue-200 bg-white p-6 shadow-xs sm:p-8">
          <div className="flex items-start gap-3 border-b border-slate-100 pb-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Assigned Interview Schedule</h2>
              <p className="mt-1 text-sm text-slate-500">
                Your assigned interview rounds and official meeting link.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {application.interviews.map((round, idx) => {
              const interviewer = round.interviewerId;
              const interviewerName =
                typeof interviewer === "object"
                  ? interviewer.name || [interviewer.firstName, interviewer.lastName].filter(Boolean).join(" ") || interviewer.email
                  : "Assigned Panelist";
              const isCompleted = String(round.status || "").toLowerCase() === "completed";

              return (
                <div
                  key={round._id || idx}
                  className="rounded-xl border border-blue-100 bg-blue-50/30 p-5 space-y-4"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">
                          {round.roundName || `Interview Round ${round.round || idx + 1}`}
                        </h3>
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-blue-700">
                          {round.interviewType || "Technical"} Round
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-700">
                          {round.status || "Scheduled"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Interviewer: <span className="font-semibold text-slate-800">{interviewerName}</span>
                      </p>
                    </div>

                    {round.meetingLink && !isCompleted ? (
                      <a
                        href={round.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
                      >
                        <Video className="h-4 w-4" />
                        Join Meeting
                        <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                      </a>
                    ) : isCompleted ? (
                      <span className="text-xs font-medium text-slate-400">
                        Interview completed — meeting link unavailable
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Meeting link will be shared prior to the session.
                      </span>
                    )}
                  </div>

                  <div className="grid gap-3 border-t border-blue-100 pt-3 sm:grid-cols-2 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400">Scheduled Date & Time: </span>
                      <span className="font-semibold text-slate-800">
                        {round.scheduledAt ? new Date(round.scheduledAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }) : "Not scheduled"}
                      </span>
                    </div>
                    {round.meetingLink && (
                      <div className="truncate">
                        <span className="text-slate-400">Meeting URL: </span>
                        {isCompleted ? (
                          <span className="font-medium text-slate-400">Unavailable — interview completed</span>
                        ) : (
                          <a href={round.meetingLink} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                            {round.meetingLink}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Application Details */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <div className="border-b border-slate-100 pb-5">
          <h2 className="text-lg font-bold text-slate-900">Submitted Details</h2>
          <p className="mt-1 text-sm text-slate-500">
            Details associated with your job application.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <User className="h-4 w-4 text-slate-400" />
              Candidate Full Name
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900">{candidateName}</p>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Mail className="h-4 w-4 text-slate-400" />
              Email Address
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900">{candidateEmail}</p>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Phone className="h-4 w-4 text-slate-400" />
              Phone Number
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900">{candidatePhone}</p>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Briefcase className="h-4 w-4 text-slate-400" />
              Applied Position
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900">{position}</p>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Clock className="h-4 w-4 text-slate-400" />
              Job Type
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900">{jobType}</p>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Calendar className="h-4 w-4 text-slate-400" />
              Submission Date
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900">{appliedDate}</p>
          </div>

          {application.resumeUrl && (
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 sm:col-span-2 lg:col-span-3">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <FileText className="h-4 w-4 text-slate-400" />
                Submitted Resume
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <a
                  href={application.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Resume
                </a>

                <a
                  href={application.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={application.resumeOriginalName || "Candidate_Resume.pdf"}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
