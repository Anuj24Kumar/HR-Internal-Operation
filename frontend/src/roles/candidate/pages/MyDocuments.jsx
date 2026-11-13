import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { useAlert } from "../../../components/AlertProvider.jsx";
import Spinner from "../../../components/Spinner.jsx";
import EmptyState from "../../../components/EmptyState.jsx";
import {
  deleteMyDocument,
  getMyDocuments,
  uploadMyDocument,
} from "../services/candidateService.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];

const DOCUMENT_TYPES = [
  ["resume", "Resume / CV"],
  ["aadhaar", "Aadhaar Card"],
  ["pan", "PAN Card"],
  ["educational_certificate", "Educational Certificate"],
  ["experience_letter", "Experience Letter"],
  ["other", "Other"],
];

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function StatusBadge({ status }) {
  const normalized = String(status || "pending").toLowerCase();
  const classes = ["verified", "approved", "accepted"].includes(normalized)
    ? "bg-emerald-100 text-emerald-800"
    : ["rejected", "declined"].includes(normalized)
      ? "bg-rose-100 text-rose-800"
      : "bg-amber-100 text-amber-800";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status || "Pending"}
    </span>
  );
}

function DocumentCard({ document, onDelete, deleting }) {
  const fileUrl = document.fileUrl || document.url;
  const name = document.label || document.documentName || document.documentType || "Document";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-slate-900">{name}</p>
            <p className="truncate text-[11px] text-slate-400">
              {document.originalName || document.fileName || "Uploaded document"}
            </p>
            <p className="text-[11px] text-slate-400">
              Uploaded {formatDate(document.createdAt || document.uploadedAt)}
            </p>
          </div>
        </div>
        <StatusBadge status={document.status} />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
        <div className="flex items-center gap-3">
          {fileUrl && (
            <>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View
              </a>
              <a
                href={fileUrl}
                download
                className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:underline"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
            </>
          )}
        </div>
        {document.status === "pending" && document._id && (
          <button
            type="button"
            onClick={() => onDelete(document._id)}
            disabled={deleting}
            className="font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-60"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function MyDocuments() {
  const alert = useAlert();
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await getMyDocuments();
      const records = result.documents || result.data?.documents || [];
      setDocuments(Array.isArray(records) ? records : []);
    } catch (loadError) {
      console.error("Load candidate documents error:", loadError.message);
      setError(loadError.message || "Unable to load your documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    setError("");
    setSuccess("");

    if (file && file.size > MAX_FILE_SIZE) {
      setError("File size must be 10 MB or less.");
      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    if (file && !ALLOWED_FILE_TYPES.includes(file.type)) {
      setError("Only PDF, DOC, DOCX, JPG and PNG files are allowed.");
      event.target.value = "";
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  }

  async function handleUpload(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!documentType || !selectedFile) {
      setError("Select a document type and file to upload.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("document", selectedFile);
      formData.append("documentType", documentType);
      formData.append("documentName", selectedFile.name);
      await uploadMyDocument(formData);
      setSuccess("Document uploaded successfully.");
      setSelectedFile(null);
      setDocumentType("");
      await loadDocuments();
    } catch (uploadError) {
      setError(uploadError.message || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(documentId) {
    const confirmed = await alert.confirm({
      title: "Delete document?",
      message: "Are you sure you want to delete this document? This cannot be undone.",
      type: "danger",
      confirmText: "Delete",
    });
    if (!confirmed) return;

    try {
      setDeletingId(documentId);
      setError("");
      await deleteMyDocument(documentId);
      setSuccess("Document deleted successfully.");
      await loadDocuments();
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete document.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <Spinner message="Loading your documents..." />;

  const offerDocuments = documents.filter((document) => Boolean(document.offerId));
  const otherDocuments = documents.filter((document) => !document.offerId);

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      <header>
        <div className="mb-1.5 flex items-center gap-2 text-xs text-slate-400">
          <Link to="/candidate" className="transition hover:text-slate-600">
            Candidate Portal
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-600">My Documents</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">My Documents</h1>
        <p className="mt-1 text-xs text-slate-500">
          Manage your profile documents and view documents submitted with your offer.
        </p>
      </header>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <section className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Offer &amp; Onboarding Documents</h2>
              <p className="text-xs text-slate-500">Documents submitted during offer acceptance.</p>
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {offerDocuments.length} document{offerDocuments.length === 1 ? "" : "s"}
          </span>
        </div>
        {offerDocuments.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {offerDocuments.map((document) => (
              <DocumentCard key={document._id} document={document} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No offer documents yet"
            description="Documents submitted during offer acceptance will appear here."
          />
        )}
      </section>

      <section className="space-y-6 rounded-2xl border border-slate-200/90 bg-white p-6">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FolderOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">My Other Documents</h2>
            <p className="text-xs text-slate-500">Upload and manage your resume, certificates, and other files.</p>
          </div>
        </div>

        <form onSubmit={handleUpload} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-semibold text-slate-700">
              <span>Document type</span>
              <select
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select document type</option>
                {DOCUMENT_TYPES.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-xs font-semibold text-slate-700">
              <span>Select file</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                required
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs"
              />
              <span className="block font-normal text-slate-500">PDF, DOC, DOCX, JPG or PNG up to 10 MB</span>
            </label>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading || !selectedFile || !documentType}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {uploading ? "Uploading..." : "Upload Document"}
            </button>
          </div>
        </form>

        {otherDocuments.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {otherDocuments.map((document) => (
              <DocumentCard
                key={document._id}
                document={document}
                onDelete={handleDelete}
                deleting={deletingId === document._id}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No additional documents"
            description="Your profile documents will appear here after you upload them."
          />
        )}
      </section>
    </div>
  );
}
