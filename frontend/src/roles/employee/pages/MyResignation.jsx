import { useEffect, useState } from "react";
import {
getMyResignation,
submitResignation,
withdrawResignation,
} from "../services/employeeService";

function formatDate(date) {
if (!date) return "—";

return new Date(date).toLocaleDateString("en-IN", {
day: "2-digit",
month: "short",
year: "numeric",
});
}

function getTodayDate() {
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, "0");
const day = String(today.getDate()).padStart(2, "0");

return `${year}-${month}-${day}`;
}

function getStatusStyle(status) {
switch (status?.toLowerCase()) {
case "approved":
return "bg-green-100 text-green-700";
case "rejected":
return "bg-red-100 text-red-700";
case "withdrawn":
return "bg-slate-100 text-slate-600";
case "completed":
return "bg-blue-100 text-blue-700";
default:
return "bg-amber-100 text-amber-700";
}
}

export default function MyResignation() {
const [resignation, setResignation] = useState(null);
const [reason, setReason] = useState("");
const [requestedLastWorkingDay, setRequestedLastWorkingDay] = useState("");
const [loading, setLoading] = useState(true);
const [submitting, setSubmitting] = useState(false);
const [withdrawing, setWithdrawing] = useState(false);
const [error, setError] = useState("");
const [success, setSuccess] = useState("");

async function loadResignation() {
try {
setLoading(true);
setError("");


  const response = await getMyResignation();
  setResignation(response.resignation || null);
} catch (err) {
  setError(err.message || "Failed to load resignation details.");
} finally {
  setLoading(false);
}


}

useEffect(() => {
loadResignation();
}, []);

async function handleSubmit(event) {
event.preventDefault();

```
setError("");
setSuccess("");

if (reason.trim().length < 10) {
  setError("Please enter a reason of at least 10 characters.");
  return;
}

if (!requestedLastWorkingDay) {
  setError("Please select your requested last working day.");
  return;
}

try {
  setSubmitting(true);

  const response = await submitResignation({
    reason: reason.trim(),
    requestedLastWorkingDay,
  });

  setResignation(response.resignation || null);
  setReason("");
  setRequestedLastWorkingDay("");
  setSuccess(response.message || "Resignation request submitted successfully.");
} catch (err) {
  setError(err.message || "Failed to submit resignation request.");
} finally {
  setSubmitting(false);
}


}

async function handleWithdraw() {
const confirmed = window.confirm(
"Are you sure you want to withdraw your resignation request?"
);

```
if (!confirmed) return;

setError("");
setSuccess("");

try {
  setWithdrawing(true);

  const response = await withdrawResignation();

  setResignation(response.resignation || null);
  setSuccess(response.message || "Resignation request withdrawn successfully.");
} catch (err) {
  setError(err.message || "Failed to withdraw resignation request.");
} finally {
  setWithdrawing(false);
}


}

const canWithdraw = resignation?.status?.toLowerCase() === "pending";

return ( <div className="space-y-6"> <div> <h1 className="text-3xl font-bold text-slate-900">
My Resignation </h1> <p className="mt-2 text-slate-500">
Manage your resignation request and its status. </p> </div>


  {error && (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {error}
    </div>
  )}

  {success && (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
      {success}
    </div>
  )}

  {loading ? (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">
        Loading resignation details...
      </p>
    </div>
  ) : resignation ? (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Your Resignation Request
        </h2>

        <span
          className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${getStatusStyle(
            resignation.status
          )}`}
        >
          {resignation.status || "Pending"}
        </span>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <p className="text-sm text-slate-500">Request Date</p>
          <p className="mt-1 font-medium text-slate-900">
            {formatDate(resignation.createdAt)}
          </p>
        </div>

        <div>
          <p className="text-sm text-slate-500">
            Requested Last Working Day
          </p>
          <p className="mt-1 font-medium text-slate-900">
            {formatDate(resignation.requestedLastWorkingDay)}
          </p>
        </div>

        <div className="sm:col-span-2">
          <p className="text-sm text-slate-500">Reason</p>
          <p className="mt-1 whitespace-pre-wrap text-slate-900">
            {resignation.reason || "—"}
          </p>
        </div>

        {resignation.reviewRemarks && (
          <div className="sm:col-span-2">
            <p className="text-sm text-slate-500">HR Remarks</p>
            <p className="mt-1 whitespace-pre-wrap text-slate-900">
              {resignation.reviewRemarks}
            </p>
          </div>
        )}
      </div>

      {canWithdraw && (
        <button
          type="button"
          onClick={handleWithdraw}
          disabled={withdrawing}
          className="mt-6 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {withdrawing ? "Withdrawing..." : "Withdraw Request"}
        </button>
      )}
    </div>
  ) : (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        Submit Resignation Request
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        Fill in the details below to submit your resignation request.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="reason"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Reason for Resignation
          </label>

          <textarea
            id="reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Enter your reason for resignation..."
            rows={5}
            minLength={10}
            maxLength={2000}
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <p className="mt-1 text-xs text-slate-400">
            Minimum 10 characters, maximum 2000 characters.
          </p>
        </div>

        <div>
          <label
            htmlFor="lastWorkingDay"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Requested Last Working Day
          </label>

          <input
            id="lastWorkingDay"
            type="date"
            value={requestedLastWorkingDay}
            onChange={(event) =>
              setRequestedLastWorkingDay(event.target.value)
            }
            min={getTodayDate()}
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit Resignation"}
        </button>
      </form>
    </div>
  )}
</div>


);
}
