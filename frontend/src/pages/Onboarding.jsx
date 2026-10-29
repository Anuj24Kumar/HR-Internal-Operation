
import { useEffect, useMemo, useState } from "react";
import {
  ClipboardCheck,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  RefreshCw,
  X,
  Eye,
  Trash2,
  CircleCheck,
  Circle,
  CalendarDays,
  UserRound,
  AlertCircle,
} from "lucide-react";
import { apiRequest } from "../api";

const initialTask = {
  title: "",
  description: "",
  owner: "HR",
  dueDate: "",
};

const statusOptions = ["Pending", "In Progress", "Completed"];

const getEmployeeName = (employee) => {
  if (!employee) return "Employee";

  const info = employee.personalInfo || {};

  return (
    info.fullName ||
    [info.firstName, info.lastName].filter(Boolean).join(" ") ||
    employee.name ||
    employee.empId ||
    "Employee"
  );
};

const getEmployeeCode = (employee) =>
  employee?.empId || employee?._id || "—";

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getProgressStatus = (progress = 0) => {
  if (progress >= 100) return "Completed";
  if (progress > 0) return "In Progress";
  return "Pending";
};

const statusStyle = {
  Completed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  "In Progress": "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  Pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
};

function ProgressBar({ progress = 0 }) {
  return (
    <div className="flex min-w-[120px] items-center gap-3">
      <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-300"
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-600">{progress}%</span>
    </div>
  );
}

