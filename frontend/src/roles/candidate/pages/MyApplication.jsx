import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getApplicationDetails,
  getMyApplication,
} from "../services/candidateService.js";
import ApplicationStatusBadge from "../components/ApplicationStatusBadge.jsx";
import ApplicationTimeline from "../components/ApplicationTimeline.jsx";
import Spinner from "../../../components/Spinner.jsx";
import EmptyState from "../../../components/EmptyState.jsx";
import {
  Briefcase,
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Mail,
  Phone,
  User,
  Video,
  Star,
  CheckCircle,
  Award,
  ArrowRight,
} from "lucide-react";

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

function formatDate(val) {
  if (!val) return "Not available";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "Not available";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MyApplication() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        let appData = null;
        if (id) {
          const res = await getApplicationDetails(id);
          appData = res.data || res.application;
        } else {
          const res = await getMyApplication();
          appData = res.data || res.application || res.candidateApplication;
        }

        if (active) {
          setApplication(appData);
        }
      } catch (err) {
        if (active) setError(err.message || "Failed to load application details.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <Spinner message="Loading application details..." />;

  if (error) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          <p className="font-semibold text-rose-900">Error loading application</p>
          <p className="mt-1">{error}</p>
          <Link
            to="/candidate"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
          >
            ← Back to Overview
          </Link>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <EmptyState
          title="No application found"
          message="You haven't submitted an application yet or this application does not exist."
          action={
            <Link
              to="/candidate"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
            >
              Go to Dashboard
            </Link>
          }
        />
      </div>
    );
  }

  const interviews = application.interviews || (application.currentInterviewId ? [application.currentInterviewId] : []);
  const hasOffer = application.currentOfferId || ["offer_sent", "offer_received", "accepted", "converted"].includes(application.status);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
          <Link to="/candidate" className="hover:text-slate-600 transition">
            Candidate Portal
          </Link>
          <span>/</span>
          <span className="text-slate-600 font-medium">Application Details</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {application.position || application.jobTitle || "Application Details"}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Applied on {formatDate(application.createdAt)} · Application ID:{" "}
              <span className="font-mono text-slate-700">{application._id}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
              {application.jobType === "internship" ? "Internship" : "Full-time"}
            </span>
            <ApplicationStatusBadge status={application.status} />
          </div>
        </div>
      </div>

      {/* 7-Stage Timeline Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs">
        <h2 className="text-sm font-bold text-slate-900 mb-6">Application Progress</h2>
        <ApplicationTimeline application={application} />
      </div>

      {/* Offer Available Banner / Section */}
      {hasOffer && (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {application.status === "accepted" || application.status === "converted"
                    ? "Offer Accepted"
                    : "Offer Letter Available!"}
                </h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed max-w-xl">
                  {application.status === "accepted" || application.status === "converted"
                    ? "You have successfully accepted your offer. HR is processing your onboarding."
                    : "Congratulations! You have received an official offer letter. Review terms, download the PDF, and submit required documents."}
                </p>
              </div>
            </div>

            <Link
              to="/candidate/offer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition shrink-0"
            >
              View Offer & Documents
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Candidate Info Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs">
        <h2 className="text-sm font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
          Applicant Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <User className="h-3.5 w-3.5" />
              Applicant Name
            </div>
            <p className="mt-1.5 text-xs font-bold text-slate-900">
              {application.candidateName || "Candidate"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <Mail className="h-3.5 w-3.5" />
              Email Address
            </div>
            <p className="mt-1.5 text-xs font-bold text-slate-900 truncate">
              {application.email || "—"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <Phone className="h-3.5 w-3.5" />
              Phone Number
            </div>
            <p className="mt-1.5 text-xs font-bold text-slate-900">
              {application.phone || "—"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <Briefcase className="h-3.5 w-3.5" />
              Job Type
            </div>
            <p className="mt-1.5 text-xs font-bold text-slate-900 capitalize">
              {application.jobType === "internship" ? "Internship" : "Full-time"}
            </p>
          </div>
        </div>

        {application.resumeUrl && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-xs">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-slate-800">Submitted Resume</span>
            </div>
            <a
              href={application.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
            >
              View Resume
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Interviews Section */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs">
        <h2 className="text-sm font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
          Interview Information
        </h2>

        {interviews.length > 0 ? (
          <div className="space-y-4">
            {interviews.map((iv, idx) => {
              const interviewer = iv.interviewerId || {};
              const interviewerName =
                interviewer.name ||
                [interviewer.firstName, interviewer.lastName].filter(Boolean).join(" ") ||
                interviewer.email ||
                "Assigned Interviewer";
              const isCompleted = String(iv.status || "").toLowerCase() === "completed";

              return (
                <div
                  key={iv._id || idx}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">
                          {iv.roundName || `Interview Round ${idx + 1}`}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                            isCompleted
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {iv.status || "Scheduled"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Interviewer: <span className="font-semibold text-slate-700">{interviewerName}</span>
                      </p>
                    </div>

                    {iv.meetingLink && !isCompleted && (
                      <a
                        href={iv.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition self-start sm:self-auto"
                      >
                        <Video className="h-3.5 w-3.5" />
                        Join Meeting
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-t border-slate-200/80 pt-3">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>Scheduled: {formatDateTime(iv.scheduledAt)}</span>
                    </div>
                    {iv.duration && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span>Duration: {iv.duration} minutes</span>
                      </div>
                    )}
                  </div>

                  {/* Feedback summary if interview is completed */}
                  {isCompleted && (
                    <div className="rounded-xl border border-emerald-100 bg-white p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          Evaluation Completed
                        </span>
                        <div className="flex items-center gap-4">
                          {iv.rating !== undefined && iv.rating !== null && (
                            <span className="flex items-center gap-1 text-amber-600 font-bold">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              {iv.rating} / 5
                            </span>
                          )}
                          {iv.score !== undefined && iv.score !== null && (
                            <span className="font-bold text-blue-600">
                              Score: {iv.score} / 100
                            </span>
                          )}
                        </div>
                      </div>

                      {iv.feedback && (
                        <p className="text-xs text-slate-600 italic leading-relaxed pt-1">
                          "{iv.feedback}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
            No interview has been scheduled yet. Once HR assigns an interviewer, details will appear here.
          </div>
        )}
      </div>
    </div>
  );
}
