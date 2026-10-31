
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  X,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  Users,
  Clock,
  LogOut,
  Loader2,
  AlertCircle,
  Download,
} from "lucide-react";
import { apiRequest } from "../api";

const DEPARTMENTS = ["it", "finance", "manager", "hr"];

const STATUS_OPTIONS = [
  "All Status",
  "Pending Approval",
  "Approved",
  "Rejected",
  "Completed",
];

const getEmployeeName = (employee) =>
  employee?.personalInfo?.name ||
  employee?.name ||
  employee?.user?.name ||
  "Employee";

const getEmployeeCode = (employee) =>
  employee?.empId || employee?.employeeId || "N/A";

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusStyle = (status) => {
  const styles = {
    "Pending Approval": "bg-amber-50 text-amber-700 border-amber-200",
    Approved: "bg-blue-50 text-blue-700 border-blue-200",
    Rejected: "bg-red-50 text-red-700 border-red-200",
    Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return styles[status] || "bg-gray-100 text-gray-600 border-gray-200";
};

const getClearanceStatus = (exit, department) =>
  exit?.clearance?.[department]?.status || "Pending";

const getLetterHref = (url) => {
  if (!url) return "";

  if (url.startsWith("http")) return url;

  const apiRoot = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, "")
    : "http://localhost:5000";

  return `${apiRoot}${url}`;
};

