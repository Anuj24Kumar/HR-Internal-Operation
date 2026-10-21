import { useCallback, useEffect, useState } from "react";
import { apiDownload, apiRequest } from "../../api.js";
import useRoleAuth from "../useRoleAuth.js";

const employeeGetEndpoints = [
  { key: "profile", label: "Employee profile", endpoint: "/employee/profile" },
  { key: "history", label: "Employment history", endpoint: "/employee/profile/history" },
  { key: "salary", label: "Salary breakdown", endpoint: "/employee/profile/salary" },
  { key: "documents", label: "Documents", endpoint: "/employee/documents" },
  { key: "letters", label: "Letters", endpoint: "/employee/letters" },
  { key: "resignation", label: "Resignation", endpoint: "/employee/resignation" },
];

export default function EmployeeEntry() {
  const { message, logout, isAuthenticated } = useRoleAuth("employee");
  const [results, setResults] = useState({});
  const [documentId, setDocumentId] = useState("");

  const runApi = useCallback(async (key, endpoint, options) => {
    setResults((current) => ({
      ...current,
      [key]: { status: "Loading", endpoint },
    }));

    try {
      const token = localStorage.getItem("hr-auth-token");
      const data = await apiRequest(endpoint, {
        ...options,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options?.headers || {}),
        },
      });
      setResults((current) => ({
        ...current,
        [key]: { status: "Success", endpoint, data },
      }));
      return data;
    } catch (error) {
      setResults((current) => ({
        ...current,
        [key]: { status: "Error", endpoint, error: error.message },
      }));
      return null;
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    employeeGetEndpoints.forEach(({ key, endpoint }) => {
      runApi(key, endpoint);
    });
  }, [isAuthenticated, runApi]);

  async function refreshEmployeeData(...keys) {
    const endpoints = employeeGetEndpoints.filter(({ key }) => keys.includes(key));
    await Promise.all(endpoints.map(({ key, endpoint }) => runApi(key, endpoint)));
  }

  async function submitDocument(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const uploaded = await runApi("uploadDocument", "/employee/documents", {
      method: "POST",
      body: formData,
    });

    if (uploaded) {
      form.reset();
      await refreshEmployeeData("documents");
    }
  }

  async function replaceDocument(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const replaced = await runApi(
      "replaceDocument",
      `/employee/documents/${encodeURIComponent(documentId)}`,
      {
        method: "PATCH",
        body: formData,
      }
    );

    if (replaced) {
      form.reset();
      setDocumentId("");
      await refreshEmployeeData("documents");
    }
  }

  async function submitResignation(event) {
    event.preventDefault();
    const resignationForm = event.currentTarget;
    const form = new FormData(resignationForm);
    const submitted = await runApi("submitResignation", "/employee/resignation", {
      method: "POST",
      body: JSON.stringify({
        reason: form.get("reason"),
        requestedLastWorkingDay: form.get("requestedLastWorkingDay"),
      }),
    });

    if (submitted) {
      resignationForm.reset();
      await refreshEmployeeData("resignation");
    }
  }

  async function withdrawResignation() {
    if (!window.confirm("Withdraw your pending resignation request?")) return;
    const withdrawn = await runApi("withdrawResignation", "/employee/resignation", {
      method: "DELETE",
    });
    if (withdrawn) await refreshEmployeeData("resignation");
  }

  async function downloadLetter(id) {
    const key = `letterPdf-${id}`;
    const endpoint = `/employee/letters/${encodeURIComponent(id)}/pdf`;
    setResults((current) => ({
      ...current,
      [key]: { status: "Loading", endpoint },
    }));

    try {
      const { blob, filename } = await apiDownload(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem("hr-auth-token")}` },
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setResults((current) => ({
        ...current,
        [key]: { status: "Success", endpoint, data: `Downloaded ${filename}` },
      }));
    } catch (error) {
      setResults((current) => ({
        ...current,
        [key]: { status: "Error", endpoint, error: error.message },
      }));
    }
  }

  return (
    <main className="form-page">
      <section className="simple-form" style={{ width: "min(100%, 900px)" }}>
        <h1>Employee profile</h1>
        <p>{message}</p>
        <button type="button" onClick={logout}>Log out</button>

        <h2>GET API results</h2>
        <ul>
          {employeeGetEndpoints.map(({ key, label, endpoint }) => {
            const result = results[key];
            return (
              <li key={key}>
                <strong>{label}</strong> — GET {endpoint}
                <pre style={{ overflowX: "auto", whiteSpace: "pre-wrap" }}>
                  {result
                    ? JSON.stringify(result, null, 2)
                    : "Waiting for authentication..."}
                </pre>
              </li>
            );
          })}
        </ul>

        <h2>Document APIs</h2>
        <form onSubmit={submitDocument}>
          <h3>Upload document (POST /employee/documents)</h3>
          <label>
            Document name
            <input name="documentName" required />
          </label>
          <label>
            Document type
            <select name="documentType" required defaultValue="other">
              <option value="resume">Resume</option>
              <option value="aadhaar">Aadhaar</option>
              <option value="pan">PAN</option>
              <option value="educational_certificate">Educational certificate</option>
              <option value="experience_letter">Experience letter</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            File (PDF, JPG, or PNG; max 5 MB)
            <input name="document" type="file" accept=".pdf,.jpg,.jpeg,.png" required />
          </label>
          <button type="submit">Upload document</button>
        </form>
        <form onSubmit={replaceDocument}>
          <h3>Re-upload rejected document (PATCH /employee/documents/:id)</h3>
          <label>
            Document ID
            <input
              value={documentId}
              onChange={(event) => setDocumentId(event.target.value)}
              required
            />
          </label>
          <label>
            Corrected file
            <input name="document" type="file" accept=".pdf,.jpg,.jpeg,.png" required />
          </label>
          <button type="submit">Re-upload document</button>
        </form>

        <h2>Letter PDF</h2>
        {(results.letters?.data?.letters || []).map((letter) => (
          <p key={letter._id}>
            {letter.title} (version {letter.version}){" "}
            <button type="button" onClick={() => downloadLetter(letter._id)}>
              Download PDF
            </button>
          </p>
        ))}
        {!results.letters?.data?.letters?.length && <p>Letters will appear here when available.</p>}

        <h2>Resignation APIs</h2>
        <form onSubmit={submitResignation}>
          <h3>Submit resignation (POST /employee/resignation)</h3>
          <label>
            Reason (10–2000 characters)
            <textarea name="reason" minLength="10" maxLength="2000" required />
          </label>
          <label>
            Requested last working day
            <input name="requestedLastWorkingDay" type="date" required />
          </label>
          <button type="submit">Submit resignation</button>
        </form>
        <button type="button" onClick={withdrawResignation}>
          Withdraw pending resignation (DELETE /employee/resignation)
        </button>

        <h2>Mutation and download results</h2>
        <ul>
          {Object.entries(results)
            .filter(([key]) => !employeeGetEndpoints.some((item) => item.key === key))
            .map(([key, result]) => (
              <li key={key}>
                <strong>{key}</strong>
                <pre style={{ overflowX: "auto", whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </li>
            ))}
        </ul>
      </section>
    </main>
  );
}
 