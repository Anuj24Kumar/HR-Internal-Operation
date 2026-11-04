import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users, Search, RefreshCw, Eye, Pencil, History, Plus, X,
  UserRound, Building2, BriefcaseBusiness, CalendarDays, Mail, Phone,
  AlertCircle, CheckCircle2, Clock3, FileText, ExternalLink, ArrowRightCircle,
  GraduationCap, ClipboardCheck,
} from "lucide-react";
import { apiRequest } from "../api.js";
import DataTable from "../components/DataTable.jsx";
import { useAlert } from "../components/AlertProvider.jsx";
import { useNavigate } from "react-router-dom";

const STATUSES = ["active", "notice", "exited", "completed", "terminated"];
const HISTORY_TYPES = ["promotion", "transfer", "increment"];

const EMPTY_EDIT = {
  department: "",
  designation: "",
  type: "employee",
  joiningDate: "",
};

const EMPTY_HISTORY = {
  historyType: "promotion",
  reason: "",
  oldDepartment: "",
  newDepartment: "",
  oldDesignation: "",
  newDesignation: "",
  oldSalary: "",
  newSalary: "",
};

const EMPTY_CONVERSION = {
  offerId: "",
  targetRole: "employee",
  designation: "",
  department: "",
  joiningDate: "",
  salary: "",
  domain: "",
  track: "",
  stipend: "",
  location: "",
  managerId: "",
  mentorId: "",
  employmentType: "full_time",
  startDate: "",
  endDate: "",
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const dateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const titleCase = (value) =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const normalizeStatus = (status) =>
  String(status || "").toLowerCase().trim();

function employeeName(employee) {
  if (!employee) return "—";
  if (employee.name) return employee.name;
  const p = employee.personalInfo || {};
  return [p.firstName, p.lastName].filter(Boolean).join(" ") || employee.email || "—";
}

function employeeCode(employee) {
  return employee?.empId || employee?.employeeCode || "—";
}

function StatusBadge({ status }) {
  const norm = normalizeStatus(status);
  const styles = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    notice: "bg-amber-50 text-amber-700 border-amber-200",
    exited: "bg-rose-50 text-rose-700 border-rose-200",
    completed: "bg-blue-50 text-blue-700 border-blue-200",
    terminated: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[norm] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
      {titleCase(status || "active")}
    </span>
  );
}

export default function Employees({ initialRoleTab = "employee" }) {
  const alert = useAlert();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [acceptedOffers, setAcceptedOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [activeRoleTab, setActiveRoleTab] = useState(initialRoleTab);

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loadingEmployeeDetails, setLoadingEmployeeDetails] = useState(false);
  const [creatingOnboarding, setCreatingOnboarding] = useState(false);
  const [onboardingError, setOnboardingError] = useState("");
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [savingEdit, setSavingEdit] = useState(false);
  const [updatingId, setUpdatingId] = useState("");

  const [historyEmployee, setHistoryEmployee] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [showHistoryForm, setShowHistoryForm] = useState(false);
  const [historyForm, setHistoryForm] = useState(EMPTY_HISTORY);
  const [savingHistory, setSavingHistory] = useState(false);

  // Conversion Modal State
  const [convertingOffer, setConvertingOffer] = useState(null);
  const [conversionForm, setConversionForm] = useState(EMPTY_CONVERSION);
  const [savingConversion, setSavingConversion] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const roleParam = ["intern", "employee"].includes(activeRoleTab) ? `?role=${activeRoleTab}` : "";
      const [empRes, offersRes] = await Promise.all([
        apiRequest(`/employees${roleParam}`),
        activeRoleTab === "accepted"
          ? apiRequest("/employees/accepted-offers")
          : Promise.resolve(null),
      ]);

      const empData = empRes.data ?? empRes.users ?? [];
      setEmployees(Array.isArray(empData) ? empData : []);
      if (offersRes) {
        setAcceptedOffers(Array.isArray(offersRes.data) ? offersRes.data : []);
      }
    } catch (err) {
      setError(err.message || "Unable to load employee records.");
    } finally {
      setLoading(false);
    }
  }, [activeRoleTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const departments = useMemo(
    () => [...new Set(employees.map((e) => e.department).filter(Boolean))].sort(),
    [employees]
  );

  const designations = useMemo(
    () => [...new Set(employees.map((e) => e.designation).filter(Boolean))].sort(),
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();
    return employees.filter((employee) => {
      const p = employee.personalInfo || {};
      const searchable = [
        employeeName(employee),
        employeeCode(employee),
        p.email,
        p.phone,
        employee.email,
        employee.department,
        employee.designation,
        employee.role,
        employee.type,
        employee.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!term || searchable.includes(term)) &&
        (!departmentFilter || employee.department === departmentFilter) &&
        (!designationFilter || employee.designation === designationFilter) &&
        (!statusFilter || normalizeStatus(employee.status) === statusFilter)
      );
    });
  }, [employees, search, departmentFilter, designationFilter, statusFilter]);

  const stats = useMemo(
    () => ({
      total: employees.length,
      employees: employees.filter((e) => e.role === "employee").length,
      interns: employees.filter((e) => e.role === "intern").length,
      active: employees.filter((e) => normalizeStatus(e.status) === "active").length,
    }),
    [employees]
  );

  async function openDetails(employee) {
    setError("");
    setOnboardingError("");
    setSelectedEmployee(employee);
    setLoadingEmployeeDetails(true);
    try {
      const result = await apiRequest(`/employees/${employee._id}`);
      if (result.data) {
        setSelectedEmployee(result.data);
      }
    } catch (err) {
      setError(err.message || "Unable to load employee details.");
    } finally {
      setLoadingEmployeeDetails(false);
    }
  }

  async function createOnboarding() {
    if (!selectedEmployee?._id || creatingOnboarding || selectedEmployee.onboarding) return;

    setCreatingOnboarding(true);
    setOnboardingError("");
    try {
      const result = await apiRequest("/onboarding", {
        method: "POST",
        body: JSON.stringify({ employeeId: selectedEmployee._id }),
      });
      setSelectedEmployee((current) =>
        current?._id === selectedEmployee._id
          ? { ...current, onboarding: result.data }
          : current
      );
      alert.toastSuccess("Onboarding created", `A checklist was created for ${employeeName(selectedEmployee)}.`);
    } catch (err) {
      setOnboardingError(err.message || "Unable to create onboarding checklist.");
    } finally {
      setCreatingOnboarding(false);
    }
  }

  async function startEditing(employee) {
    setError("");
    try {
      const result = await apiRequest(`/employees/${employee._id}`);
      const record = result.data?.user || result.data || employee;
      setEditForm({
        department: record.department || "",
        designation: record.designation || "",
        type: record.role || record.type || "employee",
        joiningDate: dateInput(record.joiningDate),
      });
      setEditingEmployee(record);
    } catch (err) {
      setError(err.message || "Unable to load employee for editing.");
    }
  }

  async function saveEmployeeEdit(event) {
    event.preventDefault();
    setSavingEdit(true);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest(`/employees/${editingEmployee._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          department: editForm.department.trim(),
          designation: editForm.designation.trim(),
          role: editForm.type,
          type: editForm.type,
          joiningDate: editForm.joiningDate ? new Date(`${editForm.joiningDate}T00:00:00`).toISOString() : undefined,
        }),
      });
      setNotice(result.message || "Employee updated successfully.");
      setEditingEmployee(null);
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to update employee.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function updateStatus(employee, status) {
    const confirmed = await alert.confirm({
      title: "Change account status?",
      message: `Change ${employeeName(employee)}'s status to ${titleCase(status)}?`,
      confirmText: "Update status",
      type: "warning",
    });
    if (!confirmed) return;
    setUpdatingId(employee._id);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest(`/employees/${employee._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setNotice(result.message || "Status updated successfully.");
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to update status.");
    } finally {
      setUpdatingId("");
    }

    async function reviewDocument(document, action) {
      const id = document._id;
      let body;
      if (action === "verify") {
        const confirmed = await alert.confirm({
          title: "Verify document?",
          message: `Mark ${document.label || document.originalName || "this document"} as verified?`,
          confirmText: "Verify",
        });
        if (!confirmed) return;
      } else {
        const reason = await alert.prompt({
          title: "Reject document",
          message: "Provide a reason for rejecting this document.",
          placeholder: "Rejection reason",
          confirmText: "Reject",
          required: true,
          multiline: true,
        });
        if (!reason) return;
        body = { reason };
      }

      try {
        await apiRequest(`/documents/${id}/${action}`, {
          method: "PATCH",
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
        await openDetails(selectedEmployee);
      } catch (err) {
        setError(err.message || `Unable to ${action} document.`);
      }
    }
  }

  async function loadEmployeeHistory(employee) {
    setHistoryEmployee(employee);
    setHistoryLoading(true);
    setHistoryError("");
    setHistoryRecords([]);
    try {
      const result = await apiRequest(`/employees/${employee._id}/history`);
      setHistoryRecords(Array.isArray(result.data) ? result.data : result.history || []);
    } catch (err) {
      setHistoryError(err.message || "Unable to load history.");
    } finally {
      setHistoryLoading(false);
    }
  }

  // Open Conversion Modal
  function openConversionModal(offer, targetRole = offer.offerType === "intern" ? "intern" : "employee") {
    setConvertingOffer(offer);
    setConversionForm({
      offerId: offer._id,
      targetRole,
      designation: offer.designation || "",
      department: "",
      joiningDate: dateInput(offer.joiningDate),
      salary: offer.salary || "",
      domain: "",
      track: "",
      stipend: offer.offerType === "intern" ? offer.salary || "" : "",
      location: "",
      managerId: "",
      mentorId: "",
      employmentType: "full_time",
      startDate: dateInput(offer.joiningDate),
      endDate: "",
    });
  }

  async function handleConvertCandidate(e) {
    e.preventDefault();
    setSavingConversion(true);
    setError("");
    setNotice("");

    try {
      const body = {
        offerId: conversionForm.offerId,
        targetRole: conversionForm.targetRole,
        designation: conversionForm.designation.trim(),
        department: conversionForm.department.trim(),
        joiningDate: conversionForm.joiningDate
          ? new Date(`${conversionForm.joiningDate}T00:00:00`).toISOString()
          : undefined,
        location: conversionForm.location.trim() || undefined,
      };

      if (conversionForm.targetRole === "employee") {
        if (conversionForm.salary) body.salary = Number(conversionForm.salary);
        body.managerId = conversionForm.managerId || undefined;
        body.employmentType = conversionForm.employmentType;
      } else {
        if (conversionForm.domain) body.domain = conversionForm.domain.trim();
        if (conversionForm.track) body.track = conversionForm.track.trim();
        if (conversionForm.stipend) body.stipend = Number(conversionForm.stipend);
        body.mentorId = conversionForm.mentorId || undefined;
        body.startDate = conversionForm.startDate ? new Date(`${conversionForm.startDate}T00:00:00`).toISOString() : undefined;
        body.endDate = conversionForm.endDate ? new Date(`${conversionForm.endDate}T00:00:00`).toISOString() : undefined;
      }

      const res = await apiRequest("/employees/convert", {
        method: "POST",
        body: JSON.stringify(body),
      });

      setNotice(res.message || "Candidate converted successfully!");
      alert.toastSuccess("Converted!", `The user can now log in as ${conversionForm.targetRole}.`);
      setAcceptedOffers((current) =>
        current.filter((offer) => String(offer._id) !== String(conversionForm.offerId))
      );
      setConvertingOffer(null);
      await loadData();
    } catch (err) {
      setError(err.message || "Conversion failed.");
    } finally {
      setSavingConversion(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">HR Workspace</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Employees & Interns</h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage converted employees and interns, review accepted offers, and track employment records.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="ml-auto"><X size={16} /></button>
        </div>
      )}
      {notice && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 size={18} className="flex-shrink-0" />
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} className="ml-auto"><X size={16} /></button>
        </div>
      )}

      {/* Accepted Offers Section (Candidates Ready for Conversion) */}
      {activeRoleTab === "accepted" && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-emerald-100 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-emerald-600" size={20} />
              <h2 className="text-base font-bold text-slate-900">
                Accepted Offers Ready for Account Conversion ({acceptedOffers.length})
              </h2>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Action Required</span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {acceptedOffers.map((offer) => (
              <div key={offer._id} className="flex flex-col justify-between rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">{offer.candidateId?.name || "Candidate"}</h3>
                      <p className="text-xs text-slate-500">{offer.candidateId?.email || "—"}</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold capitalize text-blue-700">
                      {offer.offerType}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    <p><span className="font-medium text-slate-800">Role:</span> {offer.designation}</p>
                    <p><span className="font-medium text-slate-800">Compensation:</span> ₹{Number(offer.salary || 0).toLocaleString("en-IN")}</p>
                    <p><span className="font-medium text-slate-800">Joining Date:</span> {formatDate(offer.joiningDate)}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openConversionModal(offer, "intern")}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700 shadow-sm"
                    >
                      <ArrowRightCircle size={14} /> Convert to Intern
                    </button>
                    <button
                      type="button"
                      onClick={() => openConversionModal(offer, "employee")}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 shadow-sm"
                    >
                      <ArrowRightCircle size={14} /> Convert to Employee
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total People", value: stats.total, icon: Users, tone: "bg-blue-50 text-blue-600" },
          { label: "Full-Time Employees", value: stats.employees, icon: BriefcaseBusiness, tone: "bg-indigo-50 text-indigo-600" },
          { label: "Interns", value: stats.interns, icon: GraduationCap, tone: "bg-violet-50 text-violet-600" },
          { label: "Active Status", value: stats.active, icon: UserRound, tone: "bg-emerald-50 text-emerald-600" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${item.tone}`}><Icon size={21} /></span>
                <div>
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{item.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs & Search / Filter Controls */}
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        {/* Tab Toggle */}
        <div className="flex border-b border-slate-200 pb-3 gap-2">
          {[
            { id: "all", label: "All Staff", count: stats.total },
            { id: "employee", label: "Employees", count: stats.employees },
            { id: "intern", label: "Interns", count: stats.interns },
            { id: "accepted", label: "Accepted Offers", count: acceptedOffers.length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveRoleTab(tab.id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeRoleTab === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {activeRoleTab !== "accepted" && (
          <>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3">
              <Search size={17} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, employee ID, email..."
                className="w-full min-w-0 bg-transparent py-3 text-sm outline-none"
              />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm">
                <option value="">All departments</option>
                {departments.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              <select value={designationFilter} onChange={(e) => setDesignationFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm">
                <option value="">All designations</option>
                {designations.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm">
                <option value="">All statuses</option>
                {STATUSES.map((v) => <option key={v} value={v}>{titleCase(v)}</option>)}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Main Table */}
      {activeRoleTab !== "accepted" && <DataTable
        columns={[
          {
            key: "employee",
            label: "Member",
            render: (e) => (
              <div className="flex min-w-40 items-center gap-3">
                <div className={`grid h-10 w-10 place-items-center rounded-full font-semibold ${
                  e.role === "intern" ? "bg-violet-50 text-violet-700" : "bg-blue-50 text-blue-700"
                }`}>
                  {employeeName(e).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{employeeName(e)}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{employeeCode(e)} · {e.email}</p>
                </div>
              </div>
            ),
          },
          { key: "role", label: "Role Type", render: (e) => <span className="capitalize font-medium">{e.role || e.type || "—"}</span> },
          { key: "department", label: "Department", render: (e) => e.department || "—" },
          { key: "designation", label: "Designation", render: (e) => e.designation || "—" },
          { key: "joiningDate", label: "Joining Date", render: (e) => formatDate(e.joiningDate) },
          { key: "status", label: "Status", render: (e) => <StatusBadge status={e.status} /> },
          {
            key: "actions",
            label: "Actions",
            render: (employee) => (
              <div className="flex min-w-56 flex-wrap items-center gap-2">
                <button
                  type="button"
                  title="View details, documents & letters"
                  onClick={() => openDetails(employee)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                >
                  <Eye size={16} />
                </button>
                <button
                  type="button"
                  title="Edit details"
                  onClick={() => startEditing(employee)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-blue-50"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  title="Employment history"
                  onClick={() => loadEmployeeHistory(employee)}
                  className="rounded-lg border border-slate-200 p-2 text-violet-700 hover:bg-violet-50"
                >
                  <History size={16} />
                </button>
                <select
                  value={normalizeStatus(employee.status)}
                  disabled={updatingId === employee._id}
                  onChange={(e) => updateStatus(employee, e.target.value)}
                  className="max-w-32 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
                >
                  {STATUSES.map((v) => <option key={v} value={v}>{titleCase(v)}</option>)}
                </select>
              </div>
            ),
          },
        ]}
        data={filteredEmployees}
        onRowClick={openDetails}
        loading={loading}
        emptyMessage={error ? "Records could not be loaded." : "No records match your filters."}
        getRowKey={(employee) => employee._id}
      />}

      {/* Selected Employee / Intern Detail Modal with Documents & Letters */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <section role="dialog" aria-modal="true" className="my-auto w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7 max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-blue-600">Profile & Records</p>
                <h2 className="mt-2 text-xl font-bold">{employeeName(selectedEmployee)}</h2>
                <p className="text-sm text-slate-500">{employeeCode(selectedEmployee)} · {selectedEmployee.email}</p>
              </div>
              <button type="button" onClick={() => setSelectedEmployee(null)}><X size={19} /></button>
            </div>

            <div className="mb-5 flex gap-2">
              <StatusBadge status={selectedEmployee.status} />
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
                {selectedEmployee.role || "employee"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { label: "Department", value: selectedEmployee.department, icon: Building2 },
                { label: "Designation", value: selectedEmployee.designation, icon: BriefcaseBusiness },
                { label: "Joining Date", value: formatDate(selectedEmployee.joiningDate), icon: CalendarDays },
                { label: "Domain / Track", value: [selectedEmployee.domain, selectedEmployee.track].filter(Boolean).join(" / "), icon: GraduationCap },
                { label: "Internship Dates", value: selectedEmployee.role === "intern" ? `${formatDate(selectedEmployee.startDate)} – ${formatDate(selectedEmployee.endDate)}` : "", icon: CalendarDays },
                { label: "Compensation", value: selectedEmployee.role === "intern" ? selectedEmployee.stipend : selectedEmployee.salary?.ctc ?? selectedEmployee.salary, icon: BriefcaseBusiness },
                { label: "Email", value: selectedEmployee.email, icon: Mail },
                { label: "Phone", value: selectedEmployee.phone, icon: Phone },
                { label: "Manager / Mentor", value: selectedEmployee.managerId?.name || selectedEmployee.managerId?.empId || selectedEmployee.mentor || "Not assigned", icon: UserRound },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-xl border border-slate-200 p-3.5">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Icon size={16} />
                      <span className="text-xs">{item.label}</span>
                    </div>
                    <p className="mt-1 break-words text-sm font-semibold">{item.value || "—"}</p>
                  </div>
                );
              })}
            </div>

            <section className="mt-6 border-t border-slate-100 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ClipboardCheck size={18} className="text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Onboarding</h3>
                </div>
                {!loadingEmployeeDetails && !selectedEmployee.onboarding && (
                  <button
                    type="button"
                    onClick={createOnboarding}
                    disabled={creatingOnboarding}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Plus size={14} />
                    {creatingOnboarding ? "Creating..." : "Create Onboarding"}
                  </button>
                )}
              </div>
              {onboardingError && (
                <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  {onboardingError}
                </p>
              )}
              {loadingEmployeeDetails ? (
                <p className="mt-2 text-xs text-slate-500">Loading onboarding details...</p>
              ) : selectedEmployee.onboarding ? (
                <div className="mt-3 rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      {selectedEmployee.onboarding.tasks?.length || 0} checklist tasks
                    </p>
                    <span className="text-sm font-bold text-indigo-700">
                      {selectedEmployee.onboarding.progress || 0}% complete
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all"
                      style={{ width: `${Math.min(Math.max(Number(selectedEmployee.onboarding.progress) || 0, 0), 100)}%` }}
                    />
                  </div>
                  {selectedEmployee.onboarding.tasks?.length ? (
                    <ul className="mt-3 divide-y divide-slate-100">
                      {selectedEmployee.onboarding.tasks.map((task) => (
                        <li key={task._id || task.title} className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
                          <span className="font-medium text-slate-800">{task.title}</span>
                          <span className="capitalize text-slate-500">
                            {String(task.status || "pending").replace(/_/g, " ")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs text-slate-500">No onboarding tasks have been added.</p>
                  )}
                  <p className="mt-2 text-[11px] text-slate-400">
                    Created {formatDate(selectedEmployee.onboarding.createdAt)}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  No onboarding process has been created for this {selectedEmployee.role === "intern" ? "intern" : "employee"}.
                </p>
              )}
            </section>

            {/* Uploaded Documents Section */}
            <div className="mt-6 border-t border-slate-100 pt-5">
              <h3 className="text-sm font-bold text-slate-900">Uploaded Documents ({selectedEmployee.documents?.length || 0})</h3>
              {(!selectedEmployee.documents || selectedEmployee.documents.length === 0) ? (
                <p className="mt-2 text-xs text-slate-400">No documents found for this user.</p>
              ) : (
                <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {selectedEmployee.documents.map((doc) => (
                    <div key={doc._id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-xs">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-blue-600" />
                        <div>
                          <p className="font-semibold text-slate-800">{doc.label || doc.originalName || "Document"}</p>
                          <p className="text-[11px] text-slate-400">Status: {doc.status || "pending"} · Uploaded: {formatDate(doc.uploadedAt || doc.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.status === "pending" && (
                          <>
                            <button type="button" onClick={() => reviewDocument(doc, "verify")} className="rounded-lg border border-emerald-200 px-2 py-1 font-semibold text-emerald-700 hover:bg-emerald-50">Verify</button>
                            <button type="button" onClick={() => reviewDocument(doc, "reject")} className="rounded-lg border border-rose-200 px-2 py-1 font-semibold text-rose-700 hover:bg-rose-50">Reject</button>
                          </>
                        )}
                        <a
                          href={doc.fileUrl || doc.filePath}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800"
                        >
                          Download <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Generated Letters Section */}
            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-900">Issued Letters ({selectedEmployee.letters?.length || 0})</h3>
                <button
                  type="button"
                  onClick={() => navigate(`/hr/letters?employeeId=${encodeURIComponent(selectedEmployee._id)}`)}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Generate New Letter
                </button>
              </div>
              {(!selectedEmployee.letters || selectedEmployee.letters.length === 0) ? (
                <p className="mt-2 text-xs text-slate-400">No letters issued yet.</p>
              ) : (
                <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {selectedEmployee.letters.map((letter) => (
                    <div key={letter._id} className="flex items-center justify-between p-3 text-xs">
                      <div>
                        <p className="font-semibold text-slate-800">{letter.title || letter.type}</p>
                        <p className="text-[11px] text-slate-400">Status: {letter.status} · Issued: {formatDate(letter.issuedAt || letter.createdAt)}</p>
                      </div>
                      {letter.pdfUrl && (
                        <a
                          href={letter.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800"
                        >
                          PDF <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <h3 className="text-sm font-bold text-slate-900">Offer History ({selectedEmployee.offers?.length || 0})</h3>
              {(!selectedEmployee.offers || selectedEmployee.offers.length === 0) ? (
                <p className="mt-2 text-xs text-slate-400">No offers found for this user.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {(selectedEmployee.offers || []).map((offer) => (
                    <div key={offer._id} className="rounded-xl border border-slate-200 p-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-800">{offer.designation || "Offer"} · {offer.offerType || "—"}</p>
                        <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold capitalize text-slate-700">{offer.status || "—"}</span>
                      </div>
                      <p className="mt-1 text-slate-500">
                        Compensation: ₹{Number(offer.salary || 0).toLocaleString("en-IN")} · Joining: {formatDate(offer.joiningDate)} · Sent: {formatDate(offer.sentAt || offer.createdAt)}
                      </p>
                      {offer.pdfUrl && (
                        <a href={offer.pdfUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800">
                          View offer PDF <ExternalLink size={12} />
                        </a>
                      )}
                      {Array.isArray(offer.requiredDocuments) && offer.requiredDocuments.length > 0 && (
                        <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-slate-600">
                          {offer.requiredDocuments.map((document) => (
                            <li key={document.id} className="flex justify-between gap-2">
                              <span>{document.label}</span>
                              <span className={document.uploadedDocumentId ? "font-semibold text-emerald-700" : document.required ? "text-amber-700" : "text-slate-500"}>
                                {document.uploadedDocumentId ? "Uploaded" : document.required ? "Pending" : "Optional"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <h3 className="text-sm font-bold text-slate-900">Application History ({selectedEmployee.applications?.length || 0})</h3>
              {(!selectedEmployee.applications || selectedEmployee.applications.length === 0) ? (
                <p className="mt-2 text-xs text-slate-400">No application history found.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {selectedEmployee.applications.map((application) => (
                    <div key={application._id} className="rounded-xl border border-slate-200 p-3 text-xs">
                      <p className="font-semibold text-slate-800">{application.position || application.jobId?.title || "Application"} · {application.jobType || "—"}</p>
                      <p className="mt-1 text-slate-500">Status: {application.status || "—"} · Applied: {formatDate(application.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button type="button" onClick={() => setSelectedEmployee(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
                Close
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Convert Candidate Modal */}
      {convertingOffer && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <form onSubmit={handleConvertCandidate} className="my-auto w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex justify-between">
              <div>
                <h2 className="text-xl font-bold">Convert Candidate Account</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Candidate: {convertingOffer.candidateId?.name} ({convertingOffer.candidateId?.email})
                </p>
              </div>
              <button type="button" disabled={savingConversion} onClick={() => setConvertingOffer(null)}>
                <X size={19} />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold sm:col-span-2">
                Target Role
                <select
                  value={conversionForm.targetRole}
                  onChange={(e) => setConversionForm({ ...conversionForm, targetRole: e.target.value })}
                  className="mt-1 w-full rounded-xl border p-2.5 text-sm bg-white"
                >
                  <option value="employee">Full-time Employee</option>
                  <option value="intern">Intern</option>
                </select>
              </label>

              <label className="text-xs font-semibold">
                Designation
                <input
                  required
                  value={conversionForm.designation}
                  onChange={(e) => setConversionForm({ ...conversionForm, designation: e.target.value })}
                  className="mt-1 w-full rounded-xl border p-2.5 text-sm"
                />
              </label>

              <label className="text-xs font-semibold">
                Department
                <input
                  required
                  value={conversionForm.department}
                  onChange={(e) => setConversionForm({ ...conversionForm, department: e.target.value })}
                  placeholder="Engineering / Product"
                  className="mt-1 w-full rounded-xl border p-2.5 text-sm"
                />
              </label>

              <label className="text-xs font-semibold sm:col-span-2">
                Joining Date
                <input
                  required
                  type="date"
                  value={conversionForm.joiningDate}
                  onChange={(e) => setConversionForm({ ...conversionForm, joiningDate: e.target.value })}
                  className="mt-1 w-full rounded-xl border p-2.5 text-sm"
                />
              </label>
              <label className="text-xs font-semibold sm:col-span-2">
                Location
                <input
                  value={conversionForm.location}
                  onChange={(e) => setConversionForm({ ...conversionForm, location: e.target.value })}
                  placeholder="City / office location"
                  className="mt-1 w-full rounded-xl border p-2.5 text-sm"
                />
              </label>

              {conversionForm.targetRole === "employee" ? (
                <>
                  <label className="text-xs font-semibold">
                    Annual Salary / CTC (₹)
                    <input
                      type="number"
                      value={conversionForm.salary}
                      onChange={(e) => setConversionForm({ ...conversionForm, salary: e.target.value })}
                      className="mt-1 w-full rounded-xl border p-2.5 text-sm"
                    />
                  </label>
                  <label className="text-xs font-semibold">
                    Employment Type
                    <select
                      value={conversionForm.employmentType}
                      onChange={(e) => setConversionForm({ ...conversionForm, employmentType: e.target.value })}
                      className="mt-1 w-full rounded-xl border bg-white p-2.5 text-sm"
                    >
                      <option value="full_time">Full-time</option>
                      <option value="part_time">Part-time</option>
                      <option value="contract">Contract</option>
                    </select>
                  </label>
                  <label className="text-xs font-semibold sm:col-span-2">
                    Manager
                    <select
                      value={conversionForm.managerId}
                      onChange={(e) => setConversionForm({ ...conversionForm, managerId: e.target.value })}
                      className="mt-1 w-full rounded-xl border bg-white p-2.5 text-sm"
                    >
                      <option value="">Select manager (optional)</option>
                      {employees.filter((item) => item.role === "employee").map((item) => (
                        <option key={item._id} value={item._id}>{employeeName(item)}</option>
                      ))}
                    </select>
                  </label>
                </>
              ) : (
                <>
                  <label className="text-xs font-semibold">
                    Domain
                    <input
                      value={conversionForm.domain}
                      onChange={(e) => setConversionForm({ ...conversionForm, domain: e.target.value })}
                      placeholder="Backend"
                      className="mt-1 w-full rounded-xl border p-2.5 text-sm"
                    />
                  </label>
                  <label className="text-xs font-semibold">
                    Track
                    <input
                      value={conversionForm.track}
                      onChange={(e) => setConversionForm({ ...conversionForm, track: e.target.value })}
                      placeholder="Engineering"
                      className="mt-1 w-full rounded-xl border p-2.5 text-sm"
                    />
                  </label>
                  <label className="text-xs font-semibold">
                    Monthly Stipend (₹)
                    <input
                      type="number"
                      value={conversionForm.stipend}
                      onChange={(e) => setConversionForm({ ...conversionForm, stipend: e.target.value })}
                      className="mt-1 w-full rounded-xl border p-2.5 text-sm"
                    />
                  </label>
                  <label className="text-xs font-semibold">
                    Start Date
                    <input
                      type="date"
                      value={conversionForm.startDate}
                      onChange={(e) => setConversionForm({ ...conversionForm, startDate: e.target.value })}
                      className="mt-1 w-full rounded-xl border p-2.5 text-sm"
                    />
                  </label>
                  <label className="text-xs font-semibold">
                    End Date
                    <input
                      type="date"
                      value={conversionForm.endDate}
                      onChange={(e) => setConversionForm({ ...conversionForm, endDate: e.target.value })}
                      className="mt-1 w-full rounded-xl border p-2.5 text-sm"
                    />
                  </label>
                  <label className="text-xs font-semibold sm:col-span-2">
                    Mentor
                    <select
                      value={conversionForm.mentorId}
                      onChange={(e) => setConversionForm({ ...conversionForm, mentorId: e.target.value })}
                      className="mt-1 w-full rounded-xl border bg-white p-2.5 text-sm"
                    >
                      <option value="">Select mentor (optional)</option>
                      {employees.filter((item) => item.role === "employee").map((item) => (
                        <option key={item._id} value={item._id}>{employeeName(item)}</option>
                      ))}
                    </select>
                  </label>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <button
                type="button"
                disabled={savingConversion}
                onClick={() => setConvertingOffer(null)}
                className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingConversion}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {savingConversion ? "Converting..." : "Complete Conversion"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <form onSubmit={saveEmployeeEdit} className="my-auto w-full max-w-xl space-y-5 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex justify-between">
              <div>
                <h2 className="text-xl font-bold">Edit Details</h2>
                <p className="mt-1 text-sm text-slate-500">{employeeName(editingEmployee)} · {employeeCode(editingEmployee)}</p>
              </div>
              <button type="button" disabled={savingEdit} onClick={() => setEditingEmployee(null)}><X size={19} /></button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">Department<input required value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} className="mt-1 w-full rounded-xl border p-3 text-sm" /></label>
              <label className="text-sm font-medium">Designation<input required value={editForm.designation} onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })} className="mt-1 w-full rounded-xl border p-3 text-sm" /></label>
              <label className="text-sm font-medium">Role Type<select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} className="mt-1 w-full rounded-xl border bg-white p-3 text-sm"><option value="employee">Employee</option><option value="intern">Intern</option></select></label>
              <label className="text-sm font-medium">Joining date<input type="date" value={editForm.joiningDate} onChange={(e) => setEditForm({ ...editForm, joiningDate: e.target.value })} className="mt-1 w-full rounded-xl border p-3 text-sm" /></label>
            </div>
            <div className="flex justify-end gap-2 border-t pt-4">
              <button type="button" disabled={savingEdit} onClick={() => setEditingEmployee(null)} className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={savingEdit} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{savingEdit ? "Saving..." : "Save changes"}</button>
            </div>
          </form>
        </div>
      )}

      {/* History Modal */}
      {historyEmployee && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto w-full max-w-2xl space-y-5 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex justify-between">
              <div>
                <h2 className="text-xl font-bold">Employment History</h2>
                <p className="mt-1 text-sm text-slate-500">{employeeName(historyEmployee)}</p>
              </div>
              <button type="button" onClick={() => setHistoryEmployee(null)}><X size={19} /></button>
            </div>
            <div className="max-h-72 overflow-y-auto space-y-3">
              {historyRecords.length === 0 ? (
                <p className="text-sm text-slate-400">No recorded changes yet.</p>
              ) : (
                historyRecords.map((r) => (
                  <div key={r._id} className="rounded-xl border border-slate-200 p-3 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="capitalize text-blue-700">{r.historyType}</span>
                      <span className="text-slate-400">{formatDate(r.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-slate-600">{r.reason}</p>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end border-t pt-3">
              <button type="button" onClick={() => setHistoryEmployee(null)} className="rounded-xl border px-4 py-2 text-sm font-semibold">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