export default function ExitManagement() {
  const [exits, setExits] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [selectedExit, setSelectedExit] = useState(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    employeeId: "",
    resignationDate: new Date().toISOString().split("T")[0],
    lastWorkingDay: "",
    reason: "",
  });

  const fetchExits = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await apiRequest("/exits");

      setExits(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err.message || "Failed to fetch exit records");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true);

      const result = await apiRequest("/employees");

      setEmployees(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    } finally {
      setEmployeesLoading(false);
    }
  };

  useEffect(() => {
    fetchExits();
    fetchEmployees();
  }, []);

  const filteredExits = useMemo(() => {
    return exits.filter((exit) => {
      const employee = exit.employeeId;

      const employeeName = getEmployeeName(employee).toLowerCase();
      const employeeCode = getEmployeeCode(employee).toLowerCase();

      const matchesSearch =
        employeeName.includes(search.toLowerCase()) ||
        employeeCode.includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All Status" || exit.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [exits, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: exits.length,
      pending: exits.filter((e) => e.status === "Pending Approval").length,
      approved: exits.filter((e) => e.status === "Approved").length,
      completed: exits.filter((e) => e.status === "Completed").length,
    };
  }, [exits]);

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      employeeId: "",
      resignationDate: new Date().toISOString().split("T")[0],
      lastWorkingDay: "",
      reason: "",
    });
  };

  const handleCreateExit = async (e) => {
    e.preventDefault();

    try {
      setActionLoading(true);
      setError("");
      setSuccessMessage("");

      await apiRequest("/exits", {
        method: "POST",
        body: JSON.stringify(form),
      });

      setShowCreateModal(false);
      resetForm();

      setSuccessMessage("Resignation initiated successfully.");

      await fetchExits();
    } catch (err) {
      setError(err.message || "Failed to initiate resignation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = async (exit) => {
    try {
      setError("");

      const result = await apiRequest(`/exits/${exit._id}`);

      setSelectedExit(result.data);
      setShowDetailsModal(true);
    } catch (err) {
      setError(err.message || "Failed to fetch exit details");
    }
  };

  const handleApproval = async (exitId, action) => {
    const comments =
      action === "rejected"
        ? window.prompt("Enter reason for rejection:")
        : window.prompt("Enter approval comments (optional):") || "";

    if (action === "rejected" && !comments?.trim()) {
      return;
    }

    if (comments === null) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccessMessage("");

      await apiRequest(`/exits/${exitId}/approve`, {
        method: "PATCH",
        body: JSON.stringify({
          action,
          comments,
        }),
      });

      setSuccessMessage(
        action === "approved"
          ? "Exit request approved."
          : "Exit request rejected."
      );

      await fetchExits();

      if (selectedExit?._id === exitId) {
        const result = await apiRequest(`/exits/${exitId}`);
        setSelectedExit(result.data);
      }
    } catch (err) {
      setError(err.message || "Failed to review exit request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearance = async (exitId, department) => {
    const confirmClearance = window.confirm(
      `Mark ${department.toUpperCase()} clearance as completed?`
    );

    if (!confirmClearance) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccessMessage("");

      await apiRequest(`/exits/${exitId}/clearance/${department}`, {
        method: "PATCH",
      });

      setSuccessMessage(
        `${department.toUpperCase()} clearance completed.`
      );

      await fetchExits();

      const result = await apiRequest(`/exits/${exitId}`);
      setSelectedExit(result.data);
    } catch (err) {
      setError(err.message || "Failed to update clearance");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateLetters = async (exitId) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccessMessage("");

      await apiRequest(`/exits/${exitId}/letter`, {
        method: "POST",
      });

      setSuccessMessage("Exit letters generated successfully.");

      await fetchExits();

      const result = await apiRequest(`/exits/${exitId}`);
      setSelectedExit(result.data);
    } catch (err) {
      setError(err.message || "Failed to generate exit letters");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteExit = async (exitId) => {
    const confirmComplete = window.confirm(
      "Complete employee exit? Employee status will be changed to Exited."
    );

    if (!confirmComplete) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccessMessage("");

      await apiRequest(`/exits/${exitId}/complete`, {
        method: "PATCH",
      });

      setSuccessMessage("Employee exit completed successfully.");

      await fetchExits();

      const result = await apiRequest(`/exits/${exitId}`);
      setSelectedExit(result.data);
    } catch (err) {
      setError(err.message || "Failed to complete employee exit");
    } finally {
      setActionLoading(false);
    }
  };

  const allClearancesCompleted = (exit) =>
    DEPARTMENTS.every(
      (department) =>
        getClearanceStatus(exit, department) === "Completed"
    );

  const renderClearanceBadge = (status) => {
    const completed = status === "Completed";

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
          completed
            ? "bg-emerald-50 text-emerald-700"
            : "bg-amber-50 text-amber-700"
        }`}
      >
        {completed ? (
          <CheckCircle size={13} />
        ) : (
          <Clock size={13} />
        )}
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>HR</span>
            <span>/</span>
            <span className="text-slate-700">Exit Management</span>
          </div>

          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Exit Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage employee resignations, approvals and exit clearance.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchExits}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus size={17} />
            Initiate Exit
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="ml-auto"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle size={18} />
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage("")}
            className="ml-auto"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Exit Requests"
          value={stats.total}
          icon={<Users size={20} />}
          iconStyle="bg-indigo-50 text-indigo-600"
        />

        <StatCard
          title="Pending Approval"
          value={stats.pending}
          icon={<Clock size={20} />}
          iconStyle="bg-amber-50 text-amber-600"
        />

        <StatCard
          title="Approved"
          value={stats.approved}
          icon={<CheckCircle size={20} />}
          iconStyle="bg-blue-50 text-blue-600"
        />

        <StatCard
          title="Completed"
          value={stats.completed}
          icon={<LogOut size={20} />}
          iconStyle="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Exit Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Employee Exit Requests
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              View and manage all employee exit records.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 sm:w-56"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Employee</th>
                <th className="px-5 py-4 font-semibold">Resignation Date</th>
                <th className="px-5 py-4 font-semibold">Last Working Day</th>
                <th className="px-5 py-4 font-semibold">Clearance</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-16 text-center">
                    <Loader2
                      size={26}
                      className="mx-auto animate-spin text-indigo-600"
                    />
                    <p className="mt-3 text-sm text-slate-500">
                      Loading exit records...
                    </p>
                  </td>
                </tr>
              ) : filteredExits.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-16 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <LogOut size={22} />
                    </div>
                    <p className="mt-3 font-medium text-slate-700">
                      No exit records found
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Initiate an exit request or change your search.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredExits.map((exit) => {
                  const employee = exit.employeeId;

                  return (
                    <tr
                      key={exit._id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800">
                          {getEmployeeName(employee)}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {getEmployeeCode(employee)}
                          {employee?.department
                            ? ` · ${employee.department}`
                            : ""}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(exit.resignationDate)}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(exit.lastWorkingDay)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{
                                width: `${exit.clearanceProgress || 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-600">
                            {exit.clearanceProgress || 0}%
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusStyle(
                            exit.status
                          )}`}
                        >
                          {exit.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(exit)}
                            title="View details"
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
                          >
                            <Eye size={16} />
                          </button>

                          {exit.status === "Pending Approval" && (
                            <>
                              <button
                                onClick={() =>
                                  handleApproval(exit._id, "approved")
                                }
                                title="Approve"
                                className="rounded-lg border border-emerald-200 p-2 text-emerald-600 transition hover:bg-emerald-50"
                              >
                                <CheckCircle size={16} />
                              </button>

                              <button
                                onClick={() =>
                                  handleApproval(exit._id, "rejected")
                                }
                                title="Reject"
                                className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm text-slate-500">
          <span>
            Showing {filteredExits.length} of {exits.length} records
          </span>
        </div>
      </div>

      {/* Create Exit Modal */}
      {showCreateModal && (
        <Modal
          title="Initiate Employee Exit"
          subtitle="Create a resignation request for an employee."
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
        >
          <form onSubmit={handleCreateExit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Employee <span className="text-red-500">*</span>
              </label>

              <select
                value={form.employeeId}
                onChange={(e) => updateForm("employeeId", e.target.value)}
                required
                disabled={employeesLoading}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">
                  {employeesLoading
                    ? "Loading employees..."
                    : "Select employee"}
                </option>

                {employees
                  .filter((employee) => employee.status !== "Exited")
                  .map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {getEmployeeName(employee)} (
                      {getEmployeeCode(employee)})
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Resignation Date <span className="text-red-500">*</span>
                </label>

                <input
                  type="date"
                  value={form.resignationDate}
                  onChange={(e) =>
                    updateForm("resignationDate", e.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Last Working Day <span className="text-red-500">*</span>
                </label>

                <input
                  type="date"
                  value={form.lastWorkingDay}
                  min={form.resignationDate}
                  onChange={(e) =>
                    updateForm("lastWorkingDay", e.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Reason for Resignation <span className="text-red-500">*</span>
              </label>

              <textarea
                value={form.reason}
                onChange={(e) => updateForm("reason", e.target.value)}
                rows={4}
                required
                placeholder="Enter the reason for resignation..."
                className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {actionLoading && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                Submit Request
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Exit Details Modal */}
      {showDetailsModal && selectedExit && (
        <Modal
          title="Exit Request Details"
          subtitle="Review the employee's exit process and clearance."
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedExit(null);
          }}
          wide
        >
          <div className="space-y-6">
            {/* Employee details */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {getEmployeeName(selectedExit.employeeId)}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Employee ID: {getEmployeeCode(selectedExit.employeeId)}
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-medium ${getStatusStyle(
                    selectedExit.status
                  )}`}
                >
                  {selectedExit.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <InfoItem
                  label="Resignation Date"
                  value={formatDate(selectedExit.resignationDate)}
                />
                <InfoItem
                  label="Last Working Day"
                  value={formatDate(selectedExit.lastWorkingDay)}
                />
                <InfoItem
                  label="Clearance Progress"
                  value={`${selectedExit.clearanceProgress || 0}%`}
                />
              </div>

              <div className="mt-4 border-t border-slate-200 pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Resignation Reason
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {selectedExit.reason || "—"}
                </p>
              </div>
            </div>

            {/* Approval */}
            {selectedExit.status === "Pending Approval" && (
              <div className="flex flex-wrap gap-3">
                <button
                  disabled={actionLoading}
                  onClick={() =>
                    handleApproval(selectedExit._id, "approved")
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  Approve Exit
                </button>

                <button
                  disabled={actionLoading}
                  onClick={() =>
                    handleApproval(selectedExit._id, "rejected")
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <XCircle size={16} />
                  Reject Exit
                </button>
              </div>
            )}

            {/* Clearance */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">
                  Department Clearance
                </h3>
                <span className="text-sm text-slate-500">
                  {selectedExit.clearanceProgress || 0}% complete
                </span>
              </div>

              <div className="space-y-3">
                {DEPARTMENTS.map((department) => {
                  const status = getClearanceStatus(
                    selectedExit,
                    department
                  );

                  const completed = status === "Completed";

                  return (
                    <div
                      key={department}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            completed
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {completed ? (
                            <CheckCircle size={20} />
                          ) : (
                            <Clock size={20} />
                          )}
                        </div>

                        <div>
                          <p className="font-medium capitalize text-slate-800">
                            {department === "it"
                              ? "IT Department"
                              : department === "hr"
                              ? "HR Department"
                              : department === "manager"
                              ? "Reporting Manager"
                              : "Finance Department"}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {completed
                              ? `Completed on ${formatDate(
                                  selectedExit.clearance?.[department]
                                    ?.clearedAt
                                )}`
                              : "Clearance pending"}
                          </p>
                        </div>
                      </div>

                      {renderClearanceBadge(status)}

                      {selectedExit.status === "Approved" &&
                        !completed && (
                          <button
                            disabled={actionLoading}
                            onClick={() =>
                              handleClearance(
                                selectedExit._id,
                                department
                              )
                            }
                            className="rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                          >
                            Mark Complete
                          </button>
                        )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Letters */}
            <div>
              <h3 className="mb-3 font-semibold text-slate-900">
                Exit Documents
              </h3>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">
                        Relieving & Experience Letters
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Generate documents after all clearances.
                      </p>
                    </div>
                  </div>

                  {selectedExit.relievingLetterUrl &&
                  selectedExit.experienceLetterUrl ? (
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={getLetterHref(
                          selectedExit.relievingLetterUrl
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Download size={14} />
                        Relieving Letter
                      </a>

                      <a
                        href={getLetterHref(
                          selectedExit.experienceLetterUrl
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Download size={14} />
                        Experience Letter
                      </a>
                    </div>
                  ) : (
                    <button
                      disabled={
                        actionLoading ||
                        selectedExit.status !== "Approved" ||
                        !allClearancesCompleted(selectedExit)
                      }
                      onClick={() =>
                        handleGenerateLetters(selectedExit._id)
                      }
                      className="rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      Generate Letters
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Complete exit */}
            {selectedExit.status === "Approved" && (
              <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-emerald-800">
                    Complete Employee Exit
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">
                    This will update employee status to Exited.
                  </p>
                </div>

                <button
                  disabled={
                    actionLoading ||
                    !allClearancesCompleted(selectedExit) ||
                    !selectedExit.relievingLetterUrl ||
                    !selectedExit.experienceLetterUrl
                  }
                  onClick={() => handleCompleteExit(selectedExit._id)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <CheckCircle size={16} />
                  Complete Exit
                </button>
              </div>
            )}

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, iconStyle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconStyle}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function Modal({ title, subtitle, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl ${
          wide ? "max-w-3xl" : "max-w-xl"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
