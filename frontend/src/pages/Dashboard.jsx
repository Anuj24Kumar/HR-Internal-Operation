
import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  Clock,
  FileText,
  RefreshCw,
  Download,
  Search,
  TrendingUp,
  Loader2,
  AlertCircle,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

const getToken = () => localStorage.getItem("hr-auth-token");

const fetchDashboardData = async (endpoint) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Failed to fetch data");
  }

  return result.data;
};

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN").format(value || 0);

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [pipeline, setPipeline] = useState([]);
  const [pipelineTotal, setPipelineTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState("");
  const [error, setError] = useState("");

  const [exportType, setExportType] = useState("candidates");
  const [exportFormat, setExportFormat] = useState("csv");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [dashboardData, pipelineData] = await Promise.all([
        fetchDashboardData("/dashboard/hr"),
        fetchDashboardData("/dashboard/hr/pipeline"),
      ]);

      setDashboard(dashboardData);

      setPipeline(pipelineData?.pipeline || []);
      setPipelineTotal(pipelineData?.totalCandidates || 0);
    } catch (err) {
      setError(err.message || "Failed to load HR dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleExport = async () => {
    try {
      setExportLoading(`${exportType}-${exportFormat}`);
      setError("");

      const endpoint =
        `/dashboard/hr/exports?type=${exportType}&format=${exportFormat}`;

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        let message = "Export failed";

        try {
          const result = await response.json();
          message = result.message || message;
        } catch {
          // Response may not be JSON
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = `${exportType}-export.${exportFormat}`;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(err.message || "Failed to export HR data");
    } finally {
      setExportLoading("");
    }
  };

  const stats = [
    {
      title: "Total Candidates",
      value: dashboard?.totalCandidates,
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Total Employees",
      value: dashboard?.totalEmployees,
      icon: UserCheck,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Pending Approvals",
      value: dashboard?.pendingApprovals,
      icon: Clock,
      color: "bg-amber-100 text-amber-600",
    },
    {
      title: "Open Onboardings",
      value: dashboard?.openOnboardings,
      icon: FileText,
      color: "bg-purple-100 text-purple-600",
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            HR Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of recruitment, employees and HR operations.
          </p>
        </div>

        <button
          onClick={loadDashboard}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {item.title}
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {loading ? (
                      <Loader2
                        size={24}
                        className="animate-spin text-slate-400"
                      />
                    ) : (
                      formatNumber(item.value)
                    )}
                  </p>
                </div>

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.color}`}
                >
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expiring Offers */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <Clock size={20} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Expiring Offers
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {loading
                  ? "..."
                  : formatNumber(dashboard?.expiringOffers)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <TrendingUp size={20} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Total Candidate Pipeline
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {loading ? "..." : formatNumber(pipelineTotal)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Recruitment Pipeline
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Candidate distribution across recruitment stages.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2
              size={26}
              className="animate-spin text-indigo-600"
            />
          </div>
        ) : pipeline.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            No candidate pipeline data available.
          </div>
        ) : (
          <div className="space-y-5 p-5">
            {pipeline.map((item) => {
              const percentage =
                pipelineTotal > 0
                  ? Math.round((item.count / pipelineTotal) * 100)
                  : 0;

              return (
                <div key={item.stage}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium capitalize text-slate-700">
                      {String(item.stage).replace(/_/g, " ")}
                    </span>

                    <span className="text-sm font-semibold text-slate-900">
                      {formatNumber(item.count)}
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Offers Breakdown */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Offer Overview
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Offers grouped by their current status.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {(dashboard?.offers || []).length === 0 ? (
            <p className="text-sm text-slate-500">
              No offer data available.
            </p>
          ) : (
            dashboard.offers.map((offer) => (
              <div
                key={offer.status}
                className="rounded-xl border border-slate-200 p-4"
              >
                <p className="text-sm capitalize text-slate-500">
                  {String(offer.status).replace(/_/g, " ")}
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatNumber(offer.count)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Export */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Export HR Data
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Download candidate, employee or offer data.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Data Type
            </label>

            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="candidates">Candidates</option>
              <option value="employees">Employees</option>
              <option value="offers">Offers</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              File Format
            </label>

            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="csv">CSV</option>
              <option value="xlsx">Excel (.xlsx)</option>
            </select>
          </div>

          <button
            onClick={handleExport}
            disabled={Boolean(exportLoading)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {exportLoading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Download size={17} />
            )}

            {exportLoading ? "Exporting..." : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}
