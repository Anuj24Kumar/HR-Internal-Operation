const STATUS_META = {
  applied:        { label: "Applied",        color: "bg-blue-100 text-blue-700" },
  interview:      { label: "Interview",      color: "bg-purple-100 text-purple-700" },
  selected:       { label: "Selected",       color: "bg-green-100 text-green-700" },
  offer_sent:     { label: "Offer Sent",     color: "bg-cyan-100 text-cyan-700" },
  offer_received: { label: "Offer Received", color: "bg-cyan-100 text-cyan-700" },
  accepted:       { label: "Offer Accepted", color: "bg-emerald-100 text-emerald-700" },
  converted:      { label: "Onboarded",      color: "bg-emerald-100 text-emerald-700" },
  rejected:       { label: "Rejected",       color: "bg-red-100 text-red-700" },
};

export default function ApplicationStatusBadge({ status, className = "" }) {
  const normalized = String(status || "")
    .trim()
    .toLowerCase();

  const meta = STATUS_META[normalized] || {
    label: normalized ? normalized.replace(/_/g, " ") : "Not available",
    color: "bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${meta.color} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {meta.label}
    </span>
  );
}
