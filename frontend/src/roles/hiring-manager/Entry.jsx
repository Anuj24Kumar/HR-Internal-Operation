import { useState, useEffect } from "react";
import { 
  Building2, 
  LayoutGrid, 
  Users, 
  CalendarDays, 
  BriefcaseBusiness, 
  CheckSquare, 
  Search, 
  Bell, 
  LogOut, 
  ChevronRight, 
  ChevronDown, 
  Star, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  UserCheck, 
  ThumbsUp, 
  ThumbsDown, 
  FileText, 
  AlertCircle, 
  HelpCircle, 
  Filter,
  RefreshCw,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import useRoleAuth from "../useRoleAuth.js";
import { apiRequest } from "../../api.js";

export default function HiringManagerEntry() {
  const { user, logout, isAuthenticated } = useRoleAuth("hiring_manager");

  // Navigation tabs
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'candidates' | 'approvals' | 'roles'
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    openRoles: 0,
    pipelineCandidates: 0,
    interviewsThisWeek: 0,
    offersToApprove: 0,
  });

  // Data states
  const [rolesList, setRolesList] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Selected candidate for Evaluation Modal
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateDetail, setCandidateDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [recommendDecision, setRecommendDecision] = useState("select");
  const [recommendComments, setRecommendComments] = useState("");
  const [submittingRecommend, setSubmittingRecommend] = useState(false);

  // Selected approval for Decision Modal
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [approvalComment, setApprovalComment] = useState("");
  const [submittingApproval, setSubmittingApproval] = useState(false);

  // Notifications dropdown
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  async function loadAllData() {
    setLoading(true);
    setActionError(null);
    try {
      // 1. Fetch dashboard stats
      const dashRes = await apiRequest("/dashboard/hiring-manager");
      if (dashRes.data) {
        setMetrics(dashRes.data);
      }

      // 2. Fetch roles
      const rolesRes = await apiRequest("/dashboard/hiring-manager/roles");
      if (rolesRes.data) {
        setRolesList(rolesRes.data);
      }

      // 3. Fetch candidates
      const candRes = await apiRequest("/hiring-manager/candidates?limit=50");
      if (candRes.data) {
        setCandidates(candRes.data);
      }

      // 4. Fetch pending approvals
      const appRes = await apiRequest("/hiring-manager/approvals");
      if (appRes.data) {
        setApprovals(appRes.data);
      }
    } catch (err) {
      console.error("Failed to load HM data:", err);
      setActionError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadAllData();
  }

  // Open candidate details & evaluation drawer/modal
  async function openCandidateEvaluation(cand) {
    setSelectedCandidate(cand);
    setCandidateDetail(null);
    setLoadingDetail(true);
    setRecommendDecision("select");
    setRecommendComments("");
    try {
      const res = await apiRequest(`/hiring-manager/candidates/${cand._id}`);
      setCandidateDetail(res.data);
    } catch (err) {
      console.error("Failed to load candidate details:", err);
      setActionError("Failed to fetch full candidate details: " + err.message);
    } finally {
      setLoadingDetail(false);
    }
  }

  // Submit Hiring Recommendation (Select / Reject with comments)
  async function handleSubmitRecommendation(e) {
    e.preventDefault();
    if (!recommendComments.trim()) {
      alert("Please enter evaluation comments before submitting.");
      return;
    }
    setSubmittingRecommend(true);
    setActionError(null);
    try {
      await apiRequest(`/hiring-manager/candidates/${selectedCandidate._id}/recommend`, {
        method: "POST",
        body: JSON.stringify({
          decision: recommendDecision,
          comments: recommendComments.trim(),
        }),
      });

      setActionMessage(`Recommendation recorded successfully: ${recommendDecision.toUpperCase()}`);
      setTimeout(() => setActionMessage(null), 4000);

      // Refresh modal detail and global candidates
      const updatedRes = await apiRequest(`/hiring-manager/candidates/${selectedCandidate._id}`);
      setCandidateDetail(updatedRes.data);
      loadAllData();
    } catch (err) {
      console.error("Error submitting recommendation:", err);
      alert("Failed to submit recommendation: " + err.message);
    } finally {
      setSubmittingRecommend(false);
    }
  }

  // Handle Approval Decision (Approve / Reject)
  async function handleApprovalAction(decision) {
    if (decision === "reject" && !approvalComment.trim()) {
      alert("A comment explaining the rejection reason is required.");
      return;
    }
    setSubmittingApproval(true);
    setActionError(null);
    try {
      const endpoint = decision === "approve"
        ? `/hiring-manager/approvals/${selectedApproval._id}/approve`
        : `/hiring-manager/approvals/${selectedApproval._id}/reject`;

      await apiRequest(endpoint, {
        method: "PATCH",
        body: JSON.stringify({
          comment: approvalComment.trim(),
        }),
      });

      setActionMessage(`Request #${selectedApproval._id.slice(-6)} has been ${decision === "approve" ? "Approved" : "Rejected"}.`);
      setTimeout(() => setActionMessage(null), 4000);

      setSelectedApproval(null);
      setApprovalComment("");
      loadAllData();
    } catch (err) {
      console.error("Approval action failed:", err);
      alert("Action failed: " + err.message);
    } finally {
      setSubmittingApproval(false);
    }
  }

  // Filter candidates by status and search
  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch = 
      (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.position || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.department || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === "all" || 
      (c.status || "").toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="shell">
      {/* SIDEBAR NAVIGATION MATCHING LOVABLE PEOPL-EOPS */}
      <aside className="sidebar" aria-label="Hiring Manager Navigation">
        {/* Brand */}
        <a className="brand" href="#overview" onClick={(e) => { e.preventDefault(); setActiveTab("overview"); }}>
          <svg className="brand-mark" viewBox="0 0 32 36" fill="none" aria-hidden="true">
            <path d="M3 3h13c9 0 14 5 14 12s-5 12-14 12h-5v7H3V3Z" fill="currentColor" />
            <path d="M11 11h5c3 0 5 1 5 4s-2 4-5 4h-5v-8Z" fill="#111827" />
            <path d="M3 27h8v7H3z" fill="#818cf8" />
          </svg>
          <span>PeopleOps</span>
        </a>

        {/* Enterprise Workspace Badge */}
        <div className="workspace">
          <span className="workspace-avatar">
            <Building2 size={18} />
          </span>
          <div className="workspace-info">
            <p className="workspace-title">Acme Corporation</p>
            <p className="workspace-subtitle">Enterprise workspace</p>
          </div>
          <ChevronDown size={14} style={{ color: "var(--sidebar-muted)", marginLeft: "auto" }} />
        </div>

        {/* Section Heading */}
        <p className="nav-heading">WORKSPACE</p>
        <nav className="nav-group">
          <button
            type="button"
            className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <span className="nav-link-content">
              <LayoutGrid size={18} />
              <span>Overview</span>
            </span>
          </button>

          <button
            type="button"
            className={`nav-link ${activeTab === "candidates" ? "active" : ""}`}
            onClick={() => setActiveTab("candidates")}
          >
            <span className="nav-link-content">
              <Users size={18} />
              <span>Assigned Candidates</span>
            </span>
            <span className="nav-badge">{candidates.length}</span>
          </button>

          <button
            type="button"
            className={`nav-link ${activeTab === "approvals" ? "active" : ""}`}
            onClick={() => setActiveTab("approvals")}
          >
            <span className="nav-link-content">
              <CheckSquare size={18} />
              <span>Offer Approvals</span>
            </span>
            {approvals.length > 0 && (
              <span className="nav-badge alert">{approvals.length}</span>
            )}
          </button>

          <button
            type="button"
            className={`nav-link ${activeTab === "roles" ? "active" : ""}`}
            onClick={() => setActiveTab("roles")}
          >
            <span className="nav-link-content">
              <BriefcaseBusiness size={18} />
              <span>Department Roles</span>
            </span>
            <span className="nav-badge">{rolesList.length}</span>
          </button>
        </nav>

        <p className="nav-heading">ORGANIZATION</p>
        <nav className="nav-group">
          <a className="nav-link" href="#help" onClick={(e) => { e.preventDefault(); alert("PeopleOps Enterprise Support: support@acme-peopleops.com"); }}>
            <span className="nav-link-content">
              <HelpCircle size={18} />
              <span>Help & support</span>
            </span>
          </a>
        </nav>

        {/* User Card at Bottom */}
        <div className="sidebar-bottom">
          <div className="user-snippet">
            <div className="user-avatar-circle">
              {(user?.name || "HM").slice(0, 2).toUpperCase()}
            </div>
            <div className="user-info-text">
              <p className="user-name-text">{user?.name || "Hiring Manager"}</p>
              <p className="user-role-text">Hiring Manager</p>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Log out"
              style={{ color: "var(--sidebar-muted)", padding: "4px" }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN SHELL */}
      <div className="main-shell">
        {/* TOPBAR */}
        <header className="topbar">
          <div className="search">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="search-input"
              placeholder="Search candidate, role, skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="search-key">⌘ K</span>
          </div>

          <div className="top-actions">
            <span className="role-tag-badge emerald">
              <UserCheck size={14} />
              <span>Hiring Manager</span>
            </span>

            <div style={{ position: "relative" }}>
              <button
                type="button"
                className="top-icon-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
              >
                <Bell size={18} />
                {approvals.length > 0 && <span className="notification-dot"></span>}
              </button>

              {showNotifications && (
                <div style={{
                  position: "absolute",
                  right: 0,
                  top: "42px",
                  width: "280px",
                  background: "#ffffff",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-lg)",
                  padding: "12px",
                  zIndex: 50
                }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>Notifications</p>
                  {approvals.length > 0 ? (
                    <div style={{ fontSize: "12px", color: "var(--foreground)" }}>
                      You have <strong>{approvals.length} pending offer approval(s)</strong> awaiting your sign-off.
                    </div>
                  ) : (
                    <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                      No new pending alerts. Everything is up to date!
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="topbar-divider"></div>

            <button type="button" className="btn-logout" onClick={logout}>
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* WORKSPACE CONTENT AREA */}
        <main className="content-area">
          {/* Action Success / Error Notifications */}
          {actionMessage && (
            <div className="auth-success" role="status">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{actionMessage}</span>
            </div>
          )}

          {actionError && (
            <div className="auth-error" role="alert">
              <AlertCircle size={18} className="shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* PAGE HEADER */}
          <section className="page-header">
            <div>
              <h1 className="page-title">Hiring manager dashboard</h1>
              <p className="page-subtitle">
                Welcome back, {user?.name || "Manager"}. Review your department's pipeline, feedback, and approvals.
              </p>
            </div>
            <button
              type="button"
              className="btn-action-outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={14} className={refreshing ? "spin" : ""} />
              <span>{refreshing ? "Refreshing..." : "Sync Data"}</span>
            </button>
          </section>

          {/* METRIC STATS CARDS */}
          <section className="metrics-grid">
            <div className="metric-card">
              <div className="metric-top">
                <span className="metric-label">Open Roles</span>
                <span className="metric-icon-wrap indigo">
                  <BriefcaseBusiness size={18} />
                </span>
              </div>
              <p className="metric-value">{metrics.openRoles}</p>
              <p className="metric-trend">
                <span>In your department</span>
              </p>
            </div>

            <div className="metric-card">
              <div className="metric-top">
                <span className="metric-label">Pipeline Candidates</span>
                <span className="metric-icon-wrap emerald">
                  <Users size={18} />
                </span>
              </div>
              <p className="metric-value">{metrics.pipelineCandidates}</p>
              <p className="metric-trend">
                <span>Assigned to your team</span>
              </p>
            </div>

            <div className="metric-card">
              <div className="metric-top">
                <span className="metric-label">Interviews This Week</span>
                <span className="metric-icon-wrap purple">
                  <CalendarDays size={18} />
                </span>
              </div>
              <p className="metric-value">{metrics.interviewsThisWeek}</p>
              <p className="metric-trend">
                <span>Scheduled rounds</span>
              </p>
            </div>

            <div className="metric-card">
              <div className="metric-top">
                <span className="metric-label">Offers to Approve</span>
                <span className="metric-icon-wrap amber">
                  <CheckSquare size={18} />
                </span>
              </div>
              <p className="metric-value">{metrics.offersToApprove}</p>
              <p className="metric-trend" style={{ color: metrics.offersToApprove > 0 ? "#d97706" : "inherit" }}>
                <span>{metrics.offersToApprove > 0 ? "Action required" : "All cleared"}</span>
              </p>
            </div>
          </section>

          {/* TAB HEADER */}
          <div className="tabs-nav">
            <button
              type="button"
              className={`tab-btn ${activeTab === "overview" || activeTab === "candidates" ? "active" : ""}`}
              onClick={() => setActiveTab("candidates")}
            >
              <Users size={16} />
              <span>Candidate Pipeline</span>
              <span className="tab-count-badge">{filteredCandidates.length}</span>
            </button>

            <button
              type="button"
              className={`tab-btn ${activeTab === "approvals" ? "active" : ""}`}
              onClick={() => setActiveTab("approvals")}
            >
              <CheckSquare size={16} />
              <span>Pending Approvals</span>
              {approvals.length > 0 && (
                <span className="tab-count-badge" style={{ background: "#fee2e2", color: "#991b1b" }}>
                  {approvals.length}
                </span>
              )}
            </button>

            <button
              type="button"
              className={`tab-btn ${activeTab === "roles" ? "active" : ""}`}
              onClick={() => setActiveTab("roles")}
            >
              <BriefcaseBusiness size={16} />
              <span>Department Roles</span>
              <span className="tab-count-badge">{rolesList.length}</span>
            </button>
          </div>

          {/* TAB CONTENT: CANDIDATES */}
          {(activeTab === "overview" || activeTab === "candidates") && (
            <div className="card-box">
              <div className="card-box-header">
                <div>
                  <h2 className="card-box-title">Assigned Candidates</h2>
                  <p className="card-box-subtitle">Review interview feedback and submit hiring recommendations</p>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <Filter size={14} style={{ color: "var(--muted-foreground)" }} />
                  <select
                    className="form-select"
                    style={{ width: "160px", padding: "6px 10px", fontSize: "12px" }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Stages</option>
                    <option value="applied">Applied</option>
                    <option value="screening">Screening</option>
                    <option value="interview">Interview</option>
                    <option value="selected">Selected</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="empty-state">
                  <p>Loading candidates data...</p>
                </div>
              ) : filteredCandidates.length === 0 ? (
                <div className="empty-state">
                  <Users className="empty-icon" />
                  <p className="empty-title">No candidates found</p>
                  <p className="empty-desc">
                    {searchQuery || statusFilter !== "all"
                      ? "Try adjusting your search criteria or stage filters."
                      : "There are currently no candidates assigned to your department."}
                  </p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Position & Team</th>
                        <th>Stage</th>
                        <th>Interview Rounds</th>
                        <th>Recommendation</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCandidates.map((cand) => {
                        const interviewCount = cand.interviews?.length || 0;
                        const completedInterviews = cand.interviews?.filter(i => i.rating != null).length || 0;
                        const recStatus = cand.hiringRecommendation?.status;

                        return (
                          <tr key={cand._id}>
                            <td>
                              <div>
                                <strong style={{ fontWeight: 600 }}>{cand.name}</strong>
                                <p style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>{cand.email}</p>
                              </div>
                            </td>
                            <td>
                              <div>
                                <span style={{ fontWeight: 500 }}>{cand.position}</span>
                                <p style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                                  {cand.department || "Engineering"} • {cand.source || "Direct"}
                                </p>
                              </div>
                            </td>
                            <td>
                              <span className={`status-pill ${(cand.status || "").toLowerCase()}`}>
                                {cand.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "12px", fontWeight: 500 }}>
                                  {completedInterviews}/{interviewCount} rounds evaluated
                                </span>
                              </div>
                            </td>
                            <td>
                              {recStatus ? (
                                <span className={`status-pill ${recStatus === "select" ? "selected" : "rejected"}`}>
                                  {recStatus === "select" ? "Selected by HM" : "Rejected by HM"}
                                </span>
                              ) : (
                                <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                                  Awaiting review
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                type="button"
                                className="btn-action-primary"
                                onClick={() => openCandidateEvaluation(cand)}
                              >
                                <span>Evaluate Candidate</span>
                                <ChevronRight size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: PENDING APPROVALS */}
          {activeTab === "approvals" && (
            <div className="card-box">
              <div className="card-box-header">
                <div>
                  <h2 className="card-box-title">Pending Offer & Letter Approvals</h2>
                  <p className="card-box-subtitle">Approve or reject hiring requests where you are the designated approver</p>
                </div>
              </div>

              {approvals.length === 0 ? (
                <div className="empty-state">
                  <CheckSquare className="empty-icon" />
                  <p className="empty-title">All approvals completed</p>
                  <p className="empty-desc">You do not have any pending offer or letter approval requests waiting at this time.</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Request Type</th>
                        <th>Reference ID</th>
                        <th>Step Order</th>
                        <th>Status</th>
                        <th>Submitted At</th>
                        <th style={{ textAlign: "right" }}>Decision</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvals.map((req) => (
                        <tr key={req._id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <FileText size={16} style={{ color: "#4f46e5" }} />
                              <strong style={{ textTransform: "capitalize" }}>
                                {req.entityType || req.requestType || "Offer"} Approval
                              </strong>
                            </div>
                          </td>
                          <td style={{ fontFamily: "monospace", fontSize: "12px" }}>
                            #{req._id.slice(-6)}
                          </td>
                          <td>
                            Step {req.currentStep} of {req.steps?.length || 1}
                          </td>
                          <td>
                            <span className="status-pill pending">Pending Your Review</span>
                          </td>
                          <td style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                            {new Date(req.createdAt || req.submittedAt).toLocaleDateString()}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="btn-action-primary"
                              onClick={() => setSelectedApproval(req)}
                            >
                              <span>Take Action</span>
                              <ChevronRight size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: DEPARTMENT ROLES */}
          {activeTab === "roles" && (
            <div className="card-box">
              <div className="card-box-header">
                <div>
                  <h2 className="card-box-title">Open Roles & Demand</h2>
                  <p className="card-box-subtitle">Active hiring requisitions mapped to your department</p>
                </div>
              </div>

              {rolesList.length === 0 ? (
                <div className="empty-state">
                  <BriefcaseBusiness className="empty-icon" />
                  <p className="empty-title">No department roles registered</p>
                  <p className="empty-desc">No active roles are currently assigned to your team.</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Position Title</th>
                        <th>Department</th>
                        <th>Active Applicants</th>
                        <th>Open Pipeline</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rolesList.map((r, i) => (
                        <tr key={i}>
                          <td>
                            <strong style={{ fontWeight: 600 }}>{r.role || "Role"}</strong>
                          </td>
                          <td>{r.department || "Engineering"}</td>
                          <td>{r.candidateCount} total</td>
                          <td>
                            <strong style={{ color: "#4f46e5" }}>{r.openCandidateCount} in progress</strong>
                          </td>
                          <td>
                            <span className="status-pill selected">Actively Hiring</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>

        {/* FOOTER MATCHING LOVABLE */}
        <footer className="shell-footer">
          <span>People first. Everything else follows.</span>
          <div className="system-status">
            <span className="system-status-dot"></span>
            <span>All systems operational</span>
          </div>
        </footer>
      </div>

      {/* ============================================================
          CANDIDATE EVALUATION MODAL / DRAWER
          ============================================================ */}
      {selectedCandidate && (
        <div className="modal-overlay" onClick={() => setSelectedCandidate(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h3 className="modal-title">Candidate Evaluation & Feedback</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedCandidate(null)}
              >
                ✕
              </button>
            </header>

            <div className="modal-body">
              {loadingDetail ? (
                <div className="empty-state">
                  <p>Loading candidate details & interview assessments...</p>
                </div>
              ) : candidateDetail ? (
                <>
                  {/* Candidate Profile Summary */}
                  <div className="candidate-detail-header">
                    <div className="candidate-avatar">
                      {candidateDetail.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ fontSize: "18px", fontWeight: 700 }}>{candidateDetail.name}</h4>
                      <p style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
                        {candidateDetail.position} • {candidateDetail.department || "Engineering"}
                      </p>
                    </div>
                    <div style={{ marginLeft: "auto" }}>
                      <span className={`status-pill ${(candidateDetail.status || "").toLowerCase()}`}>
                        {candidateDetail.status}
                      </span>
                    </div>
                  </div>

                  {/* Metadata info */}
                  <div className="detail-info-grid">
                    <div className="detail-info-item">
                      <span className="detail-info-label">Email Address</span>
                      <span className="detail-info-val">{candidateDetail.email}</span>
                    </div>
                    <div className="detail-info-item">
                      <span className="detail-info-label">Phone</span>
                      <span className="detail-info-val">{candidateDetail.phone || "Not provided"}</span>
                    </div>
                    <div className="detail-info-item">
                      <span className="detail-info-label">Application Source</span>
                      <span className="detail-info-val">{candidateDetail.source || "Direct"}</span>
                    </div>
                    <div className="detail-info-item">
                      <span className="detail-info-label">Applied Date</span>
                      <span className="detail-info-val">
                        {new Date(candidateDetail.appliedDate || candidateDetail.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Interview Rounds & Feedbacks */}
                  <div>
                    <h5 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <CalendarDays size={16} />
                      <span>Interview Rounds & Interviewer Ratings</span>
                    </h5>

                    {(!candidateDetail.interviews || candidateDetail.interviews.length === 0) ? (
                      <div className="empty-state" style={{ padding: "16px", background: "var(--secondary)", borderRadius: "var(--radius-md)" }}>
                        <p style={{ fontSize: "13px" }}>No interview rounds scheduled yet for this candidate.</p>
                      </div>
                    ) : (
                      <div className="rounds-timeline">
                        {candidateDetail.interviews.map((round, idx) => (
                          <div key={idx} className="round-card">
                            <div className="round-card-top">
                              <span style={{ fontWeight: 600, fontSize: "13px" }}>
                                Round {round.round}: {round.status || "Scheduled"}
                              </span>
                              {round.rating ? (
                                <div className="stars-row">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      size={14}
                                      className={`star-icon ${star <= round.rating ? "filled" : ""}`}
                                    />
                                  ))}
                                  <span style={{ fontSize: "12px", fontWeight: 700, marginLeft: "4px" }}>
                                    {round.rating}/5
                                  </span>
                                </div>
                              ) : (
                                <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                                  No rating submitted yet
                                </span>
                              )}
                            </div>

                            <p style={{ fontSize: "12px", color: "var(--muted-foreground)", marginBottom: "6px" }}>
                              Interviewer: {round.interviewerId?.name || "Assigned Panelist"} ({round.interviewerId?.email || "Panel"})
                              • Date: {new Date(round.scheduledAt).toLocaleDateString()}
                            </p>

                            {round.feedback ? (
                              <div style={{
                                padding: "8px 12px",
                                background: "var(--secondary)",
                                borderRadius: "var(--radius-sm)",
                                fontSize: "12px",
                                color: "var(--foreground)",
                                fontStyle: "italic",
                                marginTop: "6px"
                              }}>
                                "{round.feedback}"
                              </div>
                            ) : (
                              <p style={{ fontSize: "11px", color: "var(--muted-foreground)", fontStyle: "italic" }}>
                                Feedback pending from interviewer.
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Past Recommendations if any */}
                  {candidateDetail.recommendations && candidateDetail.recommendations.length > 0 && (
                    <div>
                      <h5 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>
                        Previous Recommendations
                      </h5>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {candidateDetail.recommendations.map((rec, i) => (
                          <div key={i} style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                              <strong style={{ textTransform: "uppercase", color: rec.decision === "select" ? "#059669" : "#dc2626" }}>
                                {rec.decision}
                              </strong>
                              <span style={{ color: "var(--muted-foreground)" }}>
                                {new Date(rec.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p>{rec.comments}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendation Submission Form */}
                  <form onSubmit={handleSubmitRecommendation} style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
                    <h5 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px" }}>
                      Submit Hiring Manager Recommendation
                    </h5>

                    <div className="form-group" style={{ marginBottom: "12px" }}>
                      <label className="form-label">Decision</label>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <label style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px",
                          border: `1.5px solid ${recommendDecision === "select" ? "#10b981" : "var(--border)"}`,
                          borderRadius: "var(--radius-md)",
                          cursor: "pointer",
                          background: recommendDecision === "select" ? "#ecfdf5" : "#ffffff",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: recommendDecision === "select" ? "#065f46" : "var(--foreground)"
                        }}>
                          <input
                            type="radio"
                            name="decision"
                            value="select"
                            checked={recommendDecision === "select"}
                            onChange={() => setRecommendDecision("select")}
                          />
                          <ThumbsUp size={16} style={{ color: "#10b981" }} />
                          <span>Recommend Selection</span>
                        </label>

                        <label style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px",
                          border: `1.5px solid ${recommendDecision === "reject" ? "#ef4444" : "var(--border)"}`,
                          borderRadius: "var(--radius-md)",
                          cursor: "pointer",
                          background: recommendDecision === "reject" ? "#fef2f2" : "#ffffff",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: recommendDecision === "reject" ? "#991b1b" : "var(--foreground)"
                        }}>
                          <input
                            type="radio"
                            name="decision"
                            value="reject"
                            checked={recommendDecision === "reject"}
                            onChange={() => setRecommendDecision("reject")}
                          />
                          <ThumbsDown size={16} style={{ color: "#ef4444" }} />
                          <span>Recommend Rejection</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: "16px" }}>
                      <label className="form-label" htmlFor="eval-comments">
                        <span>Evaluation Notes & Justification</span>
                        <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>Required</span>
                      </label>
                      <textarea
                        id="eval-comments"
                        rows={3}
                        required
                        className="form-textarea"
                        placeholder="Provide detailed feedback on technical fit, seniority, and recommendation rationale..."
                        value={recommendComments}
                        onChange={(e) => setRecommendComments(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      className="auth-btn-primary"
                      disabled={submittingRecommend}
                    >
                      {submittingRecommend ? (
                        <span>Submitting Evaluation...</span>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Submit Hiring Decision</span>
                        </>
                      )}
                    </button>
                  </form>
                </>
              ) : null}
            </div>

            <footer className="modal-footer">
              <button
                type="button"
                className="btn-action-outline"
                onClick={() => setSelectedCandidate(null)}
              >
                Close
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ============================================================
          APPROVAL ACTION MODAL
          ============================================================ */}
      {selectedApproval && (
        <div className="modal-overlay" onClick={() => setSelectedApproval(null)}>
          <div className="modal-dialog" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h3 className="modal-title">Approve Offer / Letter Request</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedApproval(null)}
              >
                ✕
              </button>
            </header>

            <div className="modal-body">
              <div style={{ background: "var(--secondary)", padding: "14px", borderRadius: "var(--radius-md)" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground)" }}>
                  Request #{selectedApproval._id.slice(-6)}
                </p>
                <p style={{ fontSize: "12px", color: "var(--muted-foreground)", marginTop: "2px" }}>
                  Entity: {selectedApproval.entityType || "Offer"} • Current Step: {selectedApproval.currentStep}
                </p>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="approval-comment">
                  <span>Comments</span>
                  <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                    Mandatory for rejection
                  </span>
                </label>
                <textarea
                  id="approval-comment"
                  rows={3}
                  className="form-textarea"
                  placeholder="Enter comments or reason for your decision..."
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#10b981",
                    color: "#ffffff",
                    borderRadius: "var(--radius-md)",
                    fontWeight: 600,
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                  disabled={submittingApproval}
                  onClick={() => handleApprovalAction("approve")}
                >
                  <CheckCircle2 size={16} />
                  <span>Approve Request</span>
                </button>

                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#ef4444",
                    color: "#ffffff",
                    borderRadius: "var(--radius-md)",
                    fontWeight: 600,
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                  disabled={submittingApproval}
                  onClick={() => handleApprovalAction("reject")}
                >
                  <XCircle size={16} />
                  <span>Reject Request</span>
                </button>
              </div>
            </div>

            <footer className="modal-footer">
              <button
                type="button"
                className="btn-action-outline"
                onClick={() => setSelectedApproval(null)}
              >
                Cancel
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
