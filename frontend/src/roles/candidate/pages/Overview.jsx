import { useEffect, useState } from "react";
import {
  Plus,
  Briefcase,
  Calendar,
  FileText,
  User,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  getMyProfile,
  getMyApplications,
} from "../services/candidateService.js";
import ApplicationStatusBadge from "../components/ApplicationStatusBadge.jsx";
import ApplyJobModal from "../components/ApplyJobModal.jsx";
import ApplicationDetailView from "../components/ApplicationDetailView.jsx";

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Overview() {
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [profileRes, appsRes] = await Promise.allSettled([
        getMyProfile(),
        getMyApplications(),
      ]);

      if (profileRes.status === "fulfilled") {
        setProfile(profileRes.value.profile || profileRes.value.user || null);
      }

      if (appsRes.status === "fulfilled") {
        const appList =
          appsRes.value.applications ||
          appsRes.value.data ||
          [];
        setApplications(Array.isArray(appList) ? appList : []);
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const candidateName =
    profile?.name ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    "Candidate";

  const latestApp = applications[0] || null;

  if (loading && !profile) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 rounded bg-slate-200" />
        <div className="h-5 w-80 max-w-full rounded bg-slate-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-28 rounded-2xl bg-white shadow-xs" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-white shadow-xs" />
      </div>
    );
  }

  // If viewing single application details
  if (selectedApp) {
    return (
      <div className="mx-auto max-w-[1500px]">
        <ApplicationDetailView
          application={selectedApp}
          onBack={() => setSelectedApp(null)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-7">
      {/* Top Header Row with 'Apply' button in the right corner */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Workspace <span className="mx-1.5">›</span> Dashboard
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Candidate Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Welcome, {candidateName}! Track your job applications, application status, and interview progress.
          </p>
        </div>

        {/* Apply Button in Right Corner */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowApplyModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 active:scale-98 transition"
          >
            <Plus className="h-4 w-4" />
            Apply
          </button>
        </div>
      </section>

      {/* Success Notification */}
      {successNotice && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessNotice("")}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Clean Metric Summary Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Applications
            </p>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {applications.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {applications.length === 1
              ? "1 submitted application"
              : `${applications.length} submitted applications`}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Latest Status
            </p>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            {latestApp ? (
              <ApplicationStatusBadge status={latestApp.status} />
            ) : (
              <span className="text-sm font-medium text-slate-400">None yet</span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {latestApp ? `For ${latestApp.position}` : "Apply for an open position"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Candidate Profile
            </p>
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
              <User className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-sm font-bold text-slate-900 truncate">
            {candidateName}
          </p>
          <p className="mt-1 text-xs text-slate-500 truncate">
            {profile?.email || "Account verified"}
          </p>
        </div>
      </section>

      {/* Applied Applications Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-7">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">
              Applied Applications
            </h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {applications.length}
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Click on any application to view real-time progress and details
          </p>
        </div>

        {applications.length === 0 ? (
          <div className="py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Briefcase className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              No applications submitted yet
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              You haven't applied for any positions yet. Click the Apply button above to submit your application and upload your resume.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowApplyModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4" />
                Apply Now
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 divide-y divide-slate-100">
            {applications.map((app) => (
              <div
                key={app._id || app.id}
                onClick={() => setSelectedApp(app)}
                className="group flex flex-col justify-between gap-4 py-5 sm:flex-row sm:items-center cursor-pointer hover:bg-slate-50/80 -mx-6 px-6 rounded-xl transition"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition">
                      {app.position}
                    </h3>
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      {app.jobType || "Full-time"}
                    </span>
                    <ApplicationStatusBadge status={app.status} />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      Applied on {formatDate(app.appliedAt || app.createdAt)}
                    </span>
                    <span className="font-mono text-slate-400">
                      ID: {app._id || app.id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedApp(app);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs group-hover:border-blue-300 group-hover:text-blue-600 transition"
                  >
                    View Details & Progress
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Apply Job Modal */}
      <ApplyJobModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        profile={profile}
        onSuccess={(newApp) => {
          setSuccessNotice(`Your application for "${newApp.position}" has been submitted successfully!`);
          loadDashboard();
          setSelectedApp(newApp);
        }}
      />
    </div>
  );
}