function Modal({ title, subtitle, onClose, children, wide = false }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`max-h-[90vh] w-full ${
          wide ? "max-w-3xl" : "max-w-xl"
        } overflow-y-auto rounded-2xl bg-white shadow-2xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={19} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function Field({ label, children, required = false }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

const inputStyle =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50";

export default function Onboarding() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [newTasks, setNewTasks] = useState([{ ...initialTask }]);
  const [creating, setCreating] = useState(false);

  const [showAddTask, setShowAddTask] = useState(false);
  const [taskForm, setTaskForm] = useState({ ...initialTask });
  const [savingTask, setSavingTask] = useState(false);

  const [savingStatus, setSavingStatus] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState("");

  const loadOnboarding = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await apiRequest("/onboarding");
      setRecords(result.data || []);
    } catch (err) {
      setError(err.message || "Failed to load onboarding records");
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const result = await apiRequest("/employees");
      const list = result.data || result.employees || [];
      setEmployees(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Employee fetch error:", err);
    }
  };

  useEffect(() => {
    loadOnboarding();
    loadEmployees();
  }, []);

  const stats = useMemo(() => {
    return {
      total: records.length,
      completed: records.filter((record) => record.progress === 100).length,
      inProgress: records.filter(
        (record) => record.progress > 0 && record.progress < 100
      ).length,
      pending: records.filter((record) => record.progress === 0).length,
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const employee = record.employeeId;
      const employeeName = getEmployeeName(employee).toLowerCase();
      const employeeCode = getEmployeeCode(employee).toLowerCase();

      const matchesSearch =
        employeeName.includes(search.toLowerCase()) ||
        employeeCode.includes(search.toLowerCase());

      const status = getProgressStatus(record.progress);

      const matchesStatus =
        statusFilter === "All" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  const employeesWithoutChecklist = useMemo(() => {
    const existingIds = records.map((record) =>
      String(record.employeeId?._id || record.employeeId)
    );

    return employees.filter(
      (employee) => !existingIds.includes(String(employee._id))
    );
  }, [employees, records]);

  const handleCreateOnboarding = async (event) => {
    event.preventDefault();

    if (!selectedEmployee) {
      setError("Please select an employee");
      return;
    }

    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const tasks = newTasks
        .filter((task) => task.title.trim())
        .map((task) => ({
          title: task.title.trim(),
          description: task.description.trim(),
          owner: task.owner || "HR",
          dueDate: task.dueDate || null,
        }));

      await apiRequest("/onboarding", {
        method: "POST",
        body: JSON.stringify({
          employeeId: selectedEmployee,
          tasks,
        }),
      });

      setShowCreateModal(false);
      setSelectedEmployee("");
      setNewTasks([{ ...initialTask }]);

      setSuccess("Onboarding checklist created successfully");

      await loadOnboarding();
      await loadEmployees();
    } catch (err) {
      setError(err.message || "Failed to create onboarding checklist");
    } finally {
      setCreating(false);
    }
  };

  const openDetails = async (record) => {
    setError("");
    setSuccess("");
    setSelectedRecord(record);

    const employeeId = record.employeeId?._id || record.employeeId;

    try {
      const result = await apiRequest(`/onboarding/${employeeId}`);
      setSelectedRecord(result.data);
    } catch (err) {
      setError(err.message || "Failed to load onboarding details");
    }
  };

  const refreshSelectedRecord = async (record) => {
    const employeeId = record.employeeId?._id || record.employeeId;
    const result = await apiRequest(`/onboarding/${employeeId}`);
    setSelectedRecord(result.data);
  };

  const updateTaskStatus = async (record, task, status) => {
    setSavingStatus(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest(`/onboarding/${record._id}/tasks/${task._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      setSuccess("Task status updated successfully");

      await loadOnboarding();
      await refreshSelectedRecord(record);
    } catch (err) {
      setError(err.message || "Failed to update task");
    } finally {
      setSavingStatus(false);
    }
  };

  const addTask = async (event) => {
    event.preventDefault();

    if (!taskForm.title.trim()) {
      setError("Task title is required");
      return;
    }

    setSavingTask(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest(`/onboarding/${selectedRecord._id}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          title: taskForm.title.trim(),
          description: taskForm.description.trim(),
          owner: taskForm.owner || "HR",
          dueDate: taskForm.dueDate || null,
        }),
      });

      setShowAddTask(false);
      setTaskForm({ ...initialTask });

      setSuccess("Task added successfully");

      await loadOnboarding();
      await refreshSelectedRecord(selectedRecord);
    } catch (err) {
      setError(err.message || "Failed to add task");
    } finally {
      setSavingTask(false);
    }
  };

  const deleteTask = async (record, task) => {
    if (!window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      return;
    }

    setDeletingTaskId(task._id);
    setError("");
    setSuccess("");

    try {
      await apiRequest(`/onboarding/${record._id}/tasks/${task._id}`, {
        method: "DELETE",
      });

      setSuccess("Task deleted successfully");

      await loadOnboarding();
      await refreshSelectedRecord(record);
    } catch (err) {
      setError(err.message || "Failed to delete task");
    } finally {
      setDeletingTaskId("");
    }
  };

  const updateNewTask = (index, field, value) => {
    setNewTasks((previous) =>
      previous.map((task, taskIndex) =>
        taskIndex === index ? { ...task, [field]: value } : task
      )
    );
  };

  const openCreateModal = () => {
    setError("");
    setSuccess("");
    setSelectedEmployee("");
    setNewTasks([{ ...initialTask }]);
    setShowCreateModal(true);
  };

  return (
    <section className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[1.2px] text-slate-400">
            HR Workspace / People Operations
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Onboarding Tracker
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Manage new joiner checklists, task ownership and onboarding progress.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadOnboarding}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus size={17} />
            Create Onboarding
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CircleCheck size={17} className="mt-0.5 shrink-0" />
          <span className="flex-1">{success}</span>
          <button onClick={() => setSuccess("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Total Onboarding",
            value: stats.total,
            subtitle: "Employee checklists",
            icon: ClipboardCheck,
            iconStyle: "bg-indigo-50 text-indigo-600",
          },
          {
            title: "Completed",
            value: stats.completed,
            subtitle: "100% progress",
            icon: CheckCircle2,
            iconStyle: "bg-emerald-50 text-emerald-600",
          },
          {
            title: "In Progress",
            value: stats.inProgress,
            subtitle: "Checklist started",
            icon: Clock,
            iconStyle: "bg-violet-50 text-violet-600",
          },
          {
            title: "Pending",
            value: stats.pending,
            subtitle: "Not started yet",
            icon: Users,
            iconStyle: "bg-amber-50 text-amber-600",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {item.title}
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-800">
                    {item.value}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-400">
                    {item.subtitle}
                  </p>
                </div>

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconStyle}`}
                >
                  <Icon size={21} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Onboarding records table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-5 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Employee Onboarding
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Track onboarding progress across employees.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-400 focus-within:border-indigo-400">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employee..."
                className="w-full min-w-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:w-48"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-indigo-400"
            >
              <option value="All">All status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
            <RefreshCw size={19} className="animate-spin text-indigo-600" />
            Loading onboarding records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <ClipboardCheck size={26} />
            </div>

            <h3 className="text-sm font-bold text-slate-800">
              No onboarding records found
            </h3>

            <p className="mt-1.5 max-w-sm text-xs leading-5 text-slate-500">
              {records.length === 0
                ? "Create an onboarding checklist for an employee to get started."
                : "Try changing your search or status filter."}
            </p>

            {records.length === 0 && (
              <button
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Plus size={16} />
                Create Onboarding
              </button>
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="bg-slate-50">
                  {[
                    "EMPLOYEE",
                    "DEPARTMENT",
                    "JOINING DATE",
                    "TASKS",
                    "PROGRESS",
                    "STATUS",
                    "ACTION",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-5 py-3.5 text-[10px] font-bold tracking-wide text-slate-400"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((record) => {
                  const employee = record.employeeId || {};
                  const tasks = record.tasks || [];
                  const completedTasks = tasks.filter(
                    (task) => task.status === "Completed"
                  ).length;
                  const status = getProgressStatus(record.progress);

                  return (
                    <tr
                      key={record._id}
                      className="border-t border-slate-100 transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600">
                            {getEmployeeName(employee)
                                  .charAt(0)
                                  .toUpperCase()}
                          </div>
                          <div>
                            <p className="whitespace-nowrap text-sm font-semibold text-slate-700">
                              {getEmployeeName(employee)}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {getEmployeeCode(employee)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                        {employee.department?.name ||
                          employee.department ||
                          "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                        {formatDate(employee.joiningDate)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-600">
                        {completedTasks}/{tasks.length}
                      </td>

                      <td className="px-5 py-4">
                        <ProgressBar progress={record.progress || 0} />
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-semibold ${statusStyle[status]}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <button
                          onClick={() => openDetails(record)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-600 transition hover:border-indigo-200 hover:bg-indigo-50"
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-100 px-5 py-3.5 text-xs text-slate-400">
          Showing {filteredRecords.length} of {records.length} onboarding records
        </div>
      </div>

      {/* Create onboarding modal */}
      {showCreateModal && (
        <Modal
          title="Create Onboarding"
          subtitle="Create a checklist for an employee."
          onClose={() => setShowCreateModal(false)}
        >
          <form onSubmit={handleCreateOnboarding} className="p-6">
            <Field label="Employee" required>
              <select
                value={selectedEmployee}
                onChange={(event) => setSelectedEmployee(event.target.value)}
                required
                className={inputStyle}
              >
                <option value="">Select employee</option>
                {employeesWithoutChecklist.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {getEmployeeName(employee)} ({getEmployeeCode(employee)})
                  </option>
                ))}
              </select>
            </Field>

            {employeesWithoutChecklist.length === 0 && (
              <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
                All employees already have a checklist, or no employees are available.
              </div>
            )}

            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-700">
                  Checklist Tasks
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Add tasks to this employee's onboarding.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setNewTasks((previous) => [
                    ...previous,
                    { ...initialTask },
                  ])
                }
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <Plus size={15} />
                Add task
              </button>
            </div>

            <div className="max-h-[330px] space-y-3 overflow-y-auto pr-1">
              {newTasks.map((task, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <Field label="Task title">
                    <input
                      value={task.title}
                      onChange={(event) =>
                        updateNewTask(index, "title", event.target.value)
                      }
                      placeholder="e.g. Document verification"
                      className={inputStyle}
                    />
                  </Field>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Owner">
                      <input
                        value={task.owner}
                        onChange={(event) =>
                          updateNewTask(index, "owner", event.target.value)
                        }
                        placeholder="HR, IT, Manager..."
                        className={inputStyle}
                      />
                    </Field>

                    <Field label="Due date">
                      <input
                        type="date"
                        value={task.dueDate}
                        onChange={(event) =>
                          updateNewTask(index, "dueDate", event.target.value)
                        }
                        className={inputStyle}
                      />
                    </Field>
                  </div>

                  <Field label="Description">
                    <textarea
                      value={task.description}
                      onChange={(event) =>
                        updateNewTask(index, "description", event.target.value)
                      }
                      rows={2}
                      placeholder="Optional description"
                      className={inputStyle}
                    />
                  </Field>

                  {newTasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setNewTasks((previous) =>
                          previous.filter((_, taskIndex) => taskIndex !== index)
                        )
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                      Remove task
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={creating || !selectedEmployee}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Checklist"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Onboarding details modal */}
      {selectedRecord && (
        <Modal
          title="Onboarding Details"
          subtitle="Manage employee onboarding tasks and progress."
          onClose={() => setSelectedRecord(null)}
          wide
        >
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-lg font-bold text-indigo-600">
                {getEmployeeName(selectedRecord.employeeId)
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <h3 className="font-bold text-slate-800">
                  {getEmployeeName(selectedRecord.employeeId)}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {getEmployeeCode(selectedRecord.employeeId)} ·{" "}
                  {selectedRecord.employeeId?.department?.name ||
                    selectedRecord.employeeId?.department ||
                    "Department not specified"}
                </p>
              </div>
            </div>

            <div className="my-5 rounded-xl bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  Overall progress
                </span>
                <span className="text-lg font-bold text-indigo-600">
                  {selectedRecord.progress || 0}%
                </span>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all"
                  style={{
                    width: `${selectedRecord.progress || 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Checklist Tasks
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedRecord.tasks?.filter(
                    (task) => task.status === "Completed"
                  ).length || 0}{" "}
                  of {selectedRecord.tasks?.length || 0} completed
                </p>
              </div>

              <button
                onClick={() => setShowAddTask(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                <Plus size={15} />
                Add task
              </button>
            </div>

            <div className="space-y-3">
              {!selectedRecord.tasks?.length ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
                  No tasks in this checklist yet.
                </div>
              ) : (
                selectedRecord.tasks.map((task) => (
                  <div
                    key={task._id}
                    className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={`mt-0.5 ${
                          task.status === "Completed"
                            ? "text-emerald-600"
                            : "text-slate-300"
                        }`}
                      >
                        {task.status === "Completed" ? (
                          <CircleCheck size={19} />
                        ) : (
                          <Circle size={19} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-slate-700">
                          {task.title}
                        </h4>

                        {task.description && (
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {task.description}
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <UserRound size={13} />
                            {task.owner || "HR"}
                          </span>

                          <span className="inline-flex items-center gap-1">
                            <CalendarDays size={13} />
                            {formatDate(task.dueDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <select
                        value={task.status}
                        disabled={savingStatus}
                        onChange={(event) =>
                          updateTaskStatus(
                            selectedRecord,
                            task,
                            event.target.value
                          )
                        }
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 outline-none focus:border-indigo-400"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => deleteTask(selectedRecord, task)}
                        disabled={deletingTaskId === task._id}
                        title="Delete task"
                        className="rounded-lg border border-slate-200 p-2 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Add task modal */}
      {showAddTask && selectedRecord && (
        <Modal
          title="Add Onboarding Task"
          subtitle="Add a new task to this employee's checklist."
          onClose={() => setShowAddTask(false)}
        >
          <form onSubmit={addTask} className="p-6">
            <Field label="Task title" required>
              <input
                value={taskForm.title}
                onChange={(event) =>
                  setTaskForm({ ...taskForm, title: event.target.value })
                }
                placeholder="Enter task title"
                required
                className={inputStyle}
              />
            </Field>

            <Field label="Description">
              <textarea
                value={taskForm.description}
                onChange={(event) =>
                  setTaskForm({ ...taskForm, description: event.target.value })
                }
                rows={3}
                placeholder="Enter task description"
                className={inputStyle}
              />
            </Field>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Owner">
                <input
                  value={taskForm.owner}
                  onChange={(event) =>
                    setTaskForm({ ...taskForm, owner: event.target.value })
                  }
                  placeholder="HR, IT, Manager..."
                  className={inputStyle}
                />
              </Field>

              <Field label="Due date">
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(event) =>
                    setTaskForm({ ...taskForm, dueDate: event.target.value })
                  }
                  className={inputStyle}
                />
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowAddTask(false)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={savingTask}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingTask ? "Adding..." : "Add Task"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
