import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import {
  getMyOnboarding,
  completeOnboardingTask,
} from "../services/internService.js";

import OnboardingTaskCard from "../components/OnboardingTaskCard.jsx";
import OnboardingProgress from "../components/OnboardingProgress.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function MyOnboarding() {
  const [onboarding, setOnboarding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [completingId, setCompletingId] = useState("");

  const loadOnboarding = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getMyOnboarding();

      if (!Array.isArray(result.tasks)) {
        throw new Error("Invalid onboarding data received from server.");
      }

      setOnboarding(result);
    } catch (err) {
      setError(err.message || "Unable to load onboarding tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOnboarding();
  }, [loadOnboarding]);

  async function handleComplete(taskId) {
    setCompletingId(taskId);
    setActionError("");

    try {
      await completeOnboardingTask(taskId);

      // Fetch the updated state from the backend.
      const refreshed = await getMyOnboarding();

      if (!Array.isArray(refreshed.tasks)) {
        throw new Error("Updated task list was invalid.");
      }

      setOnboarding(refreshed);
    } catch (err) {
      setActionError(err.message || "Unable to complete this task.");
    } finally {
      setCompletingId("");
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading onboarding...</p>;
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-200 bg-white p-6">
        <p className="font-semibold text-red-700">
          Unable to load onboarding
        </p>

        <p className="mt-2 text-sm text-slate-600">{error}</p>

        <button
          type="button"
          onClick={loadOnboarding}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </section>
    );
  }

  const tasks = onboarding.tasks;
  const completedTasks = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  const totalTasks = tasks.length;

  const progress =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          My Onboarding
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          View and complete your assigned onboarding checklist.
        </p>
      </div>

      <OnboardingProgress
        progress={progress}
        completedTasks={completedTasks}
        totalTasks={totalTasks}
      />

      {actionError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {actionError}
        </div>
      )}

      {tasks.length === 0 ? (
        <EmptyState
          title="No onboarding tasks"
          description="There are currently no onboarding tasks assigned to your account."
        />
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <OnboardingTaskCard
              key={task._id}
              task={task}
              onComplete={handleComplete}
              completing={completingId === task._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}