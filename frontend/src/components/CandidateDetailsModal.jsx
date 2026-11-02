import { useState } from "react";
import {
  X,
  FileText,
  ExternalLink,
  Briefcase,
  Calendar,
  Hash,
  Mail,
  Phone,
  User,
  Clock,
  Copy,
  Check,
  CheckCircle2,
  Download,
  Award,
} from "lucide-react";

const STATUSES = ["applied", "screening", "interview", "selected", "rejected"];

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${
        styles[normalized] || "bg-slate-100 text-slate-700 ring-slate-500/20"
      }`}
    >
      {normalized || "unspecified"}
    </span>
  );
}

export default function CandidateDetailsModal({
  isOpen,
  onClose,
  candidate,
  onStatusUpdate,
  onSelectCandidate,
}) {
  const [copiedField, setCopiedField] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  if (!isOpen || !candidate) return null;

  const handleCopy = (text, fieldName) => {
    if (text && text !== "—") {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const candidateName = candidate.name || "Candidate";
  const position = candidate.position || "Not specified";
  const jobType = candidate.jobType || "Full-time";
  const email = candidate.email || "—";
  const phone = candidate.phone || "—";
  const applicationId = candidate.applicationId || "—";
  const candidateId = candidate._id || candidate.id || "—";
  const appliedDate = formatDate(candidate.appliedAt || candidate.appliedDate || candidate.createdAt);
  const source = candidate.source || candidate.applicationSource || "Direct";
  const resumeUrl = candidate.resumeUrl;
  const resumeName = candidate.resumeOriginalName || "Candidate_Resume.pdf";
  const timeline = Array.isArray(candidate.timeline) ? candidate.timeline : [];

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    if (!newStatus || newStatus === candidate.status) return;
    setUpdatingStatus(true);
    try {
      await onStatusUpdate(candidate, newStatus);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="candidate-details-title"
        className="relative my-auto w-full max-w-3xl rounded-2xl bg-white shadow-2xl transition-all"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 font-bold text-blue-700 text-lg">
              {String(candidateName).slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="candidate-details-title" className="text-xl font-bold text-slate-900">
                  {candidateName}
                </h2>
                <StatusBadge status={candidate.status} />
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  <Briefcase className="h-3 w-3 text-slate-500" />
                  {jobType}
                </span>
                {candidate.selectedAs && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                    <Award className="h-3 w-3" />
                    Hired as {candidate.selectedAs}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Applied for <span className="font-semibold text-slate-700">{position}</span> &bull; Source: {source}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="max-h-[75vh] space-y-6 overflow-y-auto px-6 py-6">
          {/* Quick Recruitment Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Update Recruitment Stage:</span>
              <select
                disabled={updatingStatus}
                value={STATUSES.includes(candidate.status) ? candidate.status : ""}
                onChange={handleStatusChange}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-2xs outline-none focus:border-blue-500"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectCandidate(candidate);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              Select as Intern / Employee
            </button>
          </div>

          {/* Submitted Details Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Application Information
            </h3>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {/* Applied Position */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Briefcase className="h-4 w-4 text-slate-400" />
                  Applied Position
                </div>
                <p className="mt-1.5 text-sm font-semibold text-slate-900">{position}</p>
              </div>

              {/* Job Type */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Clock className="h-4 w-4 text-slate-400" />
                  Job Type
                </div>
                <p className="mt-1.5 text-sm font-semibold text-slate-900">{jobType}</p>
              </div>

              {/* Applied Date */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  Applied Date
                </div>
                <p className="mt-1.5 text-sm font-semibold text-slate-900">{appliedDate}</p>
              </div>

              {/* Full Name */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <User className="h-4 w-4 text-slate-400" />
                  Full Name
                </div>
                <p className="mt-1.5 text-sm font-semibold text-slate-900">{candidateName}</p>
              </div>

              {/* Email */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Mail className="h-4 w-4 text-slate-400" />
                  Email Address
                </div>
                <p className="mt-1.5 text-sm font-semibold text-slate-900 truncate" title={email}>
                  {email}
                </p>
              </div>

              {/* Phone */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Phone className="h-4 w-4 text-slate-400" />
                  Phone Number
                </div>
                <p className="mt-1.5 text-sm font-semibold text-slate-900">{phone}</p>
              </div>

              {/* Application ID */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Hash className="h-4 w-4 text-slate-400" />
                    Application ID
                  </span>
                  {applicationId !== "—" && (
                    <button
                      type="button"
                      onClick={() => handleCopy(applicationId, "appId")}
                      className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline"
                    >
                      {copiedField === "appId" ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <p className="mt-1.5 font-mono text-xs font-semibold text-slate-800 truncate" title={applicationId}>
                  {applicationId}
                </p>
              </div>

              {/* Candidate ID */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-slate-400" />
                    Candidate ID
                  </span>
                  {candidateId !== "—" && (
                    <button
                      type="button"
                      onClick={() => handleCopy(candidateId, "candidateId")}
                      className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline"
                    >
                      {copiedField === "candidateId" ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <p className="mt-1.5 font-mono text-xs font-semibold text-slate-800 truncate" title={candidateId}>
                  {candidateId}
                </p>
              </div>

              {/* Source */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Clock className="h-4 w-4 text-slate-400" />
                  Source
                </div>
                <p className="mt-1.5 text-sm font-semibold text-slate-900">{source}</p>
              </div>
            </div>
          </div>

          {/* Submitted Resume / Document Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Submitted Resume / Curriculum Vitae
            </h3>

            {resumeUrl ? (
              <div className="mt-3 flex flex-col items-start justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{resumeName}</p>
                    <p className="text-xs text-slate-500">Uploaded candidate resume document</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3.5 py-2 text-xs font-semibold text-blue-700 shadow-2xs hover:bg-blue-50 transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open in New Tab
                  </a>
                  <a
                    href={resumeUrl}
                    download={resumeName}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-dashed border-slate-200 p-4 text-center">
                <p className="text-xs text-slate-500">No resume document uploaded for this candidate.</p>
              </div>
            )}
          </div>

          {/* Timeline History */}
          {timeline.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Application Timeline History
              </h3>
              <div className="mt-3 space-y-2.5">
                {timeline.map((evt, idx) => (
                  <div
                    key={evt._id || idx}
                    className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                  >
                    <div className="mt-0.5 rounded-full bg-blue-100 p-1 text-blue-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-900">{evt.title}</p>
                        {evt.date && (
                          <span className="text-[11px] text-slate-400">
                            {formatDate(evt.date)}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{evt.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
