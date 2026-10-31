import { useState, useEffect } from "react";
import { 
  Building2, 
  LayoutGrid, 
  Users, 
  GitMerge, 
  FileText, 
  ShieldCheck, 
  Search, 
  Bell, 
  LogOut, 
  ChevronRight, 
  ChevronDown, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  UserCheck, 
  Plus, 
  Edit3, 
  Trash2, 
  Power, 
  Download, 
  AlertCircle, 
  HelpCircle, 
  Filter, 
  RefreshCw, 
  Activity, 
  Database, 
  Cpu, 
  KeyRound,
  Check,
  BriefcaseBusiness
} from "lucide-react";
import useRoleAuth from "../useRoleAuth.js";
import { apiRequest } from "../../api.js";

export default function AdminEntry() {
  const { user, logout, isAuthenticated } = useRoleAuth("admin");

  // Navigation tab: 'overview' | 'users' | 'workflows' | 'templates' | 'audit' | 'search'
  const [activeTab, setActiveTab] = useState("overview");

  // Global search input & notifications
  const [globalSearchInput, setGlobalSearchInput] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  // Status feedback
  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Dashboard Metrics State
  const [dashboardStats, setDashboardStats] = useState({
    activeUsers: 0,
    totalHeadcount: 0,
    totalEmployees: 0,
    totalInterns: 0,
    openCandidates: 0,
    offersInFlight: 0,
    pendingApprovals: 0,
    systemHealth: {
      databaseStatus: "Connected",
      uptime: "0h 0m",
      memoryUsedMB: 0,
      serverTimestamp: new Date(),
    },
  });
  const [pipelineStats, setPipelineStats] = useState({
    applied: 0,
    screening: 0,
    interview: 0,
    selected: 0,
    rejected: 0,
    total: 0,
  });

  // 2. Users Management State
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "candidate",
  });
  const [submittingUser, setSubmittingUser] = useState(false);

  // 3. Workflows Configuration State
  const [workflowsList, setWorkflowsList] = useState([]);
  const [showCreateWorkflowModal, setShowCreateWorkflowModal] = useState(false);
  const [workflowFormData, setWorkflowFormData] = useState({
    name: "",
    type: "offer",
    description: "",
    steps: [
      { order: 1, role: "hiring_manager", stepName: "Hiring Manager Review", isRequired: true },
      { order: 2, role: "hr", stepName: "HR Verification", isRequired: true },
      { order: 3, role: "admin", stepName: "Executive Sign-Off", isRequired: true },
    ],
  });
  const [submittingWorkflow, setSubmittingWorkflow] = useState(false);

  // 4. Letter Templates State
  const [templatesList, setTemplatesList] = useState([]);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [templateFormData, setTemplateFormData] = useState({
    name: "",
    type: "appointment",
    htmlContent: "<h1>Letter</h1><p>Dear {{employeeName}},</p><p>Welcome to Acme Corporation as {{designation}}.</p>",
  });
  const [submittingTemplate, setSubmittingTemplate] = useState(false);

  // 5. Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditModuleFilter, setAuditModuleFilter] = useState("all");

  // 6. Global Search Results State
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]);

  async function loadInitialData() {
    setLoading(true);
    setActionError(null);
    try {
      await Promise.all([
        fetchDashboardData(),
        fetchUsers(),
        fetchWorkflows(),
        fetchLetterTemplates(),
        fetchAuditLogs(),
      ]);
    } catch (err) {
      console.error("Failed to load initial admin data:", err);
      setActionError("Failed to load admin data: " + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadInitialData();
  }

  function triggerMessage(msg) {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  }

  // API Callers
  async function fetchDashboardData() {
    try {
      const [dashRes, pipeRes] = await Promise.all([
        apiRequest("/admin/dashboard"),
        apiRequest("/admin/dashboard/pipeline"),
      ]);
      if (dashRes.stats) setDashboardStats(dashRes.stats);
      if (pipeRes.pipeline) setPipelineStats(pipeRes.pipeline);
    } catch (e) {
      console.warn("Dashboard metrics load notice:", e.message);
    }
  }

  async function fetchUsers() {
    try {
      const res = await apiRequest("/admin/users?limit=100");
      if (res.users) setUsersList(res.users);
    } catch (e) {
      console.warn("Users load notice:", e.message);
    }
  }

  async function fetchWorkflows() {
    try {
      const res = await apiRequest("/admin/workflows");
      if (res.workflows) setWorkflowsList(res.workflows);
    } catch (e) {
      console.warn("Workflows load notice:", e.message);
    }
  }

  async function fetchLetterTemplates() {
    try {
      const res = await apiRequest("/admin/letter-templates");
      if (res.templates) setTemplatesList(res.templates);
    } catch (e) {
      console.warn("Templates load notice:", e.message);
    }
  }

  async function fetchAuditLogs() {
    try {
      const res = await apiRequest("/admin/audit?limit=50");
      if (res.logs) setAuditLogs(res.logs);
    } catch (e) {
      console.warn("Audit logs notice:", e.message);
    }
  }

  // User Actions
  async function handleCreateUser(e) {
    e.preventDefault();
    setSubmittingUser(true);
    setActionError(null);
    try {
      await apiRequest("/admin/users", {
        method: "POST",
        body: JSON.stringify(userFormData),
      });
      triggerMessage(`User "${userFormData.name}" created successfully`);
      setShowCreateUserModal(false);
      setUserFormData({ name: "", email: "", password: "", role: "candidate" });
      fetchUsers();
      fetchDashboardData();
      fetchAuditLogs();
    } catch (err) {
      alert("Failed to create user: " + err.message);
    } finally {
      setSubmittingUser(false);
    }
  }

  async function handleUpdateUser(e) {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmittingUser(true);
    setActionError(null);
    try {
      const payload = {
        name: userFormData.name.trim(),
        role: userFormData.role,
      };
      if (userFormData.password) {
        payload.password = userFormData.password;
      }
      await apiRequest(`/admin/users/${selectedUser._id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      triggerMessage(`User "${userFormData.name}" updated successfully`);
      setShowEditUserModal(false);
      setSelectedUser(null);
      fetchUsers();
      fetchAuditLogs();
    } catch (err) {
      alert("Failed to update user: " + err.message);
    } finally {
      setSubmittingUser(false);
    }
  }

  async function handleToggleUserStatus(u) {
    try {
      const endpoint = u.isActive 
        ? `/admin/users/${u._id}/deactivate` 
        : `/admin/users/${u._id}/activate`;
      await apiRequest(endpoint, { method: "PATCH" });
      triggerMessage(`User "${u.name}" ${u.isActive ? "deactivated" : "activated"} successfully`);
      fetchUsers();
      fetchDashboardData();
      fetchAuditLogs();
    } catch (err) {
      alert("Failed to toggle user status: " + err.message);
    }
  }

  async function handleDeleteUser(u) {
    if (!window.confirm(`Are you sure you want to permanently delete user "${u.name}" (${u.email})?`)) {
      return;
    }
    try {
      await apiRequest(`/admin/users/${u._id}`, { method: "DELETE" });
      triggerMessage(`User "${u.name}" permanently deleted`);
      fetchUsers();
      fetchDashboardData();
      fetchAuditLogs();
    } catch (err) {
      alert("Failed to delete user: " + err.message);
    }
  }

  function openEditUser(u) {
    setSelectedUser(u);
    setUserFormData({
      name: u.name || "",
      email: u.email || "",
      password: "",
      role: u.role || "candidate",
    });
    setShowEditUserModal(true);
  }

  // Workflow Actions
  async function handleCreateWorkflow(e) {
    e.preventDefault();
    setSubmittingWorkflow(true);
    setActionError(null);
    try {
      await apiRequest("/admin/workflows", {
        method: "POST",
        body: JSON.stringify(workflowFormData),
      });
      triggerMessage(`Approval workflow for '${workflowFormData.type}' configured successfully`);
      setShowCreateWorkflowModal(false);
      fetchWorkflows();
      fetchAuditLogs();
    } catch (err) {
      alert("Failed to create workflow: " + err.message);
    } finally {
      setSubmittingWorkflow(false);
    }
  }

  async function handleDeleteWorkflow(wf) {
    if (!window.confirm(`Delete workflow "${wf.name}" (${wf.type})?`)) return;
    try {
      await apiRequest(`/admin/workflows/${wf._id}`, { method: "DELETE" });
      triggerMessage(`Workflow "${wf.name}" deleted successfully`);
      fetchWorkflows();
      fetchAuditLogs();
    } catch (err) {
      alert("Failed to delete workflow: " + err.message);
    }
  }

  // Letter Template Actions
  async function handleCreateTemplate(e) {
    e.preventDefault();
    setSubmittingTemplate(true);
    setActionError(null);
    try {
      await apiRequest("/admin/letter-templates", {
        method: "POST",
        body: JSON.stringify(templateFormData),
      });
      triggerMessage(`Letter template "${templateFormData.name}" created successfully`);
      setShowCreateTemplateModal(false);
      setTemplateFormData({
        name: "",
        type: "appointment",
        htmlContent: "<h1>Letter</h1><p>Dear {{employeeName}},</p><p>Welcome to Acme Corporation as {{designation}}.</p>",
      });
      fetchLetterTemplates();
      fetchAuditLogs();
    } catch (err) {
      alert("Failed to create template: " + err.message);
    } finally {
      setSubmittingTemplate(false);
    }
  }

  async function handleDeleteTemplate(tpl) {
    if (!window.confirm(`Delete letter template "${tpl.name}"?`)) return;
    try {
      await apiRequest(`/admin/letter-templates/${tpl._id}`, { method: "DELETE" });
      triggerMessage(`Template "${tpl.name}" deleted`);
      fetchLetterTemplates();
      fetchAuditLogs();
    } catch (err) {
      alert("Failed to delete template: " + err.message);
    }
  }

  // Global Search Handler
  async function handleGlobalSearch(e) {
    if (e) e.preventDefault();
    if (!globalSearchInput.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    setActiveTab("search");
    try {
      const res = await apiRequest(`/admin/search?q=${encodeURIComponent(globalSearchInput.trim())}`);
      setSearchResults(res);
    } catch (err) {
      alert("Global search failed: " + err.message);
    } finally {
      setSearching(false);
    }
  }

  // Filtered views
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch = 
      (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === "all" || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredAuditLogs = auditLogs.filter((log) => {
    return auditModuleFilter === "all" || log.module === auditModuleFilter;
  });

  return (
    <div className="shell">
      {/* ENTERPRISE SIDEBAR */}
      <aside className="sidebar" aria-label="Admin Navigation">
        <a className="brand" href="#overview" onClick={(e) => { e.preventDefault(); setActiveTab("overview"); }}>
          <svg className="brand-mark" viewBox="0 0 32 36" fill="none" aria-hidden="true">
            <path d="M3 3h13c9 0 14 5 14 12s-5 12-14 12h-5v7H3V3Z" fill="currentColor" />
            <path d="M11 11h5c3 0 5 1 5 4s-2 4-5 4h-5v-8Z" fill="#111827" />
            <path d="M3 27h8v7H3z" fill="#818cf8" />
          </svg>
          <span>PeopleOps</span>
        </a>

        {/* Workspace Brand Badge */}
        <div className="workspace">
          <span className="workspace-avatar" style={{ background: "#4338ca", color: "#ffffff" }}>
            <ShieldCheck size={18} />
          </span>
          <div className="workspace-info">
            <p className="workspace-title">Acme Corporation</p>
            <p className="workspace-subtitle">System Administration</p>
          </div>
          <ChevronDown size={14} style={{ color: "var(--sidebar-muted)", marginLeft: "auto" }} />
        </div>

        {/* NAVIGATION ITEMS */}
        <p className="nav-heading">ADMINISTRATION</p>
        <nav className="nav-group">
          <button
            type="button"
            className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <span className="nav-link-content">
              <LayoutGrid size={18} />
              <span>Overview & Health</span>
            </span>
          </button>

          <button
            type="button"
            className={`nav-link ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <span className="nav-link-content">
              <Users size={18} />
              <span>Users & Roles</span>
            </span>
            <span className="nav-badge">{usersList.length}</span>
          </button>

          <button
            type="button"
            className={`nav-link ${activeTab === "workflows" ? "active" : ""}`}
            onClick={() => setActiveTab("workflows")}
          >
            <span className="nav-link-content">
              <GitMerge size={18} />
              <span>Approval Chains</span>
            </span>
            <span className="nav-badge">{workflowsList.length}</span>
          </button>

          <button
            type="button"
            className={`nav-link ${activeTab === "templates" ? "active" : ""}`}
            onClick={() => setActiveTab("templates")}
          >
            <span className="nav-link-content">
              <FileText size={18} />
              <span>Letter Templates</span>
            </span>
            <span className="nav-badge">{templatesList.length}</span>
          </button>

          <button
            type="button"
            className={`nav-link ${activeTab === "audit" ? "active" : ""}`}
            onClick={() => setActiveTab("audit")}
          >
            <span className="nav-link-content">
              <ShieldCheck size={18} />
              <span>Audit Logs</span>
            </span>
            <span className="nav-badge">{auditLogs.length}</span>
          </button>

          <button
            type="button"
            className={`nav-link ${activeTab === "search" ? "active" : ""}`}
            onClick={() => setActiveTab("search")}
          >
            <span className="nav-link-content">
              <Search size={18} />
              <span>Global Search</span>
            </span>
          </button>
        </nav>

        <p className="nav-heading">DATABASE</p>
        <div style={{ padding: "8px 16px", fontSize: "11px", color: "var(--sidebar-muted)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
            <span style={{ color: "#e2e8f0", fontWeight: 600 }}>MongoDB Connected</span>
          </div>
          <div>Database: <code>hr_platform</code></div>
        </div>

        {/* User Card at Bottom */}
        <div className="sidebar-bottom">
          <div className="user-snippet">
            <div className="user-avatar-circle" style={{ background: "#4338ca", color: "#ffffff" }}>
              {(user?.name || "AD").slice(0, 2).toUpperCase()}
            </div>
            <div className="user-info-text">
              <p className="user-name-text">{user?.name || "System Admin"}</p>
              <p className="user-role-text">Administrator</p>
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
          <form className="search" onSubmit={handleGlobalSearch}>
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="search-input"
              placeholder="Global search across candidates, employees, offers, users..."
              value={globalSearchInput}
              onChange={(e) => setGlobalSearchInput(e.target.value)}
            />
            <button type="submit" style={{ display: "none" }}>Search</button>
            <span className="search-key" onClick={handleGlobalSearch} style={{ cursor: "pointer" }}>
              Enter
            </span>
          </form>

          <div className="top-actions">
            <span className="role-tag-badge" style={{ background: "#ede9fe", color: "#6d28d9" }}>
              <ShieldCheck size={14} />
              <span>Root Administrator</span>
            </span>

            <div style={{ position: "relative" }}>
              <button
                type="button"
                className="top-icon-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
              >
                <Bell size={18} />
                {dashboardStats.pendingApprovals > 0 && <span className="notification-dot"></span>}
              </button>

              {showNotifications && (
                <div style={{
                  position: "absolute",
                  right: 0,
                  top: "42px",
                  width: "290px",
                  background: "#ffffff",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-lg)",
                  padding: "12px",
                  zIndex: 50
                }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>System Notifications</p>
                  <div style={{ fontSize: "12px", color: "var(--foreground)", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div><strong>{dashboardStats.activeUsers}</strong> active users registered.</div>
                    <div><strong>{dashboardStats.pendingApprovals}</strong> pending approval requests in flight.</div>
                    <div><strong>{dashboardStats.openCandidates}</strong> open applicants in pipeline.</div>
                  </div>
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
              <h1 className="page-title">
                {activeTab === "overview" && "Platform Administration"}
                {activeTab === "users" && "User & Role Access Management"}
                {activeTab === "workflows" && "Approval Workflow Configurations"}
                {activeTab === "templates" && "Letter Templates Management"}
                {activeTab === "audit" && "System Audit & Compliance Logs"}
                {activeTab === "search" && "Global Organization Search"}
              </h1>
              <p className="page-subtitle">
                Real-time MongoDB platform metrics, account controls, policy workflows, and audit trails.
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              {activeTab === "users" && (
                <button
                  type="button"
                  className="btn-action-primary"
                  onClick={() => {
                    setUserFormData({ name: "", email: "", password: "", role: "candidate" });
                    setShowCreateUserModal(true);
                  }}
                >
                  <Plus size={15} />
                  <span>Add New User</span>
                </button>
              )}
              {activeTab === "workflows" && (
                <button
                  type="button"
                  className="btn-action-primary"
                  onClick={() => setShowCreateWorkflowModal(true)}
                >
                  <Plus size={15} />
                  <span>Configure Workflow</span>
                </button>
              )}
              {activeTab === "templates" && (
                <button
                  type="button"
                  className="btn-action-primary"
                  onClick={() => setShowCreateTemplateModal(true)}
                >
                  <Plus size={15} />
                  <span>Create Template</span>
                </button>
              )}
              <button
                type="button"
                className="btn-action-outline"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw size={14} className={refreshing ? "spin" : ""} />
                <span>{refreshing ? "Refreshing..." : "Sync Database"}</span>
              </button>
            </div>
          </section>

          {/* TAB 1: OVERVIEW & SYSTEM HEALTH */}
          {activeTab === "overview" && (
            <>
              {/* PRIMARY STATS METRIC GRID */}
              <section className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-top">
                    <span className="metric-label">Active Users</span>
                    <span className="metric-icon-wrap indigo">
                      <Users size={18} />
                    </span>
                  </div>
                  <p className="metric-value">{dashboardStats.activeUsers}</p>
                  <p className="metric-trend">
                    <span>Authorized platform accounts</span>
                  </p>
                </div>

                <div className="metric-card">
                  <div className="metric-top">
                    <span className="metric-label">Total Headcount</span>
                    <span className="metric-icon-wrap emerald">
                      <BriefcaseBusiness size={18} />
                    </span>
                  </div>
                  <p className="metric-value">{dashboardStats.totalHeadcount}</p>
                  <p className="metric-trend">
                    <span>{dashboardStats.totalEmployees} employees • {dashboardStats.totalInterns} interns</span>
                  </p>
                </div>

                <div className="metric-card">
                  <div className="metric-top">
                    <span className="metric-label">Pipeline Candidates</span>
                    <span className="metric-icon-wrap purple">
                      <Activity size={18} />
                    </span>
                  </div>
                  <p className="metric-value">{dashboardStats.openCandidates}</p>
                  <p className="metric-trend">
                    <span>Active recruitment pipeline</span>
                  </p>
                </div>

                <div className="metric-card">
                  <div className="metric-top">
                    <span className="metric-label">Pending Approvals</span>
                    <span className="metric-icon-wrap amber">
                      <Clock size={18} />
                    </span>
                  </div>
                  <p className="metric-value" style={{ color: dashboardStats.pendingApprovals > 0 ? "#d97706" : "inherit" }}>
                    {dashboardStats.pendingApprovals}
                  </p>
                  <p className="metric-trend">
                    <span>In-flight approval workflows</span>
                  </p>
                </div>
              </section>

              {/* SYSTEM HEALTH AND PIPELINE DISTRIBUTION GRID */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
                {/* System Infrastructure Health */}
                <div className="card-box">
                  <div className="card-box-header">
                    <div>
                      <h2 className="card-box-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Database size={18} style={{ color: "#4f46e5" }} />
                        <span>System Infrastructure Health</span>
                      </h2>
                      <p className="card-box-subtitle">Live backend server and database telemetry</p>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                    <div style={{ padding: "12px", background: "var(--secondary)", borderRadius: "var(--radius-md)" }}>
                      <span style={{ fontSize: "11px", color: "var(--muted-foreground)", textTransform: "uppercase" }}>Database Status</span>
                      <p style={{ fontSize: "16px", fontWeight: 700, color: "#059669", marginTop: "4px" }}>
                        ● {dashboardStats.systemHealth?.databaseStatus || "Connected"}
                      </p>
                    </div>
                    <div style={{ padding: "12px", background: "var(--secondary)", borderRadius: "var(--radius-md)" }}>
                      <span style={{ fontSize: "11px", color: "var(--muted-foreground)", textTransform: "uppercase" }}>Server Uptime</span>
                      <p style={{ fontSize: "16px", fontWeight: 700, marginTop: "4px" }}>
                        {dashboardStats.systemHealth?.uptime || "Running"}
                      </p>
                    </div>
                    <div style={{ padding: "12px", background: "var(--secondary)", borderRadius: "var(--radius-md)" }}>
                      <span style={{ fontSize: "11px", color: "var(--muted-foreground)", textTransform: "uppercase" }}>Memory Usage</span>
                      <p style={{ fontSize: "16px", fontWeight: 700, marginTop: "4px" }}>
                        {dashboardStats.systemHealth?.memoryUsedMB || 0} MB
                      </p>
                    </div>
                    <div style={{ padding: "12px", background: "var(--secondary)", borderRadius: "var(--radius-md)" }}>
                      <span style={{ fontSize: "11px", color: "var(--muted-foreground)", textTransform: "uppercase" }}>Offers In Flight</span>
                      <p style={{ fontSize: "16px", fontWeight: 700, marginTop: "4px" }}>
                        {dashboardStats.offersInFlight} Draft / Sent
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pipeline Stage Distribution */}
                <div className="card-box">
                  <div className="card-box-header">
                    <div>
                      <h2 className="card-box-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Activity size={18} style={{ color: "#059669" }} />
                        <span>Candidate Pipeline Distribution</span>
                      </h2>
                      <p className="card-box-subtitle">Real-time candidate count by hiring stage</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f8fafc", borderRadius: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 500 }}>Applied (Initial Intake)</span>
                      <strong style={{ fontSize: "14px" }}>{pipelineStats.applied}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f8fafc", borderRadius: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 500 }}>Screening (HR Review)</span>
                      <strong style={{ fontSize: "14px" }}>{pipelineStats.screening}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f8fafc", borderRadius: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 500 }}>Interview (Assigned Panelists)</span>
                      <strong style={{ fontSize: "14px", color: "#4f46e5" }}>{pipelineStats.interview}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#ecfdf5", borderRadius: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#065f46" }}>Selected (Recommended by HM)</span>
                      <strong style={{ fontSize: "14px", color: "#059669" }}>{pipelineStats.selected}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#fef2f2", borderRadius: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 500, color: "#991b1b" }}>Rejected</span>
                      <strong style={{ fontSize: "14px", color: "#dc2626" }}>{pipelineStats.rejected}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: USERS & ROLE MANAGEMENT */}
          {activeTab === "users" && (
            <div className="card-box">
              <div className="card-box-header">
                <div>
                  <h2 className="card-box-title">User Accounts ({filteredUsers.length})</h2>
                  <p className="card-box-subtitle">Manage system users, reset credentials, assign roles, and toggle access</p>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search name or email..."
                    style={{ width: "220px", padding: "6px 10px", fontSize: "12px" }}
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />

                  <select
                    className="form-select"
                    style={{ width: "160px", padding: "6px 10px", fontSize: "12px" }}
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="hr">HR</option>
                    <option value="hiring_manager">Hiring Manager</option>
                    <option value="interviewer">Interviewer</option>
                    <option value="employee">Employee</option>
                    <option value="intern">Intern</option>
                    <option value="candidate">Candidate</option>
                  </select>
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="empty-state">
                  <Users className="empty-icon" />
                  <p className="empty-title">No users found</p>
                  <p className="empty-desc">No accounts match the selected filters or search terms.</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>User Name</th>
                        <th>Email Address</th>
                        <th>Assigned Role</th>
                        <th>Status</th>
                        <th>Created Date</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u._id}>
                          <td>
                            <strong style={{ fontWeight: 600 }}>{u.name || "User"}</strong>
                          </td>
                          <td style={{ fontSize: "12px" }}>
                            <code>{u.email}</code>
                          </td>
                          <td>
                            <span className="role-tag-badge" style={{
                              background: u.role === "admin" ? "#ede9fe" : u.role === "hiring_manager" ? "#ecfdf5" : u.role === "interviewer" ? "#e0e7ff" : "#f1f5f9",
                              color: u.role === "admin" ? "#6d28d9" : u.role === "hiring_manager" ? "#047857" : u.role === "interviewer" ? "#3730a3" : "#334155"
                            }}>
                              {u.role}
                            </span>
                          </td>
                          <td>
                            <span className={`status-pill ${u.isActive ? "selected" : "rejected"}`}>
                              {u.isActive ? "Active" : "Deactivated"}
                            </span>
                          </td>
                          <td style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              <button
                                type="button"
                                className="btn-action-outline"
                                style={{ padding: "4px 8px", fontSize: "11px" }}
                                title="Edit user"
                                onClick={() => openEditUser(u)}
                              >
                                <Edit3 size={13} />
                              </button>

                              <button
                                type="button"
                                className="btn-action-outline"
                                style={{
                                  padding: "4px 8px",
                                  fontSize: "11px",
                                  color: u.isActive ? "#d97706" : "#059669",
                                  borderColor: u.isActive ? "#fcd34d" : "#6ee7b7"
                                }}
                                title={u.isActive ? "Deactivate user" : "Activate user"}
                                onClick={() => handleToggleUserStatus(u)}
                              >
                                <Power size={13} />
                              </button>

                              <button
                                type="button"
                                className="btn-action-outline"
                                style={{ padding: "4px 8px", fontSize: "11px", color: "#dc2626", borderColor: "#fca5a5" }}
                                title="Delete user"
                                onClick={() => handleDeleteUser(u)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WORKFLOW CONFIGURATION */}
          {activeTab === "workflows" && (
            <div className="card-box">
              <div className="card-box-header">
                <div>
                  <h2 className="card-box-title">Configured Approval Workflows ({workflowsList.length})</h2>
                  <p className="card-box-subtitle">Approval chains governing offers, letters, and employee exits</p>
                </div>
              </div>

              {workflowsList.length === 0 ? (
                <div className="empty-state">
                  <GitMerge className="empty-icon" />
                  <p className="empty-title">No workflows defined</p>
                  <p className="empty-desc">Click "Configure Workflow" above to define an approval chain.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {workflowsList.map((wf) => (
                    <div key={wf._id} style={{
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      padding: "16px",
                      background: "#ffffff"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <h3 style={{ fontSize: "16px", fontWeight: 700 }}>{wf.name}</h3>
                            <span className="role-tag-badge" style={{ background: "#ede9fe", color: "#6d28d9" }}>
                              Type: {wf.type.toUpperCase()}
                            </span>
                            <span className={`status-pill ${wf.isActive ? "selected" : "rejected"}`}>
                              {wf.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <p style={{ fontSize: "12px", color: "var(--muted-foreground)", marginTop: "4px" }}>
                            {wf.description || "Standard multi-stage approval chain"}
                          </p>
                        </div>

                        <button
                          type="button"
                          className="btn-action-outline"
                          style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                          onClick={() => handleDeleteWorkflow(wf)}
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </div>

                      {/* Step-by-step chain */}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        background: "var(--secondary)",
                        padding: "12px",
                        borderRadius: "var(--radius-sm)",
                        overflowX: "auto"
                      }}>
                        {wf.steps?.map((step, idx) => (
                          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{
                              background: "#ffffff",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius-sm)",
                              padding: "8px 12px",
                              minWidth: "150px"
                            }}>
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "#6366f1" }}>
                                STEP {step.order}
                              </span>
                              <p style={{ fontSize: "12px", fontWeight: 600, marginTop: "2px" }}>
                                {step.stepName || `Stage ${step.order}`}
                              </p>
                              <span className="role-tag-badge" style={{ marginTop: "4px" }}>
                                Role: {step.role}
                              </span>
                            </div>
                            {idx < wf.steps.length - 1 && (
                              <ChevronRight size={18} style={{ color: "var(--muted-foreground)", shrink: 0 }} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LETTER TEMPLATES */}
          {activeTab === "templates" && (
            <div className="card-box">
              <div className="card-box-header">
                <div>
                  <h2 className="card-box-title">Document & Letter Templates ({templatesList.length})</h2>
                  <p className="card-box-subtitle">HTML templates for offer letters, appointment letters, and experience certificates</p>
                </div>
              </div>

              {templatesList.length === 0 ? (
                <div className="empty-state">
                  <FileText className="empty-icon" />
                  <p className="empty-title">No letter templates found</p>
                  <p className="empty-desc">Create your first letter template to automate HR documentation.</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Template Name</th>
                        <th>Type</th>
                        <th>Version</th>
                        <th>Placeholder Variables</th>
                        <th>Status</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {templatesList.map((tpl) => (
                        <tr key={tpl._id}>
                          <td>
                            <strong style={{ fontWeight: 600 }}>{tpl.name}</strong>
                          </td>
                          <td>
                            <span className="role-tag-badge">
                              {tpl.type}
                            </span>
                          </td>
                          <td style={{ fontSize: "12px", fontWeight: 600 }}>
                            v{tpl.version || 1}
                          </td>
                          <td>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                              {tpl.placeholders?.map((p, idx) => (
                                <code key={idx} style={{ fontSize: "11px", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                                  {"{{" + p + "}}"}
                                </code>
                              ))}
                            </div>
                          </td>
                          <td>
                            <span className={`status-pill ${tpl.isActive ? "selected" : "rejected"}`}>
                              {tpl.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="btn-action-outline"
                              style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                              onClick={() => handleDeleteTemplate(tpl)}
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
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

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === "audit" && (
            <div className="card-box">
              <div className="card-box-header">
                <div>
                  <h2 className="card-box-title">Immutable Audit Trail ({filteredAuditLogs.length})</h2>
                  <p className="card-box-subtitle">Security and compliance records for all administrative actions</p>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <Filter size={14} style={{ color: "var(--muted-foreground)" }} />
                  <select
                    className="form-select"
                    style={{ width: "160px", padding: "6px 10px", fontSize: "12px" }}
                    value={auditModuleFilter}
                    onChange={(e) => setAuditModuleFilter(e.target.value)}
                  >
                    <option value="all">All Modules</option>
                    <option value="users">Users</option>
                    <option value="workflows">Workflows</option>
                    <option value="letter_templates">Letter Templates</option>
                    <option value="offers">Offers</option>
                    <option value="candidates">Candidates</option>
                  </select>
                </div>
              </div>

              {filteredAuditLogs.length === 0 ? (
                <div className="empty-state">
                  <ShieldCheck className="empty-icon" />
                  <p className="empty-title">No audit records found</p>
                  <p className="empty-desc">System events will appear here as administrative actions are performed.</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Actor</th>
                        <th>Action</th>
                        <th>Target Module</th>
                        <th>Entity ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAuditLogs.map((log) => (
                        <tr key={log._id}>
                          <td style={{ fontSize: "12px", fontFamily: "monospace" }}>
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td>
                            <strong>{log.userId?.name || "System Admin"}</strong>
                            <p style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                              {log.userId?.email || "system"}
                            </p>
                          </td>
                          <td>
                            <span className="role-tag-badge" style={{
                              background: log.action === "create" ? "#ecfdf5" : log.action === "delete" ? "#fef2f2" : "#f1f5f9",
                              color: log.action === "create" ? "#065f46" : log.action === "delete" ? "#991b1b" : "#334155"
                            }}>
                              {log.action.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <code style={{ fontSize: "12px" }}>{log.module}</code>
                          </td>
                          <td style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--muted-foreground)" }}>
                            #{log.entityId ? String(log.entityId).slice(-8) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: GLOBAL SEARCH RESULTS */}
          {activeTab === "search" && (
            <div className="card-box">
              <div className="card-box-header">
                <div>
                  <h2 className="card-box-title">
                    Global Search {searchResults?.query ? `for "${searchResults.query}"` : ""}
                  </h2>
                  <p className="card-box-subtitle">
                    Found {searchResults?.counts?.total || 0} matching records across Candidates, Employees, Offers, and Users
                  </p>
                </div>
              </div>

              {searching ? (
                <div className="empty-state">
                  <p>Searching platform database...</p>
                </div>
              ) : !searchResults ? (
                <div className="empty-state">
                  <Search className="empty-icon" />
                  <p className="empty-title">Start a search</p>
                  <p className="empty-desc">Enter any name, email, designation, role, or ID into the top search bar.</p>
                </div>
              ) : searchResults.counts?.total === 0 ? (
                <div className="empty-state">
                  <Search className="empty-icon" />
                  <p className="empty-title">No records matched</p>
                  <p className="empty-desc">Try searching by partial first/last name or different keywords.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Candidates */}
                  {searchResults.results?.candidates?.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px", color: "#4f46e5" }}>
                        Candidates ({searchResults.results.candidates.length})
                      </h3>
                      <div className="table-wrapper">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Target Position</th>
                              <th>Stage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {searchResults.results.candidates.map((c) => (
                              <tr key={c._id}>
                                <td><strong>{c.name}</strong></td>
                                <td>{c.email}</td>
                                <td>{c.position}</td>
                                <td>
                                  <span className={`status-pill ${(c.status || "").toLowerCase()}`}>{c.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Employees */}
                  {searchResults.results?.employees?.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px", color: "#059669" }}>
                        Employees ({searchResults.results.employees.length})
                      </h3>
                      <div className="table-wrapper">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Emp ID</th>
                              <th>Name</th>
                              <th>Designation</th>
                              <th>Department</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {searchResults.results.employees.map((e) => (
                              <tr key={e._id}>
                                <td><code>{e.empId}</code></td>
                                <td><strong>{e.userId?.name || "Employee"}</strong></td>
                                <td>{e.designation}</td>
                                <td>{e.department}</td>
                                <td>
                                  <span className={`status-pill ${e.status}`}>{e.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Users */}
                  {searchResults.results?.users?.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px", color: "#6d28d9" }}>
                        Users ({searchResults.results.users.length})
                      </h3>
                      <div className="table-wrapper">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Role</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {searchResults.results.users.map((u) => (
                              <tr key={u._id}>
                                <td><strong>{u.name}</strong></td>
                                <td>{u.email}</td>
                                <td><span className="role-tag-badge">{u.role}</span></td>
                                <td><span className={`status-pill ${u.isActive ? "selected" : "rejected"}`}>{u.isActive ? "Active" : "Inactive"}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        {/* FOOTER */}
        <footer className="shell-footer">
          <span>People first. Everything else follows.</span>
          <div className="system-status">
            <span className="system-status-dot"></span>
            <span>All systems operational • Database Connected</span>
          </div>
        </footer>
      </div>

      {/* ============================================================
          CREATE USER MODAL
          ============================================================ */}
      {showCreateUserModal && (
        <div className="modal-overlay" onClick={() => setShowCreateUserModal(false)}>
          <div className="modal-dialog" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h3 className="modal-title">Create User Account</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowCreateUserModal(false)}>✕</button>
            </header>
            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="new-user-name">Full Name</label>
                  <input
                    id="new-user-name"
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Alex Rivera"
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="new-user-email">Work Email</label>
                  <input
                    id="new-user-email"
                    type="email"
                    required
                    className="form-input"
                    placeholder="alex@company.com"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="new-user-password">Initial Password</label>
                  <input
                    id="new-user-password"
                    type="password"
                    required
                    minLength={8}
                    className="form-input"
                    placeholder="Minimum 8 characters"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Role Assignment</label>
                  <select
                    className="form-select"
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  >
                    <option value="admin">Admin</option>
                    <option value="hr">HR</option>
                    <option value="hiring_manager">Hiring Manager</option>
                    <option value="interviewer">Interviewer</option>
                    <option value="employee">Employee</option>
                    <option value="intern">Intern</option>
                    <option value="candidate">Candidate</option>
                  </select>
                </div>
              </div>

              <footer className="modal-footer">
                <button type="button" className="btn-action-outline" onClick={() => setShowCreateUserModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="auth-btn-primary" style={{ width: "auto", margin: 0 }} disabled={submittingUser}>
                  {submittingUser ? "Creating Account..." : "Create Account"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          EDIT USER MODAL
          ============================================================ */}
      {showEditUserModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowEditUserModal(false)}>
          <div className="modal-dialog" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h3 className="modal-title">Edit User Account</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowEditUserModal(false)}>✕</button>
            </header>
            <form onSubmit={handleUpdateUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-user-name">Full Name</label>
                  <input
                    id="edit-user-name"
                    type="text"
                    required
                    className="form-input"
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email (Immutable)</label>
                  <input
                    type="email"
                    disabled
                    className="form-input"
                    value={userFormData.email}
                    style={{ background: "#f1f5f9", cursor: "not-allowed" }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Role Assignment</label>
                  <select
                    className="form-select"
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  >
                    <option value="admin">Admin</option>
                    <option value="hr">HR</option>
                    <option value="hiring_manager">Hiring Manager</option>
                    <option value="interviewer">Interviewer</option>
                    <option value="employee">Employee</option>
                    <option value="intern">Intern</option>
                    <option value="candidate">Candidate</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-user-password">
                    <span>Reset Password</span>
                    <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>Leave blank to keep current</span>
                  </label>
                  <input
                    id="edit-user-password"
                    type="password"
                    minLength={8}
                    className="form-input"
                    placeholder="New password (optional)"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  />
                </div>
              </div>

              <footer className="modal-footer">
                <button type="button" className="btn-action-outline" onClick={() => setShowEditUserModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="auth-btn-primary" style={{ width: "auto", margin: 0 }} disabled={submittingUser}>
                  {submittingUser ? "Saving..." : "Save Changes"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          CONFIGURE WORKFLOW MODAL
          ============================================================ */}
      {showCreateWorkflowModal && (
        <div className="modal-overlay" onClick={() => setShowCreateWorkflowModal(false)}>
          <div className="modal-dialog" style={{ maxWidth: "540px" }} onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h3 className="modal-title">Configure Approval Workflow Chain</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowCreateWorkflowModal(false)}>✕</button>
            </header>
            <form onSubmit={handleCreateWorkflow}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="wf-name">Workflow Name</label>
                  <input
                    id="wf-name"
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Standard Offer Approval Chain"
                    value={workflowFormData.name}
                    onChange={(e) => setWorkflowFormData({ ...workflowFormData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Workflow Type</label>
                  <select
                    className="form-select"
                    value={workflowFormData.type}
                    onChange={(e) => setWorkflowFormData({ ...workflowFormData, type: e.target.value })}
                  >
                    <option value="offer">Offer Approval Chain</option>
                    <option value="letter">Letter Approval Chain</option>
                    <option value="exit">Exit / Resignation Clearance Chain</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="wf-desc">Description</label>
                  <input
                    id="wf-desc"
                    type="text"
                    className="form-input"
                    placeholder="HM -> HR -> Admin review chain"
                    value={workflowFormData.description}
                    onChange={(e) => setWorkflowFormData({ ...workflowFormData, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Default Approval Steps Sequence</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {workflowFormData.steps.map((st, idx) => (
                      <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, width: "60px" }}>Step {st.order}:</span>
                        <input
                          type="text"
                          className="form-input"
                          style={{ flex: 1 }}
                          value={st.stepName}
                          onChange={(e) => {
                            const newSteps = [...workflowFormData.steps];
                            newSteps[idx].stepName = e.target.value;
                            setWorkflowFormData({ ...workflowFormData, steps: newSteps });
                          }}
                        />
                        <select
                          className="form-select"
                          style={{ width: "140px" }}
                          value={st.role}
                          onChange={(e) => {
                            const newSteps = [...workflowFormData.steps];
                            newSteps[idx].role = e.target.value;
                            setWorkflowFormData({ ...workflowFormData, steps: newSteps });
                          }}
                        >
                          <option value="hiring_manager">Hiring Manager</option>
                          <option value="hr">HR</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <footer className="modal-footer">
                <button type="button" className="btn-action-outline" onClick={() => setShowCreateWorkflowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="auth-btn-primary" style={{ width: "auto", margin: 0 }} disabled={submittingWorkflow}>
                  {submittingWorkflow ? "Saving..." : "Save Workflow"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          CREATE LETTER TEMPLATE MODAL
          ============================================================ */}
      {showCreateTemplateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateTemplateModal(false)}>
          <div className="modal-dialog" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h3 className="modal-title">Create Letter Template</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowCreateTemplateModal(false)}>✕</button>
            </header>
            <form onSubmit={handleCreateTemplate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="tpl-name">Template Name</label>
                  <input
                    id="tpl-name"
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Full-Time Appointment Letter"
                    value={templateFormData.name}
                    onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Template Type</label>
                  <select
                    className="form-select"
                    value={templateFormData.type}
                    onChange={(e) => setTemplateFormData({ ...templateFormData, type: e.target.value })}
                  >
                    <option value="appointment">Appointment Letter</option>
                    <option value="offer">Offer Letter</option>
                    <option value="internship">Internship Completion Certificate</option>
                    <option value="experience">Relieving / Experience Letter</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="tpl-content">
                    <span>HTML Template Content</span>
                    <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                      Use &#123;&#123;placeholder&#125;&#125; variables
                    </span>
                  </label>
                  <textarea
                    id="tpl-content"
                    rows={6}
                    required
                    className="form-textarea"
                    value={templateFormData.htmlContent}
                    onChange={(e) => setTemplateFormData({ ...templateFormData, htmlContent: e.target.value })}
                  />
                </div>
              </div>

              <footer className="modal-footer">
                <button type="button" className="btn-action-outline" onClick={() => setShowCreateTemplateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="auth-btn-primary" style={{ width: "auto", margin: 0 }} disabled={submittingTemplate}>
                  {submittingTemplate ? "Creating..." : "Create Template"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
