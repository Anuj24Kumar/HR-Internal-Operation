
import { useEffect, useRef, useState } from "react";
import {
  getMyDocuments,
} from "../services/candidateService.js";
import { apiRequest } from "../../../api.js";
import EmptyState from "../components/EmptyState.jsx";

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

function getDocuments(result) {
  const documents =
    result?.documents ??
    result?.data?.documents ??
    result?.data ??
    [];

  return Array.isArray(documents) ? documents : [];
}

function getStatus(document) {
  return (
    document.status ||
    document.verificationStatus ||
    document.documentStatus ||
    "Pending"
  );
}

function StatusBadge({ status }) {
  const normalized = String(status).toLowerCase();

  let classes = "bg-amber-50 text-amber-700";

  if (["approved", "verified", "accepted"].includes(normalized)) {
    classes = "bg-emerald-50 text-emerald-700";
  } else if (["rejected", "declined"].includes(normalized)) {
    classes = "bg-red-50 text-red-700";
  }

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>
      {status}
    </span>
  );
}

export default function MyDocuments() {
  const fileRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadDocuments() {
    try {
      setLoading(true);
      setError("");

      const result = await getMyDocuments();
      setDocuments(getDocuments(result));
    } catch (err) {
      setError(err.message || "Unable to load documents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  async function handleUpload(event) {
    event.preventDefault();

    if (!selectedFile) {
      setError("Please select a document first.");
      return;
    }

    if (!documentType.trim()) {
      setError("Please enter the document type.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("document", selectedFile);

      // Backend controller ke required field ke according
      // document type/name field adjust karna pad sakta hai.
      formData.append("documentType", documentType.trim());

      const token = localStorage.getItem("hr-auth-token");

      if (!token) {
        throw new Error("Please log in again.");
      }

      await apiRequest("/candidates/documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      setSuccess("Document uploaded successfully.");
      setSelectedFile(null);
      setDocumentType("");

      if (fileRef.current) {
        fileRef.current.value = "";
      }

      await loadDocuments();
    } catch (err) {
      setError(err.message || "Document upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(documentId) {
    if (!window.confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const token = localStorage.getItem("hr-auth-token");

      await apiRequest(`/candidates/documents/${documentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess("Document deleted successfully.");
      await loadDocuments();
    } catch (err) {
      setError(err.message || "Unable to delete document.");
    }
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-7">
      <header>
        <p className="text-sm text-slate-500">
          Workspace <span className="mx-2">›</span> My Documents
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          My Documents
        </h1>

        <p className="mt-2 text-slate-500">
          Manage the documents associated with your application.
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

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Upload a document
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Select a file and provide its document type.
        </p>

        <form onSubmit={handleUpload} className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Document type
            <input
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value)}
              placeholder="e.g. Resume"
              className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Choose file
            <input
              ref={fileRef}
              type="file"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={uploading}
              className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Upload Document"}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Uploaded Documents
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {documents.length} document(s)
            </p>
          </div>

          <button
            type="button"
            onClick={loadDocuments}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-sm text-slate-500">
            Loading documents...
          </div>
        ) : documents.length === 0 ? (
          <EmptyState
            title="No documents found"
            description="Your uploaded documents will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Document</th>
                  <th className="px-6 py-4 font-semibold">Uploaded</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {documents.map((document) => {
                  const status = getStatus(document);
                  const id = document._id || document.id;

                  return (
                    <tr key={id} className="hover:bg-slate-50/70">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">
                          {document.name ||
                            document.documentName ||
                            document.documentType ||
                            "Document"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {document.originalName ||
                            document.fileName ||
                            document.filename ||
                            "Uploaded file"}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {formatDate(document.createdAt || document.uploadedAt)}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={status} />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {(document.fileUrl || document.url || document.path) && (
                            <a
                              href={document.fileUrl || document.url || document.path}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-blue-600 hover:text-blue-800"
                            >
                              View
                            </a>
                          )}

                          {id && (
                            <button
                              type="button"
                              onClick={() => handleDelete(id)}
                              className="font-medium text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
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
    </div>
  );
}

