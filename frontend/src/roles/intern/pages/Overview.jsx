import { useCallback, useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  RefreshCw,
} from "lucide-react";

import {
  getMyInternProfile,
  getMyOnboarding,
} from "../services/internService.js";

import InternStatCard from "../components/InternStatCard.jsx";
import OnboardingProgress from "../components/OnboardingProgress.jsx";
import OnboardingTaskCard from "../components/OnboardingTaskCard.jsx";
import EmptyState from "../components/EmptyState.jsx";

function formatDate(date) {
  if (!date) return "Not provided";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not provided";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getFullName(user) {
  if (!user) return "Name not provided";

  const name = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || user.name || "Name not provided";
}

export default function Overview() {
  const [intern, setIntern] = useState(null);
  const [onboarding, setOnboarding] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [profileResult, onboardingResult] = await Promise.all([
        getMyInternProfile(),
        getMyOnboarding(),
      ]);

      if (!profileResult.intern) {
        throw new Error("Intern profile was not returned by the server.");
      }

      if (!Array.isArray(onboardingResult.tasks)) {
        throw new Error(
          "The server returned an invalid onboarding task list."
        );
      }

      setIntern(profileResult.intern);
      setOnboarding(onboardingResult);
    } catch (err) {
      setError(err.message || "Unable to load the intern dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm text-slate-500">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-red-700">
          Unable to load dashboard
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          {error}
        </p>

        <button
          type="button"
          onClick={loadDashboard}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <RefreshCw size={16} />
          Try again
        </button>
      </section>
    );
  }

  const user = intern.user || {};
  const tasks = onboarding.tasks;

  const totalTasks =
    Number.isFinite(onboarding.totalTasks)
      ? onboarding.totalTasks
      : tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  const progress =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  const pendingTasks = tasks.filter(
    (task) => task.status === "pending"
  ).length;

  const displayName = getFullName(user);

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-2xl bg-[#111C2E] p-6 text-white shadow-sm sm:p-8">
        <p className="text-sm font-medium text-blue-300">
          INTERN WORKSPACE
        </p>

        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
          Welcome, {displayName}
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
          Track your internship information and onboarding progress
          from one place.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm">
            {intern.designation || "Designation not provided"}
          </span>

          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm capitalize">
            {intern.status || "Status not provided"}
          </span>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Internship Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Information retrieved from your account.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <InternStatCard
            title="Department"
            value={intern.department || "Not provided"}
            description="Your assigned department"
            icon={BriefcaseBusiness}
          />

          <InternStatCard
            title="Designation"
            value={intern.designation || "Not provided"}
            description="Your internship role"
            icon={ClipboardList}
          />

          <InternStatCard
            title="Joining Date"
            value={formatDate(intern.joiningDate)}
            description="Internship start date"
            icon={CalendarDays}
          />

          <InternStatCard
            title="Completed Tasks"
            value={completedTasks}
            description={`${pendingTasks} pending tasks`}
            icon={CheckCircle2}
          />
        </div>
      </section>

      <section>
        <OnboardingProgress
          progress={progress}
          completedTasks={completedTasks}
          totalTasks={totalTasks}
        />
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Onboarding Checklist
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your assigned onboarding tasks.
            </p>
          </div>
        </div>

        {tasks.length === 0 ? (
          <EmptyState
            title="No onboarding tasks"
            description="No onboarding tasks are currently assigned to your account."
          />
        ) : (
          <div className="space-y-4">
            {tasks.slice(0, 5).map((task) => (
              <OnboardingTaskCard
                key={task._id}
                task={task}
                onComplete={() => {
                  window.location.href = "/intern/onboarding";
                }}
              />
            ))}
          </div>
        )}

        {tasks.length > 5 && (
          <p className="mt-4 text-sm text-slate-500">
            Showing the first 5 of {tasks.length} tasks. Open My
            Onboarding to view the full checklist.
          </p>
        )}
      </section>
    </div>
  );
}