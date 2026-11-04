import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyDocuments } from "../services/candidateService.js";
import { apiRequest } from "../../../api.js";
import { useAlert } from "../../../components/AlertProvider.jsx";
import FileUpload from "../../../components/FileUpload.jsx";
import Spinner from "../../../components/Spinner.jsx";
import EmptyState from "../../../components/EmptyState.jsx";
import {
  FileText,
  Download,
  Trash2,
  ExternalLink,
  ShieldCheck,
  FolderOpen,
  Plus,
} from "lucide-react";

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
  const normalized = String(status || "Pending").toLowerCase();

  let classes = "bg-amber-100 text-amber-800";
  if (["approved", "verified", "accepted"].includes(normalized)) {
    classes = "bg-emerald-100 text-emerald-800";
  } else if (["rejected", "declined"].includes(normalized)) {
    classes = "bg-rose-100 text-rose-800";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status || "Pending"}
    </span>
  );
}

export default function MyDocuments() {
  const alert = useAlert();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState("Resume");

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await getMyDocuments();
      const docs = res.documents || res.data?.documents || res.data || [];
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (err) {
      console.error("Load documents error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      await alert.alert({
        title: "Missing File",
        message: "Please select a file to upload.",
        type: "warning",
      });
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("document", selectedFile);
      fd.append("documentType", documentType.trim() || "Other");
      fd.append("title", documentType.trim() || selectedFile.name);

      const token = localStorage.getItem("hr-auth-token") || localStorage.getItem("token");
      const res = await fetch("/api/v1/candidates/documents", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");

      await alert.alert({
        title: "Success",
        message: "Document uploaded successfully.",
        type: "success",
      });

      setSelectedFile(null);
      await loadDocuments();
    } catch (err) {
      await alert.alert({
        title: "Upload Failed",
        message: err.message || "Failed to upload document.",
        type: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    const ok = await alert.confirm({
      title: "Delete Document?",
      message: "Are you sure you want to delete this document? This cannot be undone.",
      type: "danger",
      confirmText: "Delete",
    });
    if (!ok) return;

    try {
      await apiRequest(`/candidates/documents/${docId}`, { method: "DELETE" });
      await alert.alert({
        title: "Deleted",
        message: "Document deleted successfully.",
        type: "success",
      });
      await loadDocuments();
    } catch (err) {
      await alert.alert({
        title: "Error",
        message: err.message || "Failed to delete document.",
        type: "error",
      });
    }
  };

  if (loading) return <Spinner message="Loading your documents..." />;

  const offerDocuments = documents.filter(d => Boolean(d.offerId));
  const otherDocuments = documents.filter(d => !d.offerId);

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
          <Link to="/candidate" className="hover:text-slate-600 transition">
            Candidate Portal
          </Link>
          <span>/</span>
          <span className="text-slate-600 font-medium">My Documents</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900">Document Management</h1>
        <p className="text-xs text-slate-500 mt-1">
          View documents submitted for your offer acceptance and manage other profile documents.
        </p>
      </div>

      {/* SECTION 1: Offer & Onboarding Documents */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Offer & Onboarding Documents
              </h2>
              <p className="text-xs text-slate-500">
                Official documents uploaded during offer acceptance (read-only verification copy).
              </p>
            </div>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {offerDocuments.length} document{offerDocuments.length === 1 ? "" : "s"}
          </span>
        </div>

        {offerDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offerDocuments.map(doc => {
              const fileUrl = doc.fileUrl || doc.url || `/uploads/candidate-documents/${doc.filename}`;
              return (
                <div
                  key={doc._id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-900">
                          {doc.title || doc.documentType || "Offer Document"}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Uploaded {formatDate(doc.createdAt)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={doc.status || "Pending"} />
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-slate-200/60 pt-2 text-xs">
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Preview
                    </a>
                    <a
                      href={fileUrl}
                      download
                      className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 transition"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
            No offer acceptance documents uploaded yet. When you accept an offer, documents will appear here.
          </div>
        )}
      </div>

      {/* SECTION 2: My Other Documents */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">My Other Documents</h2>
              <p className="text-xs text-slate-500">
                General resume, certifications, and portfolio files uploaded by you.
              </p>
            </div>
          </div>
        </div>

        {/* Upload form */}
        <form onSubmit={handleUpload} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Document Type / Label <span className="text-rose-500">*</span>
              </label>
              <select
                value={documentType}
                onChange={e => setDocumentType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="Resume">Resume / CV</option>
                <option value="Certificate">Certificate / Degree</option>
                <option value="ID Proof">ID Proof</option>
                <option value="Portfolio">Portfolio Sample</option>
                <option value="Other">Other Document</option>
              </select>
            </div>

            <FileUpload
              label="Select File"
              accept=".pdf,.doc,.docx,.jpg,.png"
              required={true}
              helperText="PDF, DOC, DOCX, JPG, PNG up to 10MB"
              onChange={setSelectedFile}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {uploading ? "Uploading..." : "Upload Document"}
            </button>
          </div>
        </form>

        {/* Document list */}
        {otherDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherDocuments.map(doc => {
              const fileUrl = doc.fileUrl || doc.url || `/uploads/candidate-documents/${doc.filename}`;
              return (
                <div
                  key={doc._id}
                  className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-900">
                          {doc.title || doc.documentType || doc.originalName || "Document"}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Uploaded {formatDate(doc.createdAt)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={doc.status || "Pending"} />
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                    <div className="flex items-center gap-2">
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View
                      </a>
                      <a
                        href={fileUrl}
                        download
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:underline"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(doc._id)}
                      className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
            No additional documents uploaded yet.
          </div>
        )}
      </div>
    </div>
  );
}
