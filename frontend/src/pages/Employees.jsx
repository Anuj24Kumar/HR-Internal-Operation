
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users, Search, RefreshCw, Eye, Pencil, History, Plus, X,
  UserRound, Building2, BriefcaseBusiness, CalendarDays, Mail, Phone,
  AlertCircle, CheckCircle2, Clock3,
} from "lucide-react";
import { apiRequest } from "../api.js";
import DataTable from "../components/DataTable.jsx";

const STATUSES = ["active", "notice", "exited"];
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
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const employeeName = (employee) => {
  const p = employee?.personalInfo || {};
  return p.fullName ||
    [p.firstName, p.lastName].filter(Boolean).join(" ") ||
    employee?.name ||
    employee?.fullName ||
    employee?.employeeName ||
    "Employee";
};

const employeeCode = (employee) =>
  employee?.empId || employee?.employeeCode || employee?.employeeId || "—";

const normalizeStatus = (value) => String(value || "active").toLowerCase();

function StatusBadge({ status }) {
  const value = normalizeStatus(status);
  const colors = {
    active: "bg-emerald-50 text-emerald-700",
    notice: "bg-amber-50 text-amber-700",
    exited: "bg-rose-50 text-rose-700",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colors[value] || "bg-slate-100 text-slate-700"}`}>
      {titleCase(value)}
    </span>
  );
}

function HistoryValues({ values }) {
  if (!values || typeof values !== "object" || !Object.keys(values).length) {
    return <p className="text-sm text-slate-400">No details provided</p>;
  }
  return (
    <dl className="space-y-2">
      {Object.entries(values).map(([key, value]) => (
        <div key={key} className="flex flex-wrap gap-x-2 text-sm">
          <dt className="font-medium text-slate-500">{titleCase(key)}:</dt>
          <dd className="break-words text-slate-800">
            {value == null || value === "" ? "—" :
              typeof value === "object" ? JSON.stringify(value) : String(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedEmployee, setSelectedEmployee] = useState(null);
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

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await apiRequest("/employees");
      setEmployees(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err.message || "Unable to load employees.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

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
        employeeName(employee), employeeCode(employee), p.email, p.phone,
        employee.email, employee.department, employee.designation,
        employee.type, employee.status,
      ].filter(Boolean).join(" ").toLowerCase();

      return (!term || searchable.includes(term)) &&
        (!departmentFilter || employee.department === departmentFilter) &&
        (!designationFilter || employee.designation === designationFilter) &&
        (!statusFilter || normalizeStatus(employee.status) === statusFilter);
    });
  }, [employees, search, departmentFilter, designationFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter((e) => normalizeStatus(e.status) === "active").length,
    notice: employees.filter((e) => normalizeStatus(e.status) === "notice").length,
    exited: employees.filter((e) => normalizeStatus(e.status) === "exited").length,
  }), [employees]);

  async function openDetails(employee) {
    setError("");
    setSelectedEmployee(employee);
    try {
      const result = await apiRequest(`/employees/${employee._id}`);
      if (result.data) setSelectedEmployee(result.data);
    } catch (err) {
      setError(err.message || "Unable to load employee details.");
    }
  }

  async function startEditing(employee) {
    setError("");
    try {
      const result = await apiRequest(`/employees/${employee._id}`);
      const record = result.data || employee;
      setEditForm({
        department: record.department || "",
        designation: record.designation || "",
        type: record.type || "employee",
        joiningDate: dateInput(record.joiningDate),
      });
      setEditingEmployee(record);
    } catch (err) {
      setError(err.message || "Unable to load employee for editing.");
    }
  }

  async function saveEmployeeEdit(event) {
    event.preventDefault();
    if (!editingEmployee) return;
    if (!editForm.department.trim() || !editForm.designation.trim()) {
      setError("Department and designation are required.");
      return;
    }

    setSavingEdit(true);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest(`/employees/${editingEmployee._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          department: editForm.department.trim(),
          designation: editForm.designation.trim(),
          type: editForm.type,
          joiningDate: editForm.joiningDate || null,
        }),
      });
      setNotice(result.message || "Employee updated successfully.");
      setEditingEmployee(null);
      await loadEmployees();
      if (selectedEmployee?._id === editingEmployee._id) {
        const refreshed = await apiRequest(`/employees/${editingEmployee._id}`);
        if (refreshed.data) setSelectedEmployee(refreshed.data);
      }
    } catch (err) {
      setError(err.message || "Unable to update employee.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function updateStatus(employee, status) {
    if (normalizeStatus(employee.status) === status) return;
    if (!window.confirm(`Change ${employeeName(employee)}'s status to ${status}?`)) return;

    setUpdatingId(employee._id);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest(`/employees/${employee._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setNotice(result.message || "Employee status updated successfully.");
      await loadEmployees();
      if (selectedEmployee?._id === employee._id && result.data) {
        setSelectedEmployee(result.data);
      }
    } catch (err) {
      setError(err.message || "Unable to update employee status.");
    } finally {
      setUpdatingId("");
    }
  }

  async function loadEmployeeHistory(employee) {
    setHistoryEmployee(employee);
    setHistoryRecords([]);
    setHistoryError("");
    setHistoryLoading(true);
    setShowHistoryForm(false);
    setHistoryForm(EMPTY_HISTORY);
    try {
      const result = await apiRequest(`/employees/${employee._id}/history`);
      setHistoryRecords(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setHistoryError(err.message || "Unable to load employee history.");
    } finally {
      setHistoryLoading(false);
    }
  }

  function closeHistory() {
    if (savingHistory) return;
    setHistoryEmployee(null);
    setHistoryRecords([]);
    setHistoryError("");
    setShowHistoryForm(false);
    setHistoryForm(EMPTY_HISTORY);
  }

  function buildHistoryValues() {
    const oldValues = {};
    const newValues = {};

    if (historyForm.historyType === "promotion") {
      if (historyForm.oldDesignation.trim()) oldValues.designation = historyForm.oldDesignation.trim();
      if (historyForm.newDesignation.trim()) newValues.designation = historyForm.newDesignation.trim();
      if (historyForm.oldDepartment.trim()) oldValues.department = historyForm.oldDepartment.trim();
      if (historyForm.newDepartment.trim()) newValues.department = historyForm.newDepartment.trim();
    } else if (historyForm.historyType === "transfer") {
      if (historyForm.oldDepartment.trim()) oldValues.department = historyForm.oldDepartment.trim();
      if (historyForm.newDepartment.trim()) newValues.department = historyForm.newDepartment.trim();
    } else if (historyForm.historyType === "increment") {
      if (historyForm.oldSalary !== "") oldValues.salary = Number(historyForm.oldSalary);
      if (historyForm.newSalary !== "") newValues.salary = Number(historyForm.newSalary);
    }

    return { oldValues, newValues };
  }

  async function saveHistory(event) {
    event.preventDefault();
    if (!historyEmployee) return;

    const reason = historyForm.reason.trim();
    if (!reason) {
      setHistoryError("Reason is required.");
      return;
    }

    const { oldValues, newValues } = buildHistoryValues();
    if (!Object.keys(oldValues).length && !Object.keys(newValues).length) {
      setHistoryError("Enter at least one old or new value.");
      return;
    }

    setSavingHistory(true);
    setHistoryError("");
    try {
      const result = await apiRequest(`/employees/${historyEmployee._id}/history`, {
        method: "POST",
        body: JSON.stringify({
          historyType: historyForm.historyType,
          oldValues,
          newValues,
          reason,
        }),
      });

      const refreshed = await apiRequest(`/employees/${historyEmployee._id}/history`);
      setHistoryRecords(Array.isArray(refreshed.data) ? refreshed.data : []);
      setHistoryForm(EMPTY_HISTORY);
      setShowHistoryForm(false);
      setNotice(result.message || "Employee history added successfully.");
    } catch (err) {
      setHistoryError(err.message || "Unable to save employee history.");
    } finally {
      setSavingHistory(false);
    }
  }

  const clearFilters = () => {
    setSearch("");
    setDepartmentFilter("");
    setDesignationFilter("");
    setStatusFilter("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">HR Workspace</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Employees</h1>
          <p className="mt-2 text-sm text-slate-500">View employee records, edit employment details and track history.</p>
        </div>
        <button type="button" onClick={loadEmployees} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><AlertCircle size={18} /><span>{error}</span><button type="button" onClick={() => setError("")} className="ml-auto"><X size={16} /></button></div>}
      {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"><CheckCircle2 size={18} /><span>{notice}</span><button type="button" onClick={() => setNotice("")} className="ml-auto"><X size={16} /></button></div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total employees", value: stats.total, icon: Users, tone: "bg-blue-50 text-blue-600" },
          { label: "Active", value: stats.active, icon: UserRound, tone: "bg-emerald-50 text-emerald-600" },
          { label: "On notice", value: stats.notice, icon: CalendarDays, tone: "bg-amber-50 text-amber-600" },
          { label: "Exited", value: stats.exited, icon: BriefcaseBusiness, tone: "bg-rose-50 text-rose-600" },
        ].map((item) => {
          const Icon = item.icon;
          return <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className={`grid h-11 w-11 place-items-center rounded-xl ${item.tone}`}><Icon size={21} /></span><div><p className="text-sm text-slate-500">{item.label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{item.value}</p></div></div></div>;
        })}
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3"><Search size={17} className="text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, employee ID, email..." className="w-full min-w-0 bg-transparent py-3 text-sm outline-none" /></label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"><option value="">All departments</option>{departments.map((v) => <option key={v} value={v}>{v}</option>)}</select>
          <select value={designationFilter} onChange={(e) => setDesignationFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"><option value="">All designations</option>{designations.map((v) => <option key={v} value={v}>{v}</option>)}</select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"><option value="">All statuses</option>{STATUSES.map((v) => <option key={v} value={v}>{titleCase(v)}</option>)}</select>
        </div>
        <div className="flex justify-between text-xs text-slate-500"><span>Showing {filteredEmployees.length} of {employees.length} employees</span>{(search || departmentFilter || designationFilter || statusFilter) && <button type="button" onClick={clearFilters} className="font-semibold text-blue-600">Clear filters</button>}</div>
      </div>

      <DataTable
        columns={[
          { key: "employee", label: "Employee", render: (e) => <div className="flex min-w-40 items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 font-semibold text-blue-700">{employeeName(e).charAt(0).toUpperCase()}</div><div><p className="font-semibold text-slate-800">{employeeName(e)}</p><p className="mt-1 text-xs text-slate-500">{employeeCode(e)}</p></div></div> },
          { key: "department", label: "Department", render: (e) => e.department || "—" },
          { key: "designation", label: "Designation", render: (e) => e.designation || "—" },
          { key: "type", label: "Type", render: (e) => e.type || "—" },
          { key: "joiningDate", label: "Joining date", render: (e) => formatDate(e.joiningDate) },
          { key: "status", label: "Status", render: (e) => <StatusBadge status={e.status} /> },
          { key: "actions", label: "Actions", render: (employee) => <div className="flex min-w-56 flex-wrap items-center gap-2">
            <button type="button" title="View details" onClick={() => openDetails(employee)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><Eye size={16} /></button>
            <button type="button" title="Edit employee" onClick={() => startEditing(employee)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-blue-50"><Pencil size={16} /></button>
            <button type="button" title="Employment history" onClick={() => loadEmployeeHistory(employee)} className="rounded-lg border border-slate-200 p-2 text-violet-700 hover:bg-violet-50"><History size={16} /></button>
            <select value={normalizeStatus(employee.status)} disabled={updatingId === employee._id} onChange={(e) => updateStatus(employee, e.target.value)} aria-label={`Update status for ${employeeName(employee)}`} className="max-w-32 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs">{STATUSES.map((v) => <option key={v} value={v}>{titleCase(v)}</option>)}</select>
          </div> },
        ]}
        data={filteredEmployees}
        loading={loading}
        emptyMessage={error ? "Employees could not be loaded." : "No employee records match your filters."}
        getRowKey={(employee) => employee._id}
      />

      {selectedEmployee && <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"><section role="dialog" aria-modal="true" className="my-auto w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="mb-6 flex justify-between"><div><p className="text-xs font-bold uppercase text-blue-600">Employee profile</p><h2 className="mt-2 text-xl font-bold">{employeeName(selectedEmployee)}</h2><p className="text-sm text-slate-500">{employeeCode(selectedEmployee)}</p></div><button type="button" onClick={() => setSelectedEmployee(null)}><X size={19} /></button></div>
        <div className="mb-5"><StatusBadge status={selectedEmployee.status} /></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{[
          { label: "Department", value: selectedEmployee.department, icon: Building2 },
          { label: "Designation", value: selectedEmployee.designation, icon: BriefcaseBusiness },
          { label: "Joining date", value: formatDate(selectedEmployee.joiningDate), icon: CalendarDays },
          { label: "Email", value: selectedEmployee.personalInfo?.email || selectedEmployee.email, icon: Mail },
          { label: "Phone", value: selectedEmployee.personalInfo?.phone || selectedEmployee.phone, icon: Phone },
          { label: "Manager", value: selectedEmployee.managerId?.empId || selectedEmployee.managerId?.designation || "Not assigned", icon: UserRound },
        ].map((item) => { const Icon = item.icon; return <div key={item.label} className="rounded-xl border border-slate-200 p-4"><div className="flex items-center gap-2 text-slate-500"><Icon size={16} /><span className="text-xs">{item.label}</span></div><p className="mt-2 break-words text-sm font-semibold">{item.value || "—"}</p></div>; })}</div>
        <div className="mt-6 flex justify-end"><button type="button" onClick={() => setSelectedEmployee(null)} className="rounded-xl border px-4 py-2">Close</button></div>
      </section></div>}

      {editingEmployee && <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"><form onSubmit={saveEmployeeEdit} className="my-auto w-full max-w-xl space-y-5 rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex justify-between"><div><h2 className="text-xl font-bold">Edit Employee</h2><p className="mt-1 text-sm text-slate-500">{employeeName(editingEmployee)} · {employeeCode(editingEmployee)}</p></div><button type="button" disabled={savingEdit} onClick={() => setEditingEmployee(null)}><X size={19} /></button></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">Department<input required value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
          <label className="text-sm font-medium">Designation<input required value={editForm.designation} onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
          <label className="text-sm font-medium">Type<select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} className="mt-1 w-full rounded-xl border bg-white p-3"><option value="employee">Employee</option><option value="intern">Intern</option></select></label>
          <label className="text-sm font-medium">Joining date<input type="date" value={editForm.joiningDate} onChange={(e) => setEditForm({ ...editForm, joiningDate: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
        </div>
        <div className="flex justify-end gap-3"><button type="button" disabled={savingEdit} onClick={() => setEditingEmployee(null)} className="rounded-xl border px-4 py-2">Cancel</button><button disabled={savingEdit} className="rounded-xl bg-blue-600 px-5 py-2 text-white">{savingEdit ? "Saving..." : "Save changes"}</button></div>
      </form></div>}

      {historyEmployee && <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="history-title" className="my-auto max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="mb-6 flex justify-between gap-3"><div><p className="text-xs font-bold uppercase text-violet-600">Employee records</p><h2 id="history-title" className="mt-2 text-xl font-bold">Employment History</h2><p className="mt-1 text-sm text-slate-500">{employeeName(historyEmployee)} · {employeeCode(historyEmployee)}</p></div><button type="button" disabled={savingHistory} onClick={closeHistory}><X size={19} /></button></div>

        {historyError && <div role="alert" className="mb-4 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle size={17} /><span>{historyError}</span></div>}

        <div className="mb-5 flex items-center justify-between"><div><h3 className="font-semibold">History timeline</h3><p className="text-xs text-slate-500">{historyRecords.length} record(s)</p></div><button type="button" onClick={() => { setHistoryError(""); setHistoryForm(EMPTY_HISTORY); setShowHistoryForm(!showHistoryForm); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">{showHistoryForm ? <X size={16} /> : <Plus size={16} />}{showHistoryForm ? "Cancel" : "Add history"}</button></div>

        {showHistoryForm && <form onSubmit={saveHistory} className="mb-6 space-y-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
          <label className="block text-sm font-medium">History type<select required value={historyForm.historyType} onChange={(e) => setHistoryForm({ ...historyForm, historyType: e.target.value })} className="mt-1 w-full rounded-xl border bg-white p-3">{HISTORY_TYPES.map((v) => <option key={v} value={v}>{titleCase(v)}</option>)}</select></label>

          {historyForm.historyType === "promotion" && <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Previous designation<input value={historyForm.oldDesignation} onChange={(e) => setHistoryForm({ ...historyForm, oldDesignation: e.target.value })} className="mt-1 w-full rounded-xl border bg-white p-3" /></label>
            <label className="text-sm">New designation<input value={historyForm.newDesignation} onChange={(e) => setHistoryForm({ ...historyForm, newDesignation: e.target.value })} className="mt-1 w-full rounded-xl border bg-white p-3" /></label>
            <label className="text-sm">Previous department<input value={historyForm.oldDepartment} onChange={(e) => setHistoryForm({ ...historyForm, oldDepartment: e.target.value })} className="mt-1 w-full rounded-xl border bg-white p-3" /></label>
            <label className="text-sm">New department<input value={historyForm.newDepartment} onChange={(e) => setHistoryForm({ ...historyForm, newDepartment: e.target.value })} className="mt-1 w-full rounded-xl border bg-white p-3" /></label>
          </div>}

          {historyForm.historyType === "transfer" && <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Previous department<input required value={historyForm.oldDepartment} onChange={(e) => setHistoryForm({ ...historyForm, oldDepartment: e.target.value })} className="mt-1 w-full rounded-xl border bg-white p-3" /></label>
            <label className="text-sm">New department<input required value={historyForm.newDepartment} onChange={(e) => setHistoryForm({ ...historyForm, newDepartment: e.target.value })} className="mt-1 w-full rounded-xl border bg-white p-3" /></label>
          </div>}

          {historyForm.historyType === "increment" && <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Previous salary<input type="number" min="0" required value={historyForm.oldSalary} onChange={(e) => setHistoryForm({ ...historyForm, oldSalary: e.target.value })} className="mt-1 w-full rounded-xl border bg-white p-3" /></label>
            <label className="text-sm">New salary<input type="number" min="0" required value={historyForm.newSalary} onChange={(e) => setHistoryForm({ ...historyForm, newSalary: e.target.value })} className="mt-1 w-full rounded-xl border bg-white p-3" /></label>
          </div>}

          <label className="block text-sm font-medium">Reason<textarea required minLength={3} maxLength={1000} rows={3} value={historyForm.reason} onChange={(e) => setHistoryForm({ ...historyForm, reason: e.target.value })} placeholder="Explain why this change occurred..." className="mt-1 w-full rounded-xl border bg-white p-3" /></label>
          <div className="flex justify-end gap-3"><button type="button" disabled={savingHistory} onClick={() => { setShowHistoryForm(false); setHistoryForm(EMPTY_HISTORY); }} className="rounded-xl border bg-white px-4 py-2">Cancel</button><button type="submit" disabled={savingHistory} className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{savingHistory ? "Saving..." : "Save history"}</button></div>
        </form>}

        {historyLoading ? <div className="flex justify-center gap-2 py-10 text-sm text-slate-500"><RefreshCw size={18} className="animate-spin" />Loading history...</div> : historyRecords.length === 0 ? <div className="rounded-2xl border border-dashed p-8 text-center"><History size={28} className="mx-auto text-slate-400" /><p className="mt-3 font-semibold">No history records yet</p><p className="mt-1 text-sm text-slate-500">Add a promotion, transfer or increment record.</p></div> : <div className="space-y-4">{historyRecords.map((record) => <article key={record._id} className="rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-2"><span className="rounded-xl bg-violet-50 p-2 text-violet-700"><Clock3 size={17} /></span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{titleCase(record.historyType)}</span><span className="text-xs text-slate-500">{formatDate(record.createdAt)}</span></div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{record.reason}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-3"><p className="mb-2 text-xs font-bold uppercase text-slate-500">Old values</p><HistoryValues values={record.oldValues} /></div><div className="rounded-xl bg-emerald-50/60 p-3"><p className="mb-2 text-xs font-bold uppercase text-emerald-700">New values</p><HistoryValues values={record.newValues} /></div></div>
          {record.changedBy && <p className="mt-3 text-xs text-slate-500">Recorded by: {record.changedBy.name || record.changedBy.email || "HR user"}</p>}
        </article>)}</div>}

        <div className="mt-6 flex justify-end border-t pt-4"><button type="button" disabled={savingHistory} onClick={closeHistory} className="rounded-xl border px-4 py-2.5 text-sm font-semibold">Close</button></div>
      </section></div>}
    </div>
  );
}
