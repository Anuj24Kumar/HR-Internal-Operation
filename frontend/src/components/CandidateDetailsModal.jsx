import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Star,
  ThumbsUp,
  ThumbsDown,
  Send,
  Video,
} from "lucide-react";

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
    offer: "bg-teal-50 text-teal-700 ring-teal-600/20",
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
  onSelectCandidate,
  onGenerateOffer,
}) {
  const navigate = useNavigate();
  const [copiedField, setCopiedField] = useState(null);

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
  const applications = Array.isArray(candidate.applications) ? candidate.applications : [];
  const offers = Array.isArray(candidate.offers) ? candidate.offers : [];
  const documents = Array.isArray(candidate.documents) ? candidate.documents : [];
  const timeline = Array.isArray(candidate.timeline)
    ? candidate.timeline
    : applications[0]?.timeline || [];
  const interviews = Array.isArray(candidate.interviews) ? candidate.interviews : [];
  const recommendation = candidate.hiringRecommendation;
  const normalizedStatus = String(candidate.status || "").toLowerCase();

  const handleGenerateOfferClick = () => {
    if (onGenerateOffer) {
      onGenerateOffer(candidate);
    } else {
      onClose();
      navigate(`/hr/offers?candidateId=${candidate._id}&candidateName=${encodeURIComponent(candidateName)}&position=${encodeURIComponent(position)}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="candidate-details-title"
        className="relative my-auto w-full max-w-3xl rounded-2xl bg-white shadow-2xl transition-all max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 shrink-0">
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
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {jobType}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Applied for <span className="font-medium text-slate-700">{position}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5">
            {normalizedStatus === "selected" && (
              <button
                type="button"
                onClick={handleGenerateOfferClick}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
              >
                <Send size={14} />
                Generate Offer
              </button>
            )}
          </div>

          {applications.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Application History
              </h3>
              <div className="mt-3 space-y-2">
                {applications.map((application) => (
                  <div key={application._id} className="flex flex-wrap justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
                    <span className="font-semibold text-slate-800">
                      {application.position} · {String(application.jobType || "").replace("_", " ")}
                    </span>
                    <span className="text-slate-600">{application.status}</span>
                    <span className="text-xs text-slate-500">{formatDate(application.createdAt)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Offer History ({offers.length})
            </h3>
            {offers.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                No offers have been created for this candidate.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {offers.map((offer) => (
                  <div key={offer._id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="font-semibold text-slate-800">{offer.designation || "Offer"} · {offer.offerType || "—"}</span>
                      <span className="capitalize text-slate-600">{offer.status || "—"}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Compensation: ₹{Number(offer.salary || 0).toLocaleString("en-IN")} · Joining: {formatDate(offer.joiningDate)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Sent: {formatDate(offer.sentAt || offer.createdAt)}{offer.acceptedAt ? ` · Accepted: ${formatDate(offer.acceptedAt)}` : ""}
                    </p>
                    {offer.pdfUrl && (
                      <a href={offer.pdfUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline">
                        View offer PDF <ExternalLink size={12} />
                      </a>
                    )}
                    {Array.isArray(offer.requiredDocuments) && offer.requiredDocuments.length > 0 && (
                      <ul className="mt-2 space-y-1 border-t border-slate-200 pt-2 text-xs text-slate-600">
                        {offer.requiredDocuments.map((document) => (
                          <li key={document.id} className="flex items-center justify-between gap-2">
                            <span>{document.label}</span>
                            <span className={document.uploadedDocumentId ? "font-semibold text-emerald-700" : "text-amber-700"}>
                              {document.uploadedDocumentId ? "Uploaded" : document.required ? "Pending" : "Optional"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Documents ({documents.length + (resumeUrl ? 1 : 0)})
            </h3>
            <div className="mt-3 space-y-2">
              {resumeUrl && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
                  <span className="font-semibold text-slate-800">{resumeName}</span>
                  <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline">
                    View resume <ExternalLink size={12} />
                  </a>
                </div>
              )}
              {documents.map((document) => (
                <div key={document._id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
                  <div>
                    <p className="font-semibold text-slate-800">{document.label || document.originalName || "Document"}</p>
                    <p className="text-xs text-slate-500">
                      {document.originalName || document.documentType} · {document.status || "pending"} · {formatDate(document.uploadedAt || document.createdAt)}
                    </p>
                  </div>
                  {(document.fileUrl || document.filePath) && (
                    <a href={document.fileUrl || document.filePath} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline">
                      View document <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              ))}
              {!resumeUrl && documents.length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                  No documents uploaded for this candidate.
                </p>
              )}
            </div>
          </section>

          {/* Candidate Overview Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Candidate Information
            </h3>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Briefcase className="h-4 w-4 text-slate-400" />
                  Applied Position
                </div>
                <p className="mt-1.5 text-sm font-semibold text-slate-900">{position}</p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Clock className="h-4 w-4 text-slate-400" />
                  Job Type
                </div>
                <p className="mt-1.5 text-sm font-semibold text-slate-900">{jobType}</p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  Applied Date
                </div>
                <p className="mt-1.5 text-sm font-semibold text-slate-900">{appliedDate}</p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Mail className="h-4 w-4 text-slate-400" />
                  Email Address
                </div>
                <p className="mt-1.5 text-sm font-semibold text-slate-900 truncate" title={email}>
                  {email}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Phone className="h-4 w-4 text-slate-400" />
                  Phone Number
                </div>
                <p className="mt-1.5 text-sm font-semibold text-slate-900">{phone}</p>
              </div>

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
            </div>
          </div>

          {/* Submitted Resume Section */}
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

          {/* Interview Evaluation & Results Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Interview Rounds & Feedback Evaluation
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {interviews.length} Round{interviews.length === 1 ? "" : "s"} Assigned
              </span>
            </div>

            {interviews.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-slate-200 p-4 text-center">
                <p className="text-xs text-slate-500">No interview rounds assigned yet.</p>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {interviews.map((round, idx) => {
                  const interviewer = round.interviewerId;
                  const isCompleted = String(round.status || "").toLowerCase() === "completed";
                  const interviewerName =
                    typeof interviewer === "object"
                      ? interviewer.name || [interviewer.firstName, interviewer.lastName].filter(Boolean).join(" ") || interviewer.email
                      : "Assigned Interviewer";

                  return (
                    <div
                      key={round._id || idx}
                      className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {round.roundName || `Round ${round.round || idx + 1}`}
                          </span>
                          <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-blue-700">
                            {round.interviewType || "technical"}
                          </span>
                          <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ${
                            isCompleted ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                          }`}>
                            {round.status || "scheduled"}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {round.score != null && (
                            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-800">
                              Score: {round.score}/100
                            </span>
                          )}

                          {round.rating != null ? (
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={13}
                                  className={star <= round.rating ? "text-amber-500 fill-amber-500" : "text-slate-300"}
                                />
                              ))}
                              <span className="ml-1 text-xs font-bold text-slate-800">{round.rating}/5</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Awaiting rating</span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                        <div>
                          <span className="font-medium text-slate-400">Interviewer: </span>
                          <span className="font-semibold text-slate-800">{interviewerName}</span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-400">Schedule: </span>
                          <span className="font-semibold text-slate-800">{formatDate(round.scheduledAt)}</span>
                        </div>
                      </div>

                      {round.meetingLink && (
                        <div className="flex items-center gap-2 text-xs">
                          <Video size={14} className="text-blue-600" />
                          <span className="font-medium text-slate-400">
                            {isCompleted ? "Meeting: " : "Meet Link: "}
                          </span>
                          {isCompleted ? (
                            <span className="truncate max-w-md text-slate-400">
                              Unavailable — interview completed
                            </span>
                          ) : (
                            <a
                              href={round.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-blue-600 hover:underline truncate max-w-md"
                            >
                              {round.meetingLink}
                            </a>
                          )}
                        </div>
                      )}

                      {round.feedback && (
                        <div className="rounded-lg bg-white p-3 border border-slate-200/80">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Interviewer Feedback
                          </p>
                          <p className="mt-1 text-xs text-slate-700 leading-relaxed italic">
                            "{round.feedback}"
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Hiring Manager Recommendation Section */}
          {recommendation && recommendation.status && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Hiring Manager Recommendation
              </h3>

              <div className="mt-3 rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {recommendation.status === "select" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                        <ThumbsUp size={13} />
                        Recommended to Select
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800">
                        <ThumbsDown size={13} />
                        Recommended to Reject
                      </span>
                    )}
                  </div>
                  {recommendation.recommendedAt && (
                    <span className="text-xs text-slate-400">
                      {formatDate(recommendation.recommendedAt)}
                    </span>
                  )}
                </div>

                {recommendation.comments && (
                  <p className="text-xs text-slate-700 italic mt-2">
                    "{recommendation.comments}"
                  </p>
                )}
              </div>
            </div>
          )}

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
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 shrink-0 bg-slate-50/50 rounded-b-2xl">
          <div>
            {normalizedStatus === "selected" && (
              <span className="text-xs font-semibold text-emerald-700">
                Candidate is selected and ready for Offer generation.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Close
            </button>

            {normalizedStatus === "selected" && (
              <button
                type="button"
                onClick={handleGenerateOfferClick}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
              >
                <Send size={15} />
                Generate Offer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
