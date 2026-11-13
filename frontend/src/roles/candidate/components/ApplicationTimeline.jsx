import { Check, X } from "lucide-react";

const DEFAULT_STAGES = [
  { stage: "applied", title: "Applied" },
  { stage: "interview", title: "Interview" },
  { stage: "selected", title: "Selected" },
  { stage: "offer_sent", title: "Offer Sent" },
  { stage: "offer_received", title: "Offer Received" },
  { stage: "accepted", title: "Offer Accepted" },
  { stage: "converted", title: "Onboarded" },
];

const STAGE_INDEX = {
  applied: 0,
  interview: 1,
  selected: 2,
  offer_sent: 3,
  offer_received: 4,
  accepted: 5,
  converted: 6,
};

function formatDate(val) {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export default function ApplicationTimeline({ application, timeline, status, className = "" }) {
  const currentStatus = String(
    application?.status || status || ""
  ).toLowerCase().trim();

  const isRejected = currentStatus === "rejected";

  // Build timeline items
  let stages = [];
  const rawTimeline = application?.timeline || timeline;

  if (Array.isArray(rawTimeline) && rawTimeline.length > 0) {
    stages = rawTimeline.map(item => ({
      stage: item.stage,
      title: item.title || DEFAULT_STAGES.find(s => s.stage === item.stage)?.title || item.stage,
      completed: Boolean(item.completed),
      date: item.date,
    }));
  } else {
    // Synthesize from status
    const currentIdx = STAGE_INDEX[currentStatus] ?? 0;
    stages = DEFAULT_STAGES.map((s, idx) => ({
      stage: s.stage,
      title: s.title,
      completed: !isRejected && idx <= currentIdx,
      date: idx === 0 ? application?.createdAt : null,
    }));
  }

  return (
    <div className={`w-full overflow-x-auto pb-4 ${className}`}>
      {isRejected && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-700">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white">
            <X className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="font-semibold text-rose-900">Application Status: Rejected</p>
            <p className="text-rose-600">This application was not selected to proceed further.</p>
          </div>
        </div>
      )}

      <div className="flex min-w-[700px] items-start justify-between relative px-2">
        {stages.map((stage, idx) => {
          const completed = stage.completed;
          const isLast = idx === stages.length - 1;
          const nextCompleted = idx < stages.length - 1 && stages[idx + 1].completed;

          return (
            <div key={stage.stage || idx} className="relative flex flex-1 flex-col items-center text-center">
              {/* Connector line */}
              {!isLast && (
                <div
                  className={`absolute left-1/2 top-4 h-0.5 w-full -z-0 transition-colors ${
                    nextCompleted ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                />
              )}

              {/* Circle icon */}
              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                  completed
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                    : "border-slate-300 bg-white text-slate-300"
                }`}
              >
                {completed ? (
                  <Check className="h-4 w-4 stroke-[3]" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                )}
              </div>

              {/* Title */}
              <p
                className={`mt-2.5 text-xs font-semibold ${
                  completed ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {stage.title}
              </p>

              {/* Date */}
              {stage.date ? (
                <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                  {formatDate(stage.date)}
                </p>
              ) : (
                <span className="mt-0.5 text-[11px] text-transparent select-none">-</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
