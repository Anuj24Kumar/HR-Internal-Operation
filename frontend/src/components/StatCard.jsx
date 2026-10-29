
export default function StatCard({
  title,
  value = 0,
  icon: Icon,
  color = "blue",
  description,
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
  };

  const formattedValue = Number.isFinite(Number(value))
    ? Number(value).toLocaleString("en-IN")
    : "0";

  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {formattedValue}
          </p>

          {description && (
            <p className="mt-2 text-xs text-slate-500">
              {description}
            </p>
          )}
        </div>

        {Icon && (
          <div
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
              colors[color] || colors.blue
            }`}
          >
            <Icon size={21} />
          </div>
        )}
      </div>
    </article>
  );
}
