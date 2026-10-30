
const statusStyles = {
  applied: "bg-blue-50 text-blue-700 ring-blue-600/20",
  screening: "bg-amber-50 text-amber-700 ring-amber-600/20",
  interview: "bg-purple-50 text-purple-700 ring-purple-600/20",
  selected: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  offer: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  accepted: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  rejected: "bg-red-50 text-red-700 ring-red-600/20",
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  "not available": "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export default function ApplicationStatusBadge({ status }) {
  const normalizedStatus = String(status || "Not available")
    .trim()
    .toLowerCase()
    .replaceAll("_", " ");

  const styles =
    statusStyles[normalizedStatus] ||
    "bg-slate-100 text-slate-700 ring-slate-500/20";

  const label = normalizedStatus.replace(/\b\w/g, (char) =>
    char.toUpperCase()
  );

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${styles}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

