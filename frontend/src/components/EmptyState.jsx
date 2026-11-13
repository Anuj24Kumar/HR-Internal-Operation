import { Inbox } from "lucide-react";

export default function EmptyState({
  title = "No records found",
  message = "",
  description = "",
  icon: Icon = Inbox,
  action = null,
  className = "",
}) {
  const desc = message || description || "There is no data available to display.";

  return (
    <div
      className={`flex min-h-48 flex-col items-center justify-center px-5 py-10 text-center ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 shadow-2xs">
        <Icon className="h-6 w-6" />
      </div>

      <h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3>

      {desc && <p className="mt-1.5 max-w-sm text-xs leading-5 text-slate-500">{desc}</p>}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
