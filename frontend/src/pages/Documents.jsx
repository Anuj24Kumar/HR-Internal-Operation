import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileText,
  Search,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  X,
  RefreshCw,
  File,
  UserRound,
  BriefcaseBusiness,
  Clock,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { apiRequest } from "../api";

const STATUS_STYLES = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Verified: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Rejected: "bg-red-50 text-red-700 ring-red-200",
};

function getId(value) {
  if (!value) return "";
  if (typeof value === "object") return value._id || value.id || "";
  return String(value);
}

function getOwnerName(document) {
  const owner = document.candidateId || document.employeeId;

  if (!owner || typeof owner !== "object") {
    return document.ownerType || "—";
  }

  const personalInfo = owner.personalInfo || {};

  const fullName =
    personalInfo.fullName ||
    personalInfo.name ||
    [
      personalInfo.firstName,
      personalInfo.middleName,
      personalInfo.lastName,
    ]
      .filter(Boolean)
      .join(" ");

  return (
    fullName ||
    owner.name ||
    owner.fullName ||
    owner.empId ||
    owner.employeeCode ||
    owner.email ||
    "Unnamed owner"
  );
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

function formatFileSize(bytes) {
  if (bytes == null || Number.isNaN(Number(bytes))) return "—";

  const size = Number(bytes);

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function getErrorMessage(error) {
  return error?.message || "Something went wrong. Please try again.";
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        STATUS_STYLES[status] || "bg-gray-50 text-gray-600 ring-gray-200"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
}

function Modal({ title, subtitle, onClose, children, size = "max-w-lg" }) {
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
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close modal"
          >
            <X size={19} />
          </button>
        </div>

        <div className="p-6">{children}</div>
      </section>
    </div>
  );
}

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [selectedDocument, setSelectedDocument] = useState(null);
  const [rejectDocument, setRejectDocument] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [actionLoading, setActionLoading] = useState("");

  const fetchDocuments = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const result = await apiRequest("/documents");

      setDocuments(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return documents.filter((document) => {
      const statusMatches =
        statusFilter === "All" || document.status === statusFilter;

      const ownerName = getOwnerName(document);

      const searchText = [
        document.originalName,
        document.documentName,
        document.fileName,
        document.documentType,
        document.ownerType,
        ownerName,
        document.status,
        getId(document.candidateId),
        getId(document.employeeId),
        document.uploadedBy?.name,
        document.uploadedBy?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return statusMatches && (!query || searchText.includes(query));
    });
  }, [documents, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: documents.length,
      pending: documents.filter((doc) => doc.status === "Pending").length,
      verified: documents.filter((doc) => doc.status === "Verified").length,
      rejected: documents.filter((doc) => doc.status === "Rejected").length,
    }),
    [documents]
  );

  async function handleDownload(document) {
    const id = getId(document);

    if (!id) {
      setError("Document ID is missing.");
      return;
    }

    setActionLoading(`download-${id}`);
    setError("");

    try {
      const response = await apiRequest(`/documents/${id}/file`);

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");

      anchor.href = downloadUrl;
      anchor.download =
        document.originalName || document.documentName || "document";

      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading("");
    }
  }

  async function handleView(document) {
    const id = getId(document);

    setActionLoading(`view-${id}`);
    setError("");

    try {
      const result = await apiRequest(`/documents/${id}`);

      setSelectedDocument(result.data || document);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading("");
    }
  }

  async function handleVerify(document) {
    const id = getId(document);

    if (!window.confirm("Are you sure you want to verify this document?")) {
      return;
    }

    setActionLoading(`verify-${id}`);
    setError("");
    setNotice("");

    try {
      const result = await apiRequest(`/documents/${id}/verify`, {
        method: "PATCH",
      });

      setNotice(result.message || "Document verified successfully.");
      await fetchDocuments(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading("");
    }
  }

  async function handleReject(event) {
    event.preventDefault();

    if (!rejectDocument) return;

    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejecting this document.");
      return;
    }

    const id = getId(rejectDocument);

    setActionLoading(`reject-${id}`);
    setError("");
    setNotice("");

    try {
      const result = await apiRequest(`/documents/${id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({
          reason: rejectionReason.trim(),
        }),
      });

      setNotice(result.message || "Document rejected successfully.");
      setRejectDocument(null);
      setRejectionReason("");

      await fetchDocuments(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading("");
    }
  }

  async function handleDelete(document) {
    const id = getId(document);

    if (
      !window.confirm(
        `Delete "${document.originalName || document.documentName || "this document"}"? This also deletes its stored file.`
      )
    ) {
      return;
    }

    setActionLoading(`delete-${id}`);
    setError("");
    setNotice("");

    try {
      const result = await apiRequest(`/documents/${id}`, {
        method: "DELETE",
      });

      setDocuments((previous) =>
        previous.filter((item) => getId(item) !== id)
      );

      if (getId(selectedDocument) === id) {
        setSelectedDocument(null);
      }

      setNotice(result.message || "Document deleted successfully.");
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
              HR Management / Documents
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Document Management
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Review, verify and manage candidate and employee uploaded documents.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => fetchDocuments(true)}
              disabled={loading || refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Feedback messages */}
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
            title="Total Documents"
            count={stats.total}
            description="All uploaded records"
            icon={FileText}
            iconClass="bg-indigo-50 text-indigo-600"
          />
          <SummaryCard
            title="Pending Review"
            count={stats.pending}
            description="Awaiting HR verification"
            icon={Clock}
            iconClass="bg-amber-50 text-amber-600"
          />
          <SummaryCard
            title="Verified"
            count={stats.verified}
            description="Successfully approved"
            icon={ShieldCheck}
            iconClass="bg-emerald-50 text-emerald-600"
          />
          <SummaryCard
            title="Rejected"
            count={stats.rejected}
            description="Require attention"
            icon={XCircle}
            iconClass="bg-red-50 text-red-600"
          />
        </div>

        {/* Document table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  All Documents
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {filteredDocuments.length} of {documents.length} documents
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
                    placeholder="Search documents..."
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
                  <option value="Pending">Pending</option>
                  <option value="Verified">Verified</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-500">
              <RefreshCw size={25} className="animate-spin text-indigo-600" />
              <p className="text-sm">Loading documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
              <div className="mb-4 rounded-2xl bg-slate-100 p-4 text-slate-400">
                <FileText size={30} />
              </div>

              <h3 className="font-semibold text-slate-800">
                {documents.length === 0
                  ? "No documents found"
                  : "No matching documents"}
              </h3>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                {documents.length === 0
                  ? "No candidate or employee documents have been uploaded yet."
                  : "Try another search term or change the status filter."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left">
                <thead className="bg-slate-50">
                  <tr className="border-y border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4 font-semibold">Document</th>
                    <th className="px-5 py-4 font-semibold">Owner</th>
                    <th className="px-5 py-4 font-semibold">Uploaded</th>
                    <th className="px-5 py-4 font-semibold">Size</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredDocuments.map((document) => {
                    const id = getId(document);
                    const isPending = document.status === "Pending";

                    return (
                      <tr
                        key={id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                              <File size={21} />
                            </div>

                            <div className="min-w-0">
                              <p
                                className="max-w-64 truncate text-sm font-semibold text-slate-800"
                                title={
                                  document.originalName ||
                                  document.documentName
                                }
                              >
                                {document.originalName ||
                                  document.documentName ||
                                  "Untitled document"}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {document.documentType || "Uncategorized"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                              {document.employeeId ? (
                                <BriefcaseBusiness size={15} />
                              ) : (
                                <UserRound size={15} />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">
                                {getOwnerName(document)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {document.employeeId
                                  ? "Employee"
                                  : document.candidateId
                                    ? "Candidate"
                                    : document.ownerType || "Owner"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(document.createdAt)}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatFileSize(
                            document.size ?? document.fileSize
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={document.status} />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <ActionButton
                              title="View details"
                              onClick={() => handleView(document)}
                              disabled={actionLoading === `view-${id}`}
                            >
                              <Eye size={17} />
                            </ActionButton>

                            <ActionButton
                              title="Download file"
                              onClick={() => handleDownload(document)}
                              disabled={
                                actionLoading === `download-${id}`
                              }
                            >
                              {actionLoading === `download-${id}` ? (
                                <RefreshCw
                                  size={17}
                                  className="animate-spin"
                                />
                              ) : (
                                <Download size={17} />
                              )}
                            </ActionButton>

                            {isPending && (
                              <>
                                <ActionButton
                                  title="Verify document"
                                  onClick={() => handleVerify(document)}
                                  disabled={
                                    actionLoading === `verify-${id}`
                                  }
                                  className="text-emerald-600 hover:bg-emerald-50"
                                >
                                  <CheckCircle size={17} />
                                </ActionButton>

                                <ActionButton
                                  title="Reject document"
                                  onClick={() => {
                                    setError("");
                                    setRejectDocument(document);
                                    setRejectionReason("");
                                  }}
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <XCircle size={17} />
                                </ActionButton>
                              </>
                            )}

                            <ActionButton
                              title="Delete document"
                              onClick={() => handleDelete(document)}
                              disabled={actionLoading === `delete-${id}`}
                              className="text-red-500 hover:bg-red-50"
                            >
                              {actionLoading === `delete-${id}` ? (
                                <RefreshCw
                                  size={17}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2 size={17} />
                              )}
                            </ActionButton>
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
          Document actions are validated by your backend permissions. Only
          authorized users can complete verification, rejection or deletion.
        </p>
      </div>

      {/* Details modal */}
      {selectedDocument && (
        <Modal
          title="Document Details"
          subtitle="Document information and verification status."
          onClose={() => setSelectedDocument(null)}
        >
          <div className="space-y-5">
            <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
              <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600">
                <FileText size={26} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="break-words font-semibold text-slate-900">
                  {selectedDocument.originalName ||
                    selectedDocument.documentName ||
                    "Untitled document"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedDocument.documentType || "Uncategorized"}
                </p>
                <div className="mt-2">
                  <StatusBadge status={selectedDocument.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailItem
                label="Owner type"
                value={
                  selectedDocument.employeeId ? "Employee" : "Candidate"
                }
              />
              <DetailItem
                label="Owner name"
                value={getOwnerName(selectedDocument)}
              />
              <DetailItem
                label="Document ID"
                value={getId(selectedDocument)}
              />
              <DetailItem
                label="Owner ID"
                value={getId(
                  selectedDocument.candidateId ||
                    selectedDocument.employeeId
                )}
              />
              <DetailItem
                label="File size"
                value={formatFileSize(
                  selectedDocument.size ?? selectedDocument.fileSize
                )}
              />
              <DetailItem
                label="File type"
                value={
                  selectedDocument.mimeType ||
                  selectedDocument.fileType ||
                  "—"
                }
              />
              <DetailItem
                label="Uploaded on"
                value={formatDate(selectedDocument.createdAt)}
              />
              <DetailItem
                label="Uploaded by"
                value={
                  selectedDocument.uploadedBy?.name ||
                  selectedDocument.uploadedBy?.email ||
                  getId(selectedDocument.uploadedBy) ||
                  "—"
                }
              />
              <DetailItem
                label="Verified by"
                value={
                  selectedDocument.verifiedBy?.name ||
                  selectedDocument.verifiedBy?.email ||
                  getId(selectedDocument.verifiedBy) ||
                  "—"
                }
              />
              <DetailItem
                label="Verified on"
                value={formatDate(selectedDocument.verifiedAt)}
              />
            </div>

            {selectedDocument.rejectionReason && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">
                  Rejection reason
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-red-700">
                  {selectedDocument.rejectionReason}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleDownload(selectedDocument)}
              disabled={
                actionLoading ===
                `download-${getId(selectedDocument)}`
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Download size={17} />
              Download Document
            </button>
          </div>
        </Modal>
      )}

      {/* Rejection modal */}
      {rejectDocument && (
        <Modal
          title="Reject Document"
          subtitle="Provide a reason so the document owner knows what needs correction."
          onClose={() => {
            if (!actionLoading.startsWith("reject-")) {
              setRejectDocument(null);
              setRejectionReason("");
            }
          }}
        >
          <form onSubmit={handleReject} className="space-y-5">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Document
              </p>
              <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                {rejectDocument.originalName ||
                  rejectDocument.documentName ||
                  "Untitled document"}
              </p>
            </div>

            <div>
              <label
                htmlFor="rejectionReason"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Reason for rejection
              </label>

              <textarea
                id="rejectionReason"
                required
                rows={4}
                value={rejectionReason}
                onChange={(event) =>
                  setRejectionReason(event.target.value)
                }
                placeholder="For example: Document is unclear or information is missing."
                className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => {
                  setRejectDocument(null);
                  setRejectionReason("");
                }}
                disabled={actionLoading.startsWith("reject-")}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  !rejectionReason.trim() ||
                  actionLoading === `reject-${getId(rejectDocument)}`
                }
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XCircle size={16} />
                {actionLoading === `reject-${getId(rejectDocument)}`
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

function SummaryCard({ title, count, description, icon: Icon, iconClass }) {
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