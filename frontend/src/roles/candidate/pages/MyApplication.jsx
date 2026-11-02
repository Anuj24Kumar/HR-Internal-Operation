import { useEffect, useState } from "react";
import { getMyApplication } from "../services/candidateService.js";
import ApplicationStatusBadge from "../components/ApplicationStatusBadge.jsx";
import ApplicationTimeline from "../components/ApplicationTimeline.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { Briefcase, Download, ExternalLink, FileText, Mail, Phone, User } from "lucide-react";

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function MyApplication() {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadApplication() {
      try {
        setLoading(true);
        setError("");

        const result = await getMyApplication();

        if (!cancelled) {
          setApplication(
            result.application ??
            result.candidateApplication ??
            null
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load application.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadApplication();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-5">
        <div className="h-8 w-64 rounded bg-slate-200" />
        <div className="h-64 rounded-xl bg-white" />
      </div>
    );
  }

  const position =
    application?.position?.title ||
    application?.positionTitle ||
    application?.position ||
    application?.jobTitle ||
    application?.designation;

  const status =
    application?.status ||
    application?.applicationStatus ||
    application?.currentStage;

  const jobType = application?.jobType || "Full-time";

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-7">
      <header>
        <p className="text-sm text-slate-500">
          Workspace <span className="mx-2">›</span> My Application
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          My Application
        </h1>

        <p className="mt-2 text-slate-500">
          Track your application and review its current status.
        </p>
      </header>

      {!application ? (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <EmptyState
            title="No application found"
            description="There is no application linked to your account yet. You can apply directly from the Dashboard."
          />
        </section>
      ) : (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
                    <Briefcase className="h-3.5 w-3.5" />
                    {jobType}
                  </span>
                  <ApplicationStatusBadge
                    status={status || "Not available"}
                  />
                </div>

                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  {position || "Position not available"}
                </h2>

                <p className="mt-2 text-xs font-mono text-slate-500">
                  Application ID:{" "}
                  {application._id || application.id || "Not available"}
                </p>
              </div>

              {application.resumeUrl && (
                <a
                  href={application.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                >
                  <FileText className="h-4 w-4" />
                  View Resume
                  <ExternalLink className="h-3 w-3 opacity-70" />
                </a>
              )}
            </div>

            <div className="mt-7 grid grid-cols-1 gap-6 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500">Applied On</p>
                <p className="mt-1.5 font-semibold text-slate-900">
                  {formatDate(
                    application.appliedAt ||
                    application.appliedDate ||
                    application.appliedOn ||
                    application.createdAt
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Candidate Name</p>
                <p className="mt-1.5 font-semibold text-slate-900">
                  {application.candidateName || "Candidate"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Email Address</p>
                <p className="mt-1.5 font-semibold text-slate-900">
                  {application.email || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Phone</p>
                <p className="mt-1.5 font-semibold text-slate-900">
                  {application.phone || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Application Source</p>
                <p className="mt-1.5 font-semibold text-slate-900">
                  {application.applicationSource || application.source || "Direct Application"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Job Type</p>
                <p className="mt-1.5 font-semibold text-slate-900">
                  {jobType}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">
              Application Progress
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your recruitment stages and status progression.
            </p>

            <div className="mt-8">
              <ApplicationTimeline status={status} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
