import { CalendarDays, CheckCircle2, Circle } from "lucide-react";

function formatDate(date) {
  if (!date) return "No due date";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function OnboardingTaskCard({
  task,
  onComplete,
  completing = false,
}) {
  const isCompleted = task.status === "completed";

  const statusClasses = {
    completed: "bg-emerald-50 text-emerald-700",
    in_progress: "bg-blue-50 text-blue-700",
    pending: "bg-amber-50 text-amber-700",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 gap-3">
          <div
            className={`mt-1 ${
              isCompleted ? "text-emerald-600" : "text-slate-400"
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 size={22} />
            ) : (
              <Circle size={22} />
            )}
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900">
              {task.title}
            </h3>

            {task.description && (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-500">
                {task.description}
              </p>
            )}

            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <CalendarDays size={15} />
              <span>Due: {formatDate(task.dueDate)}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              statusClasses[task.status] ||
              "bg-slate-100 text-slate-600"
            }`}
          >
            {task.status?.replaceAll("_", " ") || "Unknown"}
          </span>

          {!isCompleted && (
            <button
              type="button"
              onClick={() => onComplete(task._id)}
              disabled={completing}
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {completing ? "Updating..." : "Mark completed"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}