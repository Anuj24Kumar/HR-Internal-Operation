
import { useEffect, useState } from "react";
import { getMyEmployeeLetters } from "../services/employeeService.js";
import { apiRequest } from "../../../api.js";

const LETTER_TYPE_LABELS = {
  offer: "Offer Letter",
  appointment: "Appointment Letter",
  promotion: "Promotion Letter",
  increment: "Increment Letter",
  experience: "Experience Letter",
  other: "Other",
};

function formatDate(date) {
  if (!date) return "Not available";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getLetterType(type) {
  return LETTER_TYPE_LABELS[type] || type || "Not available";
}

export default function MyLetters() {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    async function fetchLetters() {
      try {
        setLoading(true);
        setError("");

        const response = await getMyEmployeeLetters();

        setLetters(response.letters || []);
      } catch (err) {
        setError(err.message || "Unable to load employment letters.");
      } finally {
        setLoading(false);
      }
    }

    fetchLetters();
  }, []);

  async function handleDownload(letter) {
    try {
      setError("");
      setDownloadingId(letter._id);

      const token = localStorage.getItem("hr-auth-token");

      if (!token) {
        throw new Error("Your session has expired. Please log in again.");
      }

      const apiBaseUrl = import.meta.env.VITE_API_URL || "/api/v1";

      const response = await fetch(
        `${apiBaseUrl}/employees/letters/${letter._id}/pdf`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        let message = "Unable to download letter.";

        try {
          const result = await response.json();
          message = result.message || message;
        } catch {
          // Keep the default download error message.
        }

        throw new Error(message);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${letter.title || "Employment-Letter"}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(err.message || "Unable to download letter.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          My Letters
        </h1>

        <p className="mt-2 text-slate-500">
          Access your official employment letters.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Letters List */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Official Letters
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Letters issued for your employment.
            </p>
          </div>

          {!loading && !error && (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              {letters.length} letter{letters.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <p className="mt-5 text-sm text-slate-500">
            Loading your letters...
          </p>
        )}

        {/* Empty State */}
        {!loading && !error && letters.length === 0 && (
          <div className="mt-5 rounded-lg bg-slate-50 p-8 text-center">
            <h3 className="font-medium text-slate-700">
              No official letters found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Letters issued to you will appear here.
            </p>
          </div>
        )}

        {/* Letters Table */}
        {!loading && !error && letters.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    Letter Title
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    Letter Type
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    Issued Date
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    Version
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {letters.map((letter) => (
                  <tr
                    key={letter._id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-4 text-sm font-medium text-slate-800">
                      {letter.title || "Not available"}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {getLetterType(letter.letterType)}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {formatDate(letter.issuedAt)}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {letter.version ?? "Not available"}
                    </td>

                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => handleDownload(letter)}
                        disabled={downloadingId === letter._id}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {downloadingId === letter._id
                          ? "Downloading..."
                          : "Download PDF"}
                      </button>
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

