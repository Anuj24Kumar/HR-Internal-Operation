
import { useEffect, useState } from "react";
import { getMyEmploymentHistory } from "../services/employeeService.js";

export default function MyHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        setError("");

        const response = await getMyEmploymentHistory();
        setHistory(response.history || []);
      } catch (err) {
        setError(err.message || "Unable to load employment history.");
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  function formatDate(date) {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Employment History
        </h1>
        <p className="mt-2 text-slate-500">
          View your employment changes, promotions and salary updates.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Employment History
        </h2>

        {loading && (
          <p className="mt-4 text-sm text-slate-500">
            Loading employment history...
          </p>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <div className="mt-4 rounded-lg bg-slate-50 p-5 text-center">
            <p className="font-medium text-slate-700">
              No employment history found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Employment changes will appear here when available.
            </p>
          </div>
        )}

        {!loading && !error && history.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    Change Type
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    Previous Designation
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    New Designation
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    Effective Date
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    Remarks
                  </th>
                </tr>
              </thead>

              <tbody>
                {history.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-4 text-sm capitalize text-slate-800">
                      {item.changeType?.replaceAll("_", " ") ||
                        "Not available"}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {item.previousDesignation || "Not available"}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {item.newDesignation || "Not available"}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {formatDate(item.effectiveDate)}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {item.remarks || "Not available"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

