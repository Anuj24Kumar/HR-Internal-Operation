import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Briefcase,
  Calendar,
  FileText,
  Clock,
  Award,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Video,
} from "lucide-react";
import {
  getMyProfile,
  getMyApplications,
  getMyOffer,
} from "../services/candidateService.js";
import ApplicationStatusBadge from "../components/ApplicationStatusBadge.jsx";
import ApplyJobModal from "../components/ApplyJobModal.jsx";
import Spinner from "../../../components/Spinner.jsx";
import EmptyState from "../../../components/EmptyState.jsx";

function formatDate(val) {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Overview() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [offer, setOffer] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successNotice, setSuccessNotice] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [pRes, aRes, oRes] = await Promise.allSettled([
        getMyProfile(),
        getMyApplications(),
        getMyOffer(),
      ]);

      if (pRes.status === "fulfilled") {
        setProfile(pRes.value.profile || pRes.value.user || null);
      }
      if (aRes.status === "fulfilled") {
        const apps = aRes.value.applications || aRes.value.data || [];
        setApplications(Array.isArray(apps) ? apps : []);
      }
      if (oRes.status === "fulfilled") {
        setOffer(oRes.value.data || null);
      }
    } catch (err) {
      console.error("Dashboard load failed:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const candidateName =
    profile?.name ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    "Candidate";

  const latestApp = applications[0] || null;

  if (loading && !profile) {
    return <Spinner message="Loading your dashboard..." />;
  }

  // Count active interviews
  let activeInterviewsCount = 0;
  applications.forEach(a => {
    if (a.currentInterviewId || (Array.isArray(a.interviews) && a.interviews.length > 0)) {
      activeInterviewsCount++;
    }
  });

  return (
    <div className="mx-auto max-w-6xl space-y-7 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome, {candidateName}!
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Track your recruitment stages, interview schedules, and offer letters.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowApplyModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-98 transition"
          >
            <Plus className="h-4 w-4" />
            Apply for Position
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successNotice && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <p className="font-semibold">{successNotice}</p>
          </div>
          <button
            type="button"
            onClick={() => setSuccessNotice("")}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stat Cards (4 Cards: Total Apps, Current Status, Interviews Scheduled, Offer Status) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Applications Count */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">My Applications</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{applications.length}</p>
          <p className="mt-1 text-[11px] text-slate-400">Total positions applied</p>
        </div>

        {/* Stat 2: Current Status */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Latest Pipeline Status</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            {latestApp ? (
              <ApplicationStatusBadge status={latestApp.status} />
            ) : (
              <span className="text-sm font-semibold text-slate-400">No applications</span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-slate-400 truncate">
            {latestApp ? latestApp.position || "Application" : "Ready to apply"}
          </p>
        </div>

        {/* Stat 3: Interviews Scheduled */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Interviews</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{activeInterviewsCount}</p>
          <p className="mt-1 text-[11px] text-slate-400">Scheduled / Evaluated</p>
        </div>

        {/* Stat 4: Offer Status */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Offer Letter</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            {offer ? (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                  offer.status === "accepted"
                    ? "bg-emerald-100 text-emerald-800"
                    : offer.status === "declined"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-cyan-100 text-cyan-800"
                }`}
              >
                {offer.status.replace("_", " ")}
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-400">None Issued Yet</span>
            )}
          </div>
          {offer ? (
            <Link
              to="/candidate/offer"
              className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
            >
              View Offer Details →
            </Link>
          ) : (
            <p className="mt-1 text-[11px] text-slate-400">Awaiting selection</p>
          )}
        </div>
      </div>

      {/* Offer Alert Banner if offer available and awaiting acceptance */}
      {offer && (offer.status === "sent" || offer.status === "offer_received") && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/80 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-950">
                You have received an offer for {offer.position || "your applied role"}!
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Review your offer details, download the letter, and submit required documents to accept.
              </p>
            </div>
          </div>

          <Link
            to="/candidate/offer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition shrink-0"
          >
            Review Offer Letter
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Applications List */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Application History</h2>
            <p className="text-xs text-slate-500">
              Click on an application to track its 7-stage progress and view interview feedback.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowApplyModal(true)}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition"
          >
            + Apply Another Role
          </button>
        </div>

        {applications.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {applications.map((app) => (
              <div
                key={app._id}
                onClick={() => navigate(`/candidate/application/${app._id}`)}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-slate-50/80 transition cursor-pointer"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {app.position || "Position"}
                      </h3>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                        {app.jobType === "internship" ? "Internship" : "Full-time"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Applied on {formatDate(app.createdAt)} · Application ID:{" "}
                      <span className="font-mono text-slate-600">{app._id}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <ApplicationStatusBadge status={app.status} />
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                    View Timeline
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8">
            <EmptyState
              title="No applications yet"
              message="You haven't applied for any positions yet. Click the button below to submit your first application!"
              action={
                <button
                  type="button"
                  onClick={() => setShowApplyModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
                >
                  <Plus className="h-4 w-4" />
                  Apply Now
                </button>
              }
            />
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <ApplyJobModal
          isOpen={showApplyModal}
          onClose={() => setShowApplyModal(false)}
          profile={profile}
          onSuccess={(created) => {
            setSuccessNotice("Application submitted successfully! Your application status is now applied.");
            loadData();
          }}
        />
      )}
    </div>
  );
}
