import { FileSearch } from "lucide-react";

export default function EmptyState({
  title = "No data available",
  description = "There is nothing to display right now.",
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <FileSearch size={26} />
      </div>

      <h3 className="text-base font-semibold text-slate-800">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}