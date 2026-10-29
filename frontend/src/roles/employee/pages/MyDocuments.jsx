
import { useEffect, useState } from "react";
import {
  getMyEmployeeDocuments,
  uploadEmployeeDocument,
  updateEmployeeDocument,
} from "../services/employeeService.js";

const DOCUMENT_TYPES = [
  { value: "resume", label: "Resume" },
  { value: "aadhaar", label: "Aadhaar Card" },
  { value: "pan", label: "PAN Card" },
  { value: "educational_certificate", label: "Educational Certificate" },
  { value: "experience_letter", label: "Experience Letter" },
  { value: "other", label: "Other" },
];

function formatDate(date) {
  if (!date) return "Not available";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }) {
  const normalizedStatus = (status || "pending").toLowerCase();

  const styles = {
    approved: "bg-green-100 text-green-700",
    verified: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    rejected: "bg-red-100 text-red-700",
    uploaded: "bg-blue-100 text-blue-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${
        styles[normalizedStatus] || "bg-slate-100 text-slate-600"
      }`}
    >
      {normalizedStatus.replaceAll("_", " ")}
    </span>
  );
}

export default function MyDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("resume");
  const [selectedFile, setSelectedFile] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [reuploadingId, setReuploadingId] = useState(null);

  async function fetchDocuments() {
    try {
      setLoading(true);
      setError("");

      const response = await getMyEmployeeDocuments();

      setDocuments(response.documents || []);
    } catch (err) {
      setError(err.message || "Unable to load employee documents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDocuments();
  }, []);

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;

    setSelectedFile(file);

    if (file && !documentName.trim()) {
      setDocumentName(file.name);
    }
  }

  async function handleUpload(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!documentName.trim()) {
      setError("Please enter a document name.");
      return;
    }

    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("documentType", documentType);
      formData.append("documentName", documentName.trim());
      formData.append("document", selectedFile);

      const response = await uploadEmployeeDocument(formData);

      setSuccess(response.message || "Document uploaded successfully.");

      setDocumentName("");
      setDocumentType("resume");
      setSelectedFile(null);

      event.target.reset();

      await fetchDocuments();
    } catch (err) {
      setError(err.message || "Unable to upload document.");
    } finally {
      setUploading(false);
    }
  }

  async function handleReupload(documentId, file) {
    if (!file) return;

    setError("");
    setSuccess("");

    try {
      setReuploadingId(documentId);

      const formData = new FormData();

      formData.append("document", file);

      const response = await updateEmployeeDocument(
        documentId,
        formData
      );

      setSuccess(response.message || "Document re-uploaded successfully.");

      await fetchDocuments();
    } catch (err) {
      setError(err.message || "Unable to re-upload document.");
    } finally {
      setReuploadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          My Documents
        </h1>

        <p className="mt-2 text-slate-500">
          View and upload your employee documents.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Upload Document */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Upload Document
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Select a document type and upload your file.
        </p>

        <form onSubmit={handleUpload} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Document Type */}
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
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Document Name */}
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
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* File */}
          <div>
            <label
              htmlFor="documentFile"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Select File
            </label>

            <input
              id="documentFile"
              type="file"
              onChange={handleFileChange}
              className="block w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-600 file:mr-4 file:border-0 file:bg-slate-100 file:px-4 file:py-3 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
            />

            {selectedFile && (
              <p className="mt-2 text-xs text-slate-500">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? "Uploading..." : "Upload Document"}
          </button>
        </form>
      </div>

      {/* Documents List */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Employee Documents
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Documents associated with your employee account.
            </p>
          </div>

          {!loading && !error && (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              {documents.length} document{documents.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <p className="mt-5 text-sm text-slate-500">
            Loading documents...
          </p>
        )}

        {/* Empty State */}
        {!loading && !error && documents.length === 0 && (
          <div className="mt-5 rounded-lg bg-slate-50 p-8 text-center">
            <h3 className="font-medium text-slate-700">
              No documents found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Your uploaded documents will appear here.
            </p>
          </div>
        )}

        {/* Documents Table */}
        {!loading && !error && documents.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[750px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    Document Name
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    Type
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    Uploaded Date
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    Status
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {documents.map((document) => (
                  <tr
                    key={document._id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-4 text-sm font-medium text-slate-800">
                      {document.documentName || "Not available"}
                    </td>

                    <td className="px-4 py-4 text-sm capitalize text-slate-600">
                      {document.documentType?.replaceAll("_", " ") ||
                        "Not available"}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {formatDate(document.uploadedAt || document.createdAt)}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={document.status} />
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-3">
                        {document.fileUrl && (
                          <a
                            href={document.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            View
                          </a>
                        )}

                        {document.status?.toLowerCase() === "rejected" && (
                          <label className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                            {reuploadingId === document._id
                              ? "Uploading..."
                              : "Re-upload"}

                            <input
                              type="file"
                              className="hidden"
                              disabled={reuploadingId === document._id}
                              onChange={(event) => {
                                const file = event.target.files?.[0];

                                if (file) {
                                  handleReupload(document._id, file);
                                }

                                event.target.value = "";
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

