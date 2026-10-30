import React, { useState, useEffect } from "react";
import { Search, X, Download, User, Briefcase, FileCheck, Users as UsersIcon, Loader2 } from "lucide-react";
import { performGlobalSearch, downloadSearchExport } from "../adminApi.js";
import { RoleBadge, StatusBadge } from "./Badge.jsx";

export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [results, setResults] = useState({
    candidates: [],
    employees: [],
    offers: [],
    users: [],
  });
  const [counts, setCounts] = useState({ candidates: 0, employees: 0, offers: 0, users: 0, total: 0 });

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        // Toggle or open
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults({ candidates: [], employees: [], offers: [], users: [] });
      setCounts({ candidates: 0, employees: 0, offers: 0, users: 0, total: 0 });
      return;
    }

    if (!query.trim()) {
      setResults({ candidates: [], employees: [], offers: [], users: [] });
      setCounts({ candidates: 0, employees: 0, offers: 0, users: 0, total: 0 });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await performGlobalSearch(query.trim());
        setResults(res.results || { candidates: [], employees: [], offers: [], users: [] });
        setCounts(res.counts || { candidates: 0, employees: 0, offers: 0, users: 0, total: 0 });
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  async function handleExport(format) {
    if (!query.trim()) return;
    try {
      setExporting(true);
      await downloadSearchExport(query.trim(), format);
    } catch (err) {
      alert("Failed to export search results: " + err.message);
    } finally {
      setExporting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className="admin-modal-box modal-lg"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: 0 }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid #e2e8f0",
            gap: "12px",
          }}
        >
          <Search size={20} style={{ color: "#64748b" }} />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search candidates, employees, offers, users..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "15px",
              fontFamily: "inherit",
              color: "#0f172a",
            }}
          />
          {loading && <Loader2 size={18} className="spin" style={{ color: "#2563eb" }} />}
          {query && !loading && (
            <button
              type="button"
              onClick={() => setQuery("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
            >
              <X size={16} />
            </button>
          )}
          <span className="admin-search-kbd">ESC to exit</span>
        </div>

        {/* Categories Bar */}
        {counts.total > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 20px",
              background: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
              fontSize: "13px",
            }}
          >
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={`admin-btn admin-btn-sm ${activeCategory === "all" ? "admin-btn-primary" : "admin-btn-secondary"}`}
              >
                All ({counts.total})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory("candidates")}
                className={`admin-btn admin-btn-sm ${activeCategory === "candidates" ? "admin-btn-primary" : "admin-btn-secondary"}`}
              >
                Candidates ({counts.candidates})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory("employees")}
                className={`admin-btn admin-btn-sm ${activeCategory === "employees" ? "admin-btn-primary" : "admin-btn-secondary"}`}
              >
                Employees ({counts.employees})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory("offers")}
                className={`admin-btn admin-btn-sm ${activeCategory === "offers" ? "admin-btn-primary" : "admin-btn-secondary"}`}
              >
                Offers ({counts.offers})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory("users")}
                className={`admin-btn admin-btn-sm ${activeCategory === "users" ? "admin-btn-primary" : "admin-btn-secondary"}`}
              >
                Users ({counts.users})
              </button>
            </div>

            <button
              type="button"
              disabled={exporting}
              onClick={() => handleExport("csv")}
              className="admin-btn admin-btn-secondary admin-btn-sm"
              title="Export results to CSV"
            >
              <Download size={13} />
              <span>{exporting ? "Exporting..." : "Export CSV"}</span>
            </button>
          </div>
        )}

        {/* Results List */}
        <div style={{ maxHeight: "450px", overflowY: "auto", padding: "16px 20px" }}>
          {!query && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
              <Search size={36} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "500" }}>
                Type a name, email, department, or keyword to search across the entire platform
              </p>
            </div>
          )}

          {query && counts.total === 0 && !loading && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>
                No records found matching "{query}"
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                Try searching with a different keyword or checking for spelling errors.
              </p>
            </div>
          )}

          {/* Candidates */}
          {(activeCategory === "all" || activeCategory === "candidates") &&
            results.candidates?.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "8px" }}>
                  Candidates ({results.candidates.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {results.candidates.map((cand) => (
                    <div
                      key={cand._id}
                      style={{
                        padding: "10px 12px",
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Briefcase size={16} style={{ color: "#2563eb" }} />
                        <div>
                          <span style={{ fontWeight: "600", fontSize: "13.5px" }}>{cand.name}</span>
                          <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "8px" }}>
                            {cand.position} · {cand.email}
                          </span>
                        </div>
                      </div>
                      <StatusBadge label={cand.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Employees */}
          {(activeCategory === "all" || activeCategory === "employees") &&
            results.employees?.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "8px" }}>
                  Employees & Interns ({results.employees.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {results.employees.map((emp) => (
                    <div
                      key={emp._id}
                      style={{
                        padding: "10px 12px",
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <User size={16} style={{ color: "#10b981" }} />
                        <div>
                          <span style={{ fontWeight: "600", fontSize: "13.5px" }}>
                            {emp.userId?.name || emp.empId}
                          </span>
                          <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "8px" }}>
                            {emp.designation} · {emp.department} · {emp.type}
                          </span>
                        </div>
                      </div>
                      <StatusBadge label={emp.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Offers */}
          {(activeCategory === "all" || activeCategory === "offers") &&
            results.offers?.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "8px" }}>
                  Offers ({results.offers.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {results.offers.map((off) => (
                    <div
                      key={off._id}
                      style={{
                        padding: "10px 12px",
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <FileCheck size={16} style={{ color: "#f59e0b" }} />
                        <div>
                          <span style={{ fontWeight: "600", fontSize: "13.5px" }}>
                            {off.candidateId?.name || "Candidate Offer"}
                          </span>
                          <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "8px" }}>
                            {off.designation} · {off.offerType} · CTC: ₹{off.salary?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <StatusBadge label={off.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Users */}
          {(activeCategory === "all" || activeCategory === "users") &&
            results.users?.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "8px" }}>
                  Users ({results.users.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {results.users.map((u) => (
                    <div
                      key={u._id}
                      style={{
                        padding: "10px 12px",
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <UsersIcon size={16} style={{ color: "#6366f1" }} />
                        <div>
                          <span style={{ fontWeight: "600", fontSize: "13.5px" }}>{u.name}</span>
                          <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "8px" }}>
                            {u.email}
                          </span>
                        </div>
                        <RoleBadge role={u.role} />
                      </div>
                      <StatusBadge active={u.isActive} />
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
