export default function OnboardingProgress({
  progress = 0,
  completedTasks = 0,
  totalTasks = 0,
}) {
  const safeProgress = Math.min(
    100,
    Math.max(0, Number(progress) || 0)
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Onboarding Progress
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your onboarding checklist completion.
          </p>
        </div>

        <span className="text-2xl font-bold text-blue-600">
          {safeProgress}%
        </span>
      </div>

      <div
        className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label="Onboarding progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safeProgress}
      >
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-500"
          style={{ width: `${safeProgress}%` }}
        />
      </div>

      <p className="mt-3 text-sm text-slate-500">
        {completedTasks} of {totalTasks} tasks completed
      </p>
    </section>
  );
}