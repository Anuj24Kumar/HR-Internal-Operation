
export default function CandidateStatCard({
  title,
  value,
  description,
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <p className="text-sm font-medium text-slate-500">{title}</p>

      <h2 className="mt-4 break-words text-2xl font-bold text-slate-900">
        {value ?? 0}
      </h2>

      {description && (
        <p className="mt-2 text-xs leading-5 text-slate-500">
          {description}
        </p>
      )}
    </article>
  );
}

