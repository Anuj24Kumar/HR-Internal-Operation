
const stages = [
  "Applied",
  "Screening",
  "Interview",
  "Selected",
  "Offer",
];

function normalizeStatus(status) {
  return String(status || "")
    .trim()
    .toLowerCase()
    .replaceAll("_", " ");
}

export default function ApplicationTimeline({ status }) {
  const normalizedStatus = normalizeStatus(status);

  const stageAliases = {
    applied: 0,
    screening: 1,
    shortlisted: 1,
    interview: 2,
    interviewed: 2,
    selected: 3,
    offer: 4,
    offer_sent: 4,
    accepted: 4,
  };

  const currentStage = stageAliases[normalizedStatus] ?? -1;
  const isRejected = normalizedStatus === "rejected";

  if (isRejected) {
    return (
      <div className="rounded-lg border border-red-100 bg-red-50 p-4">
        <p className="font-semibold text-red-700">Application rejected</p>
        <p className="mt-1 text-sm text-red-600">
          Your application is currently marked as rejected.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex min-w-[520px] items-start">
        {stages.map((stage, index) => {
          const completed = index < currentStage;
          const current = index === currentStage;
          const active = completed || current;

          return (
            <div
              key={stage}
              className="relative flex flex-1 flex-col items-center text-center"
            >
              {index > 0 && (
                <div
                  className={`absolute right-1/2 top-4 h-0.5 w-full ${
                    completed || current
                      ? "bg-blue-600"
                      : "bg-slate-200"
                  }`}
                />
              )}

              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                  active
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-500"
                } ${
                  current
                    ? "ring-4 ring-blue-100"
                    : ""
                }`}
              >
                {completed ? "✓" : index + 1}
              </div>

              <p
                className={`mt-3 text-xs font-semibold sm:text-sm ${
                  active ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {stage}
              </p>
            </div>
          );
        })}
      </div>

      {currentStage === -1 && (
        <p className="mt-4 text-sm text-slate-500">
          Current status: {status || "Not available"}
        </p>
      )}
    </div>
  );
}

