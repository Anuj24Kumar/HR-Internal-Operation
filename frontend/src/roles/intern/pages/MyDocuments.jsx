import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, RefreshCw, UploadCloud } from "lucide-react";

import {
  getMyDocuments,
  uploadInternDocument,
  updateInternDocument,
} from "../services/internService.js";

import EmptyState from "../components/EmptyState.jsx";

const documentTypes = [
  { value: "resume", label: "Resume" },
  { value: "aadhaar", label: "Aadhaar Card" },
  { value: "pan", label: "PAN Card" },
  {
    value: "educational_certificate",
    label: "Educational Certificate",
  },
  { value: "experience_letter", label: "Experience Letter" },
  { value: "other", label: "Other" },
];

function formatDate(date) {
  if (!date) return "Not available";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Not available";

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getFileUrl(fileUrl) {
  if (!fileUrl) return "";

  if (/^https?:\/\//i.test(fileUrl)) {
    return fileUrl;
  }

  const apiBase = import.meta.env.VITE_API_URL;

  const origin = apiBase
    ? new URL(apiBase, window.location.origin).origin
    : window.location.origin;

  return `${origin}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
}

export default function MyDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [uploading, setUploading] = useState(false);

  const [documentType, setDocumentType] = useState("resume");
  const [documentName, setDocumentName] = useState("");
  const [file, setFile] = useState(null);

  const formRef = useRef(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getMyDocuments();

      if (!Array.isArray(result.documents)) {
        throw new Error("Invalid document list received from server.");
      }

      setDocuments(result.documents);
    } catch (err) {
      setError(err.message || "Unable to load documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  async function handleUpload(event) {
    event.preventDefault();

    setUploading(true);
    setActionMessage("");
    setActionError("");

    try {
      await uploadInternDocument({
        documentType,
        documentName,
        file,
      });

      
     setDocumentName("");
setFile(null);
setDocumentType("resume");

// Reset form safely after upload
formRef.current?.reset();

setActionMessage("Document uploaded successfully.");

// Refresh documents immediately
await loadDocuments();
    } catch (err) {
      setActionError(err.message || "Document upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleReupload(documentId, replacementFile) {
    if (!replacementFile) return;

    setActionMessage("");
    setActionError("");

    try {
      await updateInternDocument(documentId, replacementFile);

      setActionMessage("Replacement document uploaded successfully.");

      await loadDocuments();
    } catch (err) {
      setActionError(err.message || "Document re-upload failed.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          My Documents
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Upload documents and review their current status.
        </p>
      </div>

      {actionMessage && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          {actionMessage}
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {actionError}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <UploadCloud size={22} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              Upload a Document
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select a document type and choose a file.
            </p>
          </div>
        </div>

        <form
  ref={formRef}
  onSubmit={handleUpload}
  className="grid gap-4 md:grid-cols-2"
>
          <div>
            <label
              htmlFor="documentType"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Document Type
            </label>

            <select
              id="documentType"
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              required
            >
              {documentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="documentName"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Document Name
            </label>

            <input
              id="documentName"
              type="text"
              value={documentName}
              onChange={(event) => setDocumentName(event.target.value)}
              placeholder="Enter document name"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="documentFile"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Choose File
            </label>

            <input
              id="documentFile"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-medium file:text-blue-700"
              required
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UploadCloud size={17} />
              {uploading ? "Uploading..." : "Upload Document"}
            </button>
          </div>
        </form>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Uploaded Documents
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Documents retrieved from your account.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDocuments}
            disabled={loading}
            aria-label="Refresh documents"
            className="rounded-xl border border-slate-200 bg-white p-3 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={17} />
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">
            Loading documents...
          </p>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-white p-6">
            <p className="font-semibold text-red-700">
              Unable to load documents
            </p>

            <p className="mt-2 text-sm text-slate-600">{error}</p>

            <button
              type="button"
              onClick={loadDocuments}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
            >
              Try again
            </button>
          </div>
        ) : documents.length === 0 ? (
          <EmptyState
            title="No documents uploaded"
            description="No documents were returned for your account. You can upload a document using the form above."
          />
        ) : (
          <div className="space-y-3">
            {documents.map((document) => {
              const status = document.status || "unknown";

              const statusClasses = {
                approved: "bg-emerald-50 text-emerald-700",
                verified: "bg-emerald-50 text-emerald-700",
                pending: "bg-amber-50 text-amber-700",
                rejected: "bg-red-50 text-red-700",
              };

              return (
                <article
                  key={document._id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <FileText size={21} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="break-words font-semibold text-slate-900">
                        {document.documentName || "Unnamed document"}
                      </h3>

                      <p className="mt-1 text-xs capitalize text-slate-500">
                        {(document.documentType || "other").replaceAll("_", " ")}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Uploaded: {formatDate(document.uploadedAt || document.createdAt)}
                      </p>

                      {document.rejectionReason && (
                        <p className="mt-2 text-sm text-red-600">
                          Reason: {document.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                        statusClasses[status] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {status.replaceAll("_", " ")}
                    </span>

                    {document.fileUrl && (
                      <a
                        href={getFileUrl(document.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        View
                      </a>
                    )}

                    {status === "rejected" && (
                      <label className="cursor-pointer rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                        Re-upload
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                          className="hidden"
                          onChange={(event) => {
                            const replacementFile =
                              event.target.files?.[0];

                            if (replacementFile) {
                              handleReupload(
                                document._id,
                                replacementFile
                              );
                            }

                            event.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}