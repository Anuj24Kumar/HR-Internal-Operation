
import { useEffect, useState } from "react";
import { getMyApplication } from "../services/candidateService.js";
import ApplicationStatusBadge from "../components/ApplicationStatusBadge.jsx";
import ApplicationTimeline from "../components/ApplicationTimeline.jsx";
import EmptyState from "../components/EmptyState.jsx";

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
    application?.jobTitle ||
    application?.designation;

  const status =
    application?.status ||
    application?.applicationStatus ||
    application?.currentStage;

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
            description="There is no application linked to your account."
          />
        </section>
      ) : (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row">
              <div>
                <p className="text-sm text-slate-500">
                  Application Details
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  {position || "Position not available"}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Application ID:{" "}
                  {application._id || application.id || "Not available"}
                </p>
              </div>

              <div>
                <ApplicationStatusBadge
                  status={status || "Not available"}
                />
              </div>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-6 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-sm text-slate-500">Applied On</p>
                <p className="mt-2 font-semibold text-slate-900">
                  {formatDate(
                    application.appliedAt ||
                    application.appliedOn ||
                    application.createdAt
                  )}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Department</p>
                <p className="mt-2 font-semibold text-slate-900">
                  {application.department?.name ||
                    application.department ||
                    "Not available"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Location</p>
                <p className="mt-2 font-semibold text-slate-900">
                  {application.location ||
                    application.position?.location ||
                    "Not available"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Recruiter</p>
                <p className="mt-2 font-semibold text-slate-900">
                  {application.recruiter?.name ||
                    application.recruiterName ||
                    "Not available"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Application Source</p>
                <p className="mt-2 font-semibold text-slate-900">
                  {application.source || "Not available"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">
              Application Progress
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Your current recruitment stage.
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

