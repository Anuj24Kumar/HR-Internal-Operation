
import { useEffect, useState } from "react";

import {
  getMyApplication,
  getMyDocuments,
  getMyProfile,
} from "../services/candidateService.js";

import CandidateStatCard from "../components/CandidateStatCard.jsx";
import ApplicationStatusBadge from "../components/ApplicationStatusBadge.jsx";
import ApplicationTimeline from "../components/ApplicationTimeline.jsx";
import EmptyState from "../components/EmptyState.jsx";

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

function getApplicationStatus(application) {
  return (
    application?.status ??
    application?.applicationStatus ??
    application?.currentStage ??
    "Not available"
  );
}

export default function Overview() {
  const [profile, setProfile] = useState(null);
  const [application, setApplication] = useState(null);
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const results = await Promise.allSettled([
          getMyProfile(),
          getMyApplication(),
          getMyDocuments(),
        ]);

        if (cancelled) return;

        const [profileResult, applicationResult, documentsResult] = results;

        const errors = [];

        if (profileResult.status === "fulfilled") {
          setProfile(profileResult.value.profile ?? profileResult.value.user ?? null);
        } else {
          errors.push("profile");
          console.error("Profile request failed:", profileResult.reason);
        }

        if (applicationResult.status === "fulfilled") {
          setApplication(
            applicationResult.value.application ??
            applicationResult.value.candidateApplication ??
            null
          );
        } else {
          errors.push("application");
          console.error("Application request failed:", applicationResult.reason);
        }

        if (documentsResult.status === "fulfilled") {
          const response = documentsResult.value;

          const list =
            response.documents ??
            response.data?.documents ??
            response.data ??
            [];

          setDocuments(Array.isArray(list) ? list : []);
        } else {
          errors.push("documents");
          console.error("Documents request failed:", documentsResult.reason);
        }

        if (errors.length === results.length) {
          setError("Dashboard data could not be loaded. Please try again.");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load the dashboard.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const candidateName =
    profile?.name ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    "Candidate";

  const position =
    application?.position?.title ||
    application?.positionTitle ||
    application?.jobTitle ||
    application?.designation ||
    "Not available";

  const status = getApplicationStatus(application);

  const department =
    application?.department?.name ||
    application?.department ||
    "Not available";

  const recruiter =
    application?.recruiter?.name ||
    application?.recruiterName ||
    "Not available";

  const location =
    application?.location ||
    application?.position?.location ||
    "Not available";

  const appliedDate = formatDate(
    application?.appliedAt ||
    application?.appliedOn ||
    application?.createdAt
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 rounded bg-slate-200" />
        <div className="h-5 w-80 max-w-full rounded bg-slate-200" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-32 rounded-xl bg-white shadow-sm" />
          ))}
        </div>

        <div className="h-64 rounded-xl bg-white shadow-sm" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-7">
      {/* Page heading */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm text-slate-500">
            Workspace <span className="mx-2">›</span> Overview
          </p>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Candidate Portal
          </h1>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Welcome, {candidateName}. Your application and next steps, all in one place.
          </p>
        </div>

        <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Candidate Workspace
        </span>
      </section>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <CandidateStatCard
          title="Application Status"
          value={application ? status : "0"}
          description={application ? "Current application status" : "No application record"}
        />

        <CandidateStatCard
          title="Applied Position"
          value={application ? position : "0"}
          description={application ? "Your current application" : "No position available"}
        />

        <CandidateStatCard
          title="My Documents"
          value={documents.length}
          description="Documents available in your account"
        />
      </section>

      {/* Application details */}
      {application ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm text-slate-500">
                Application details
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-900">
                {position}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {location}
              </p>
            </div>

            <ApplicationStatusBadge status={status} />
          </div>

          <div className="mt-7 grid grid-cols-1 gap-6 border-b border-slate-100 pb-6 sm:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500">Applied on</p>
              <p className="mt-2 font-medium text-slate-900">{appliedDate}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Department</p>
              <p className="mt-2 font-medium text-slate-900">{department}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Recruiter</p>
              <p className="mt-2 font-medium text-slate-900">{recruiter}</p>
            </div>
          </div>

          <div className="pt-6">
            <h3 className="mb-5 text-base font-semibold text-slate-900">
              Application Progress
            </h3>

            <ApplicationTimeline status={status} />
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <EmptyState
            title="No application found"
            description="There is no application linked to your account yet."
          />
        </section>
      )}
    </div>
  );
}

