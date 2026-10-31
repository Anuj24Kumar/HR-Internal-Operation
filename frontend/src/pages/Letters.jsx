
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileText,
  Search,
  Plus,
  Download,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  Trash2,
  X,
  Clock,
  FileCheck,
  AlertCircle,
  UserRound,
  ShieldCheck,
} from "lucide-react";

import { apiRequest } from "../api";

const LETTER_TYPES = [
  "Offer Letter",
  "Appointment Letter",
  "Internship Letter",
  "Experience Letter",
  "Relieving Letter",
  "Promotion Letter",
  "Salary Revision Letter",
  "Warning Letter",
  "Other",
];

const STATUS_STYLES = {
  Draft: "bg-slate-100 text-slate-700 ring-slate-200",
  "Pending Approval": "bg-amber-50 text-amber-700 ring-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Rejected: "bg-red-50 text-red-700 ring-red-200",
  Sent: "bg-blue-50 text-blue-700 ring-blue-200",
  Signed: "bg-violet-50 text-violet-700 ring-violet-200",
  draft: "bg-slate-100 text-slate-700 ring-slate-200",
  pending_approval: "bg-amber-50 text-amber-700 ring-amber-200",
  generated: "bg-blue-50 text-blue-700 ring-blue-200",
  sent: "bg-blue-50 text-blue-700 ring-blue-200",
  signed: "bg-violet-50 text-violet-700 ring-violet-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};

const INITIAL_FORM = {
  employeeId: "",
  letterType: "",
  template: "default",
};

function getId(value) {
  if (!value) return "";
  if (typeof value === "object") {
    return value._id || value.id || "";
  }
  return String(value);
}

function getEmployeeName(employee) {
  if (!employee || typeof employee !== "object") return "Unknown Employee";

  const personalInfo = employee.personalInfo || {};

  return (
    personalInfo.name ||
    personalInfo.fullName ||
    [
      personalInfo.firstName,
      personalInfo.middleName,
      personalInfo.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    employee.name ||
    employee.empId ||
    employee.employeeCode ||
    "Unnamed Employee"
  );
}

function getLetterEmployeeName(letter) {
  return getEmployeeName(letter.employeeId);
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getErrorMessage(error) {
  return error?.message || "Something went wrong. Please try again.";
}

function normalizeStatus(status) {
  if (!status) return "Draft";

  const map = {
    draft: "Draft",
    pending_approval: "Pending Approval",
    generated: "Generated",
    sent: "Sent",
    signed: "Signed",
    approved: "Approved",
    rejected: "Rejected",
  };

  return map[status] || status;
}

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        STATUS_STYLES[status] ||
        STATUS_STYLES[normalized] ||
        "bg-gray-50 text-gray-600 ring-gray-200"
      }`}
    >
      {normalized}
    </span>
  );
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
  size = "max-w-lg",
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`max-h-[90vh] w-full ${size} overflow-y-auto rounded-2xl bg-white shadow-2xl`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </div>

        <div className="p-6">{children}</div>
      </section>
    </div>
  );
}

export default function Letters() {
  const [letters, setLetters] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(INITIAL_FORM);
  const [creating, setCreating] = useState(false);

  const [selectedLetter, setSelectedLetter] = useState(null);
  const [rejectLetter, setRejectLetter] = useState(null);
  const [approvalComments, setApprovalComments] = useState("");

  const [actionLoading, setActionLoading] = useState("");

  const fetchLetters = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const result = await apiRequest("/letters");

      setLetters(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const result = await apiRequest("/employees");

      const list = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.employees)
          ? result.employees
          : [];

      setEmployees(list);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    }
  }, []);

  useEffect(() => {
    fetchLetters();
    fetchEmployees();
  }, [fetchLetters, fetchEmployees]);

  const filteredLetters = useMemo(() => {
    const query = search.trim().toLowerCase();

    return letters.filter((letter) => {
      const status = normalizeStatus(letter.status);

      const statusMatches =
        statusFilter === "All" || status === statusFilter;

      const searchText = [
        letter.letterType,
        letter.template,
        status,
        getLetterEmployeeName(letter),
        letter.employeeId?.empId,
        letter.employeeId?.department,
        letter.employeeId?.designation,
        letter.createdBy?.name,
        letter.createdBy?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return statusMatches && (!query || searchText.includes(query));
    });
  }, [letters, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: letters.length,
      draft: letters.filter(
        (letter) => normalizeStatus(letter.status) === "Draft"
      ).length,
      pending: letters.filter(
        (letter) =>
          normalizeStatus(letter.status) === "Pending Approval"
      ).length,
      approved: letters.filter(
        (letter) => normalizeStatus(letter.status) === "Approved"
      ).length,
      rejected: letters.filter(
        (letter) => normalizeStatus(letter.status) === "Rejected"
      ).length,
    }),
    [letters]
  );

  function updateFormField(field, value) {
    setCreateForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleCreateLetter(event) {
    event.preventDefault();

    setError("");
    setNotice("");

    if (!createForm.employeeId) {
      setError("Please select an employee.");
      return;
    }

    if (!createForm.letterType) {
      setError("Please select a letter type.");
      return;
    }

    setCreating(true);

    try {
      const result = await apiRequest("/letters", {
        method: "POST",
        body: JSON.stringify({
          employeeId: createForm.employeeId,
          letterType: createForm.letterType,
          template: createForm.template || "default",
        }),
      });

      setNotice(result.message || "Letter draft created successfully.");
      setShowCreate(false);
      setCreateForm(INITIAL_FORM);

      await fetchLetters(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function handleViewLetter(letter) {
    const id = getId(letter);

    setActionLoading(`view-${id}`);
    setError("");

    try {
      const result = await apiRequest(`/letters/${id}`);

      setSelectedLetter(result.data || letter);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading("");
    }
  }

  async function handleDownloadPdf(letter) {
    const id = getId(letter);

    setActionLoading(`pdf-${id}`);
    setError("");

    try {
      const response = await apiRequest(`/letters/${id}/pdf`);

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${letter.letterType || "Letter"}-${letter.employeeId?.empId || id}.pdf`;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(url);

      setNotice("Letter PDF downloaded successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading("");
    }
  }

  async function handleSubmitLetter(letter) {
    const id = getId(letter);

    if (
      !window.confirm(
        "Submit this letter for Admin approval? Once submitted, it cannot be regenerated until the approval is reviewed."
      )
    ) {
      return;
    }

    setActionLoading(`submit-${id}`);
    setError("");
    setNotice("");

    try {
      const result = await apiRequest(`/letters/${id}/submit`, {
        method: "PATCH",
      });

      setNotice(
        result.message || "Letter submitted for approval successfully."
      );

      await fetchLetters(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading("");
    }
  }

  async function handleApproval(letter, action, comments = "") {
    const id = getId(letter);

    setActionLoading(`approval-${id}`);
    setError("");
    setNotice("");

    try {
      const result = await apiRequest(`/letters/${id}/approval`, {
        method: "PATCH",
        body: JSON.stringify({
          action,
          comments,
        }),
      });

      setNotice(
        result.message ||
          (action === "approved"
            ? "Letter approved successfully."
            : "Letter rejected successfully.")
      );

      setRejectLetter(null);
      setApprovalComments("");

      await fetchLetters(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading("");
    }
  }

  async function handleRejectSubmit(event) {
    event.preventDefault();

    if (!rejectLetter) return;

    if (!approvalComments.trim()) {
      setError("Comments are required when rejecting a letter.");
      return;
    }

    await handleApproval(
      rejectLetter,
      "rejected",
      approvalComments.trim()
    );
  }

  async function handleRegenerate(letter) {
    const id = getId(letter);

    if (
      !window.confirm(
        "Regenerate this letter PDF? This will create a new version and reset the letter status to Draft."
      )
    ) {
      return;
    }

    setActionLoading(`regenerate-${id}`);
    setError("");
    setNotice("");

    try {
      const response = await apiRequest(`/letters/${id}/regenerate`, {
        method: "PATCH",
      });

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${letter.letterType || "Letter"}-v${(letter.version || 1) + 1}.pdf`;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(url);

      setNotice("Letter regenerated successfully.");
      await fetchLetters(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading("");
    }
  }

  async function handleDeleteLetter(letter) {
    const id = getId(letter);

    if (normalizeStatus(letter.status) !== "Draft") {
      setError("Only draft letters can be deleted.");
      return;
    }

    if (
      !window.confirm(
        `Delete the draft ${letter.letterType || "letter"} for ${getLetterEmployeeName(letter)}?`
      )
    ) {
      return;
    }

    setActionLoading(`delete-${id}`);
    setError("");
    setNotice("");

    try {
      const result = await apiRequest(`/letters/${id}`, {
        method: "DELETE",
      });

      setLetters((previous) =>
        previous.filter((item) => getId(item) !== id)
      );

      if (getId(selectedLetter) === id) {
        setSelectedLetter(null);
      }

      setNotice(result.message || "Draft letter deleted successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading("");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
              <FileText size={16} />
              HR Management / Letters
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Letter Management
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Create, generate, submit and manage employee letters.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => fetchLetters(true)}
              disabled={loading || refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setCreateForm(INITIAL_FORM);
                setShowCreate(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <Plus size={17} />
              Create Letter
            </button>
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <div className="flex-1">{error}</div>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            <CheckCircle size={19} className="mt-0.5 shrink-0" />
            <div className="flex-1">{notice}</div>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Letters"
            count={stats.total}
            description="All generated records"
            icon={FileText}
            iconClass="bg-indigo-50 text-indigo-600"
          />

          <SummaryCard
            title="Draft"
            count={stats.draft}
            description="Not submitted yet"
            icon={Clock}
            iconClass="bg-slate-100 text-slate-600"
          />

          <SummaryCard
            title="Pending Approval"
            count={stats.pending}
            description="Awaiting Admin review"
            icon={ShieldCheck}
            iconClass="bg-amber-50 text-amber-600"
          />

          <SummaryCard
            title="Approved"
            count={stats.approved}
            description="Successfully approved"
            icon={FileCheck}
            iconClass="bg-emerald-50 text-emerald-600"
          />
        </div>

        {/* Letters table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  All Letters
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {filteredLetters.length} of {letters.length} letters
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search letters..."
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 sm:w-64"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  aria-label="Filter by status"
                >
                  <option value="All">All statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Sent">Sent</option>
                  <option value="Signed">Signed</option>
                  <option value="Generated">Generated</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-500">
              <RefreshCw size={25} className="animate-spin text-indigo-600" />
              <p className="text-sm">Loading letters...</p>
            </div>
          ) : filteredLetters.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
              <div className="mb-4 rounded-2xl bg-slate-100 p-4 text-slate-400">
                <FileText size={30} />
              </div>

              <h3 className="font-semibold text-slate-800">
                {letters.length === 0
                  ? "No letters found"
                  : "No matching letters"}
              </h3>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                {letters.length === 0
                  ? "Create a letter draft to get started."
                  : "Try another search term or change the status filter."}
              </p>

              {letters.length === 0 && (
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  + Create your first letter
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead className="bg-slate-50">
                  <tr className="border-y border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4 font-semibold">Letter</th>
                    <th className="px-5 py-4 font-semibold">Employee</th>
                    <th className="px-5 py-4 font-semibold">Created</th>
                    <th className="px-5 py-4 font-semibold">Version</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredLetters.map((letter) => {
                    const id = getId(letter);
                    const status = normalizeStatus(letter.status);
                    const isDraft = status === "Draft";
                    const isPending = status === "Pending Approval";

                    return (
                      <tr
                        key={id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                              <FileText size={21} />
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-64 truncate text-sm font-semibold text-slate-800">
                                {letter.letterType || "Untitled Letter"}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {letter.template || "default"} template
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                              <UserRound size={15} />
                            </div>

                            <div>
                              <p className="text-sm font-medium text-slate-800">
                                {getLetterEmployeeName(letter)}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {letter.employeeId?.empId || "Employee"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(letter.createdAt)}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          v{letter.version || 1}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={letter.status} />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <ActionButton
                              title="View details"
                              onClick={() => handleViewLetter(letter)}
                              disabled={actionLoading === `view-${id}`}
                            >
                              <Eye size={17} />
                            </ActionButton>

                            <ActionButton
                              title="Download PDF"
                              onClick={() => handleDownloadPdf(letter)}
                              disabled={actionLoading === `pdf-${id}`}
                            >
                              {actionLoading === `pdf-${id}` ? (
                                <RefreshCw size={17} className="animate-spin" />
                              ) : (
                                <Download size={17} />
                              )}
                            </ActionButton>

                            {isDraft && (
                              <>
                                <ActionButton
                                  title="Submit for approval"
                                  onClick={() => handleSubmitLetter(letter)}
                                  disabled={
                                    actionLoading === `submit-${id}`
                                  }
                                  className="text-amber-600 hover:bg-amber-50"
                                >
                                  <ShieldCheck size={17} />
                                </ActionButton>

                                <ActionButton
                                  title="Regenerate letter"
                                  onClick={() => handleRegenerate(letter)}
                                  disabled={
                                    actionLoading === `regenerate-${id}`
                                  }
                                  className="text-indigo-600 hover:bg-indigo-50"
                                >
                                  <RefreshCw size={17} />
                                </ActionButton>

                                <ActionButton
                                  title="Delete draft"
                                  onClick={() => handleDeleteLetter(letter)}
                                  disabled={
                                    actionLoading === `delete-${id}`
                                  }
                                  className="text-red-500 hover:bg-red-50"
                                >
                                  <Trash2 size={17} />
                                </ActionButton>
                              </>
                            )}

                            {isPending && (
                              <>
                                <ActionButton
                                  title="Approve letter (Admin)"
                                  onClick={() =>
                                    handleApproval(letter, "approved")
                                  }
                                  disabled={
                                    actionLoading === `approval-${id}`
                                  }
                                  className="text-emerald-600 hover:bg-emerald-50"
                                >
                                  <CheckCircle size={17} />
                                </ActionButton>

                                <ActionButton
                                  title="Reject letter (Admin)"
                                  onClick={() => {
                                    setError("");
                                    setRejectLetter(letter);
                                    setApprovalComments("");
                                  }}
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <XCircle size={17} />
                                </ActionButton>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="text-xs leading-5 text-slate-400">
          Approval actions require Admin access. Letter creation,
          submission and regeneration require HR access. Only Draft
          letters can be deleted.
        </p>
      </div>

      {/* Create letter modal */}
      {showCreate && (
        <Modal
          title="Create Letter"
          subtitle="Create a new employee letter draft."
          onClose={() => {
            if (!creating) setShowCreate(false);
          }}
        >
          <form onSubmit={handleCreateLetter} className="space-y-5">
            <div>
              <label
                htmlFor="employeeId"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Select Employee
              </label>

              <select
                id="employeeId"
                required
                value={createForm.employeeId}
                onChange={(event) =>
                  updateFormField("employeeId", event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Choose employee</option>

                {employees.map((employee) => (
                  <option key={getId(employee)} value={getId(employee)}>
                    {getEmployeeName(employee)}
                    {employee.empId ? ` (${employee.empId})` : ""}
                  </option>
                ))}
              </select>

              {employees.length === 0 && (
                <p className="mt-2 text-xs text-amber-600">
                  Employee list could not be loaded. Check the Employees API
                  or enter an employee ID after confirming the backend response.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="letterType"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Letter Type
              </label>

              <select
                id="letterType"
                required
                value={createForm.letterType}
                onChange={(event) =>
                  updateFormField("letterType", event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Select letter type</option>

                {LETTER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="template"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Template
              </label>

              <select
                id="template"
                value={createForm.template}
                onChange={(event) =>
                  updateFormField("template", event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="default">Default</option>
              </select>

              <p className="mt-2 text-xs text-slate-500">
                The backend currently supports the default template.
              </p>
            </div>

            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <div className="flex items-start gap-3">
                <FileText size={19} className="mt-0.5 text-indigo-600" />

                <div>
                  <p className="text-sm font-semibold text-indigo-900">
                    Letter draft
                  </p>

                  <p className="mt-1 text-xs leading-5 text-indigo-700">
                    Creating the letter will save a draft. You can
                    generate its PDF and submit it for Admin approval
                    afterwards.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                disabled={creating}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating && (
                  <RefreshCw size={16} className="animate-spin" />
                )}

                {creating ? "Creating..." : "Create Draft"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Letter details modal */}
      {selectedLetter && (
        <Modal
          title="Letter Details"
          subtitle="Letter information and approval status."
          onClose={() => setSelectedLetter(null)}
        >
          <div className="space-y-5">
            <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
              <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600">
                <FileText size={26} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="break-words font-semibold text-slate-900">
                  {selectedLetter.letterType || "Untitled Letter"}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {getLetterEmployeeName(selectedLetter)}
                </p>

                <div className="mt-2">
                  <StatusBadge status={selectedLetter.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailItem
                label="Letter ID"
                value={getId(selectedLetter)}
              />

              <DetailItem
                label="Employee ID"
                value={getId(selectedLetter.employeeId)}
              />

              <DetailItem
                label="Employee Code"
                value={
                  selectedLetter.employeeId?.empId ||
                  selectedLetter.employeeId?.employeeCode ||
                  "—"
                }
              />

              <DetailItem
                label="Department"
                value={selectedLetter.employeeId?.department}
              />

              <DetailItem
                label="Designation"
                value={selectedLetter.employeeId?.designation}
              />

              <DetailItem
                label="Template"
                value={selectedLetter.template || "default"}
              />

              <DetailItem
                label="Version"
                value={`v${selectedLetter.version || 1}`}
              />

              <DetailItem
                label="Created on"
                value={formatDate(selectedLetter.createdAt)}
              />

              <DetailItem
                label="Submitted on"
                value={formatDate(selectedLetter.submittedAt)}
              />

              <DetailItem
                label="Created by"
                value={
                  selectedLetter.createdBy?.name ||
                  selectedLetter.createdBy?.email ||
                  getId(selectedLetter.createdBy) ||
                  "—"
                }
              />
            </div>

            {Array.isArray(selectedLetter.previousVersions) &&
              selectedLetter.previousVersions.length > 0 && (
                <div className="rounded-xl border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Previous Versions
                  </h3>

                  <div className="mt-3 space-y-2">
                    {selectedLetter.previousVersions.map((version) => (
                      <div
                        key={version._id || version.version}
                        className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            Version {version.version}
                          </p>

                          <p className="text-xs text-slate-500">
                            {formatDate(version.generatedAt)}
                          </p>
                        </div>

                        <span className="text-xs text-slate-500">
                          Archived
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <button
              type="button"
              onClick={() => handleDownloadPdf(selectedLetter)}
              disabled={
                actionLoading === `pdf-${getId(selectedLetter)}`
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Download size={17} />
              Download Letter PDF
            </button>
          </div>
        </Modal>
      )}

      {/* Reject letter modal */}
      {rejectLetter && (
        <Modal
          title="Reject Letter"
          subtitle="Comments are required when rejecting a letter."
          onClose={() => {
            if (!actionLoading.startsWith("approval-")) {
              setRejectLetter(null);
              setApprovalComments("");
            }
          }}
        >
          <form onSubmit={handleRejectSubmit} className="space-y-5">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Letter
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {rejectLetter.letterType}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {getLetterEmployeeName(rejectLetter)}
              </p>
            </div>

            <div>
              <label
                htmlFor="approvalComments"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Rejection comments
              </label>

              <textarea
                id="approvalComments"
                required
                rows={4}
                value={approvalComments}
                onChange={(event) =>
                  setApprovalComments(event.target.value)
                }
                placeholder="Enter the reason for rejection..."
                className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => {
                  setRejectLetter(null);
                  setApprovalComments("");
                }}
                disabled={actionLoading.startsWith("approval-")}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  !approvalComments.trim() ||
                  actionLoading ===
                    `approval-${getId(rejectLetter)}`
                }
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XCircle size={16} />

                {actionLoading ===
                `approval-${getId(rejectLetter)}`
                  ? "Rejecting..."
                  : "Confirm Rejection"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  count,
  description,
  icon: Icon,
  iconClass,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {count}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${iconClass}`}>
          <Icon size={22} />
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function ActionButton({
  children,
  title,
  onClick,
  disabled = false,
  className = "",
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-500">{label}</p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value || "—"}
      </p>
    </div>
  );
}
