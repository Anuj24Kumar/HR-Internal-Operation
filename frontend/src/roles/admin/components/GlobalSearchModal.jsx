import React, { useEffect, useState } from "react";
import { Search, X, Download, Loader2 } from "lucide-react";
import { performGlobalSearch, downloadSearchExport } from "../adminApi.js";
import { RoleBadge, StatusBadge } from "./Badge.jsx";
import { useAlert } from "../../../components/AlertProvider.jsx";

const EMPTY_RESULTS = {
  users: [], applications: [], offers: [], interviews: [], documents: [], letters: [],
};
const GROUPS = [
  { key: "users", title: "Users", tab: "users" },
  { key: "applications", title: "Applications", tab: "recruitment" },
  { key: "offers", title: "Offers", tab: "recruitment" },
  { key: "interviews", title: "Interviews", tab: "recruitment" },
  { key: "documents", title: "Documents", tab: "employees" },
  { key: "letters", title: "Letters", tab: "employees" },
];

export default function GlobalSearchModal({ isOpen, onClose, onNavigate }) {
  const alert = useAlert();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [results, setResults] = useState(EMPTY_RESULTS);
  const [counts, setCounts] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults(EMPTY_RESULTS);
      setCounts({});
      setError("");
      return undefined;
    }
    const term = query.trim();
    if (term.length < 2) {
      setResults(EMPTY_RESULTS);
      setCounts({});
      setError("");
      return undefined;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await performGlobalSearch(term, 5);
        if (active) {
          setResults(response.data || response.results || EMPTY_RESULTS);
          setCounts(response.counts || {});
          setError("");
        }
      } catch (requestError) {
        if (active) setError(requestError.message || "Search failed.");
      } finally {
        if (active) setLoading(false);
      }
    }, 300);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  async function handleExport() {
    const confirmed = await alert.confirm({
      title: "Export search results?",
      message: "Download the matching user and workflow records as a CSV file.",
      confirmText: "Export",
    });
    if (!confirmed) return;
    try {
      setExporting(true);
      await downloadSearchExport(query.trim(), "csv");
    } catch (requestError) {
      alert.toastError("Export failed", requestError.message);
    } finally {
      setExporting(false);
    }
  }

  function chooseRecord(tab) {
    onNavigate?.(tab);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="admin-modal-box modal-lg" style={{ padding: 0, maxHeight: "82vh", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #e2e8f0", gap: 12 }}>
          <Search size={20} color="#64748b" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search users, applications, offers, interviews, documents, letters..."
            style={{ flex: 1, border: 0, outline: 0, fontSize: 15 }}
          />
          {loading && <Loader2 size={18} className="spin" color="#2563eb" />}
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={16} /></button>}
          <button type="button" onClick={onClose} aria-label="Close search"><X size={18} /></button>
        </div>

        <div style={{ padding: "16px 20px", overflowY: "auto", maxHeight: "68vh" }}>
          {query.trim().length < 2 && <p style={{ color: "#64748b" }}>Enter at least 2 characters to search all records.</p>}
          {error && <div className="admin-alert admin-alert-error">{error}</div>}
          {Object.values(counts).every((count) => !count) && query.trim().length >= 2 && !loading && !error && (
            <p style={{ color: "#64748b" }}>No matching records found.</p>
          )}
          {GROUPS.map(({ key, title, tab }) => {
            const items = results[key] || [];
            if (!items.length) return null;
            return (
              <section key={key} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <strong>{title} ({counts[key] ?? items.length})</strong>
                  {(counts[key] || items.length) > items.length && (
                    <button type="button" className="admin-btn admin-btn-sm admin-btn-secondary" onClick={() => chooseRecord(tab)}>View all</button>
                  )}
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {items.slice(0, 5).map((item) => {
                    const person = item.candidateId || item.ownerId || item.employeeId;
                    const label = item.name || item.candidateName || person?.name || item.label || item.title || item.roundName || item.designation || item.position || "Record";
                    const detail = item.email || item.position || item.designation || item.status || item.type || "";
                    return (
                      <button
                        type="button"
                        key={item._id}
                        onClick={() => chooseRecord(tab)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, textAlign: "left", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, background: "white" }}
                      >
                        <span style={{ display: "grid" }}>
                          <strong>{label}</strong>
                          <small style={{ color: "#64748b" }}>{detail}</small>
                        </span>
                        {key === "users" && <RoleBadge role={item.role} />}
                        {item.status && <StatusBadge label={item.status} active={item.isActive} />}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
        {query.trim().length >= 2 && (
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 20px", borderTop: "1px solid #e2e8f0" }}>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={handleExport} disabled={exporting}>
              <Download size={14} /> {exporting ? "Exporting..." : "Export CSV"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
