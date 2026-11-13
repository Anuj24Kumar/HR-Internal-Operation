import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Power,
  Eye,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  fetchUsers,
  fetchUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  setUserStatus,
} from "../adminApi.js";
import { RoleBadge, StatusBadge } from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";
import { useAlert } from "../../../components/AlertProvider.jsx";

const AVAILABLE_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "hr", label: "HR" },
  { value: "hiring_manager", label: "Hiring Manager" },
  { value: "interviewer", label: "Interviewer" },
  { value: "candidate", label: "Candidate" },
  { value: "intern", label: "Intern" },
  { value: "employee", label: "Employee" },
];

export default function UsersView() {
  const alertApi = useAlert();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [overrideRoleChange, setOverrideRoleChange] = useState(false);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Selected User State
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "candidate",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter, statusFilter]);

  async function loadUsers(searchOverride) {
    setLoading(true);
    setAlert(null);
    try {
      const qSearch = searchOverride !== undefined ? searchOverride : search;
      const res = await fetchUsers({
        role: roleFilter,
        status: statusFilter,
        search: qSearch,
        page,
        limit: 15,
      });
      setUsers(res.users || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setAlert({ type: "error", message: err.message || "Failed to load users" });
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    loadUsers();
  }

  // Create User
  function openCreateModal() {
    setFormData({ name: "", email: "", password: "", role: "employee" });
    setCreateModalOpen(true);
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createUser(formData);
      setAlert({ type: "success", message: `User "${formData.name}" created successfully!` });
      setCreateModalOpen(false);
      loadUsers();
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  // Edit User
  async function openEditModal(user) {
    let details = user;
    try {
      const response = await fetchUserById(user._id);
      details = response.user || user;
    } catch (error) {
      alertApi.toastError("Could not load user", error.message);
    }
    setSelectedUser(details);
    setFormData({
      name: details.name || "",
      email: details.email || "",
      role: details.role === "hiring-manager" ? "hiring_manager" : (details.role || "candidate"),
      phone: details.phone || "",
      department: details.department || "",
      designation: details.designation || details.position || "",
      domain: details.domain || "",
      track: details.track || "",
      stipend: details.stipend || "",
      employmentType: details.employmentType || "",
      hasAcceptedOffer: details.hasAcceptedOffer,
    });
    setOverrideRoleChange(false);
    setEditModalOpen(true);
  }

  async function handleUpdateUser(e) {
    e.preventDefault();
    if (!selectedUser) return;
    const roleChanged = formData.role !== selectedUser.role;
    const needsOverride = selectedUser.role === "candidate"
      && ["intern", "employee"].includes(formData.role)
      && !selectedUser.hasAcceptedOffer;
    if (needsOverride && !overrideRoleChange) {
      alertApi.toastError("Override required", "Tick the override checkbox before converting a candidate without an accepted offer.");
      return;
    }
    if (roleChanged) {
      const confirmed = await alertApi.confirm({
        title: "Change user role?",
        message: needsOverride
          ? `This candidate has no accepted offer. Force-convert ${selectedUser.name} to ${formData.role}? The override will be audit-logged and HR will be notified.`
          : `Change ${selectedUser.name}'s role from ${selectedUser.role} to ${formData.role}?`,
        confirmText: needsOverride ? "Force convert" : "Change role",
        type: needsOverride ? "warning" : "primary",
      });
      if (!confirmed) return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        phone: formData.phone?.trim() || "",
        department: formData.department ? formData.department.trim() : "",
        designation: formData.designation ? formData.designation.trim() : "",
        position: formData.designation ? formData.designation.trim() : "",
        domain: formData.domain || "",
        track: formData.track || "",
        stipend: formData.stipend === "" ? undefined : Number(formData.stipend),
        employmentType: formData.employmentType || undefined,
        ...(needsOverride ? { override: true } : {}),
      };
      await updateUser(selectedUser._id, payload);
      alertApi.toastSuccess("User updated", `Saved changes for ${formData.name}.`);
      setEditModalOpen(false);
      loadUsers();
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  // Toggle Activation
  async function handleToggleStatus(user) {
    const nextStatus = user.status === "active" ? "suspended" : "active";
    const confirmed = await alertApi.confirm({
      title: nextStatus === "suspended" ? "Suspend this user?" : "Activate this user?",
      message: nextStatus === "suspended"
        ? `${user.name} will be blocked from signing in; their data will be retained.`
        : `${user.name} will be able to sign in again.`,
      confirmText: nextStatus === "suspended" ? "Suspend" : "Activate",
    });
    if (!confirmed) return;
    try {
      await setUserStatus(user._id, nextStatus);
      alertApi.toastSuccess("Account status updated", `${user.name} is now ${nextStatus}.`);
      loadUsers();
    } catch (err) {
      alertApi.toastError("Status update failed", err.message);
    }
  }

  async function handleResetPassword(user) {
    const newPassword = await alertApi.prompt({
      title: "Reset password",
      message: `Set a new password for ${user.name} (at least 8 characters).`,
      placeholder: "New password",
    });
    if (newPassword === null) return;
    if (newPassword.length < 8) {
      alertApi.toastError("Password too short", "Passwords must contain at least 8 characters.");
      return;
    }
    const confirmed = await alertApi.confirm({
      title: "Confirm password reset?",
      message: `Reset ${user.name}'s password and notify them?`,
      confirmText: "Reset password",
    });
    if (!confirmed) return;
    try {
      await resetUserPassword(user._id, newPassword);
      alertApi.toastSuccess("Password reset", `${user.name} can sign in using the new password.`);
    } catch (error) {
      alertApi.toastError("Password reset failed", error.message);
    }
  }

  // View Details
  async function openViewModal(user) {
    try {
      const res = await fetchUserById(user._id);
      setSelectedUser(res.user);
      setViewModalOpen(true);
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    }
  }

  async function handleDelete(user) {
    const confirmed = await alertApi.confirm({
      title: "Delete user account?",
      message: `Permanently delete ${user.name} (${user.email})? Users with dependent workflow records cannot be deleted.`,
      confirmText: "Delete user",
      type: "danger",
    });
    if (!confirmed) return;
    setSubmitting(true);
    try {
      await deleteUser(user._id);
      alertApi.toastSuccess("User deleted", `${user.name} was removed.`);
      loadUsers();
    } catch (err) {
      const dependencies = err.data ? `\nDependent records: ${JSON.stringify(err.data)}` : "";
      await alertApi.alert({
        title: err.status === 409 ? "Deletion blocked" : "Delete failed",
        message: `${err.message}${dependencies}`,
        type: "warning",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="admin-page-header">
        <div className="admin-breadcrumbs">
          <span>Workspace</span>
          <span>&gt;</span>
          <span style={{ color: "#0f172a", fontWeight: "600" }}>Manage Users</span>
        </div>

        <div className="admin-header-title-row">
          <h1 className="admin-page-title">Manage Users</h1>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={openCreateModal}
          >
            <UserPlus size={16} />
            <span>Add New User</span>
          </button>
        </div>

        <p className="admin-page-subtitle">
          Manage user credentials, security status, and role access permissions across the enterprise.
        </p>
      </div>

      {/* Alert Notification */}
      {alert && (
        <div className={`admin-alert ${alert.type === "success" ? "admin-alert-success" : "admin-alert-error"}`}>
          {alert.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{alert.message}</span>
          <button
            type="button"
            onClick={() => setAlert(null)}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontWeight: "700" }}
          >
            ×
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="admin-card" style={{ padding: "16px 20px", marginBottom: "18px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: "240px", display: "flex", gap: "8px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search
                size={16}
                style={{ position: "absolute", left: "12px", top: "11px", color: "#64748b" }}
              />
              <input
                type="text"
                className="admin-input"
                style={{ paddingLeft: "36px" }}
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="admin-btn admin-btn-secondary">
              Search
            </button>
          </form>

          {/* Role Filter */}
          <div style={{ width: "180px" }}>
            <select
              className="admin-select"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Roles</option>
              {AVAILABLE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ width: "150px" }}>
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => {
              setSearch("");
              setRoleFilter("");
              setStatusFilter("");
              setPage(1);
              loadUsers("");
            }}
            title="Reset filters"
          >
            <RefreshCw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-card" style={{ padding: 0 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: "700", fontSize: "15px" }}>
            Total Users: <span style={{ color: "#2563eb" }}>{total}</span>
          </div>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#64748b" }}>
              <Loader2 size={14} className="spin" />
              <span>Loading users...</span>
            </div>
          )}
        </div>

        <div className="admin-table-container" style={{ border: "none" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name / Email</th>
                <th>Emp ID</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Last Login</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                    No users found matching current filters.
                  </td>
                </tr>
              )}

              {users.map((u) => {
                const userInitials = u.name
                  ? u.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "U";

                return (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "50%",
                            background: "#e0e7ff",
                            color: "#3730a3",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "700",
                            fontSize: "12px",
                          }}
                        >
                          {userInitials}
                        </div>
                        <div>
                          <div style={{ fontWeight: "600", color: "#0f172a" }}>{u.name}</div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{u.employeeId?.employeeId || u.employeeId?.empId || u.empId || "—"}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-start" }}>
                        <RoleBadge role={u.role} />
                        {(u.position || u.designation || u.candidateId?.position || u.employeeId?.designation) && (
                          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "500" }}>
                            {u.position || u.designation || u.candidateId?.position || u.employeeId?.designation}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{u.department || u.employeeId?.department || "—"}</td>
                    <td>
                      <StatusBadge label={u.status || (u.isActive ? "active" : "inactive")} active={u.status === "active" || (!u.status && u.isActive)} />
                    </td>
                    <td style={{ fontSize: "12.5px", color: "#64748b" }}>
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        {/* View Button */}
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          onClick={() => openViewModal(u)}
                          title="View user details"
                        >
                          <Eye size={13} />
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          onClick={() => openEditModal(u)}
                          title="Edit user"
                        >
                          <Edit2 size={13} />
                        </button>

                        {/* Toggle Active Button */}
                        <button
                          type="button"
                          className={`admin-btn admin-btn-sm ${u.isActive ? "admin-btn-secondary" : "admin-btn-primary"}`}
                          onClick={() => handleToggleStatus(u)}
                          title={u.status === "active" ? "Suspend user" : "Activate user"}
                        >
                          <Power size={13} />
                          <span>{u.status === "active" ? "Suspend" : "Activate"}</span>
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          onClick={() => handleResetPassword(u)}
                          title="Reset password"
                        >
                          Reset password
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => handleDelete(u)}
                          title="Delete user"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div
            style={{
              padding: "14px 20px",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "13px",
            }}
          >
            <div style={{ color: "#64748b" }}>
              Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New User Account"
        footer={
          <>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-user-form"
              className="admin-btn admin-btn-primary"
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create Account"}
            </button>
          </>
        }
      >
        <form id="create-user-form" onSubmit={handleCreateUser}>
          <div className="admin-form-group">
            <label className="admin-form-label">Full Name *</label>
            <input
              type="text"
              required
              className="admin-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Email Address *</label>
            <input
              type="email"
              required
              className="admin-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. john@peopleops.com"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Password *</label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="admin-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 8 characters"
            />
            <div className="admin-form-hint">Password will be bcrypt-hashed before storage.</div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Phone</label>
            <input className="admin-input" value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Assigned Role *</label>
            <select
              className="admin-select"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              {AVAILABLE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Department</label>
            <input className="admin-input" value={formData.department || ""} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
          </div>
          {formData.role === "intern" && (
            <div className="admin-form-group">
              <label className="admin-form-label">Domain / Track</label>
              <input className="admin-input" value={formData.domain || ""} onChange={(e) => setFormData({ ...formData, domain: e.target.value })} />
              <input className="admin-input" placeholder="Track" value={formData.track || ""} onChange={(e) => setFormData({ ...formData, track: e.target.value })} />
              <input className="admin-input" type="number" min="0" placeholder="Stipend" value={formData.stipend || ""} onChange={(e) => setFormData({ ...formData, stipend: e.target.value })} />
            </div>
          )}
          {formData.role === "employee" && (
            <>
              <div className="admin-form-group">
                <label className="admin-form-label">Designation</label>
                <input className="admin-input" value={formData.designation || ""} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Employment Type</label>
                <select className="admin-select" value={formData.employmentType || ""} onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}>
                  <option value="">Select type</option><option value="full_time">Full-time</option><option value="part_time">Part-time</option><option value="contract">Contract</option>
                </select>
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* EDIT USER MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit User: ${selectedUser?.name}`}
        footer={
          <>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-user-form"
              className="admin-btn admin-btn-primary"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </>
        }
      >
        <form id="edit-user-form" onSubmit={handleUpdateUser}>
          <div className="admin-form-group">
            <label className="admin-form-label">Full Name *</label>
            <input
              type="text"
              required
              className="admin-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Email Address *</label>
            <input
              type="email"
              required
              className="admin-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Role Assignment *</label>
            <select
              className="admin-select"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              {AVAILABLE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <div className="admin-form-hint">
              Select any role to change or promote this user (e.g. Candidate to Employee, Intern, HR, or other roles).
            </div>
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Phone</label>
            <input className="admin-input" value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          {selectedUser?.role === "candidate" && ["intern", "employee"].includes(formData.role) && !selectedUser.hasAcceptedOffer && (
            <div style={{ background: "#fef3c7", color: "#92400e", borderRadius: "8px", padding: "12px", marginBottom: "12px" }}>
              <strong>This candidate has no accepted offer.</strong> Saving will force-convert this account and audit-log the override.
              <label style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "8px" }}>
                <input type="checkbox" checked={overrideRoleChange} onChange={(e) => setOverrideRoleChange(e.target.checked)} />
                I understand and approve this override
              </label>
            </div>
          )}
          {formData.role === "intern" && (
            <div className="admin-form-group">
              <label className="admin-form-label">Domain / Track</label>
              <input className="admin-input" value={formData.domain || ""} onChange={(e) => setFormData({ ...formData, domain: e.target.value })} />
              <input className="admin-input" placeholder="Track" value={formData.track || ""} onChange={(e) => setFormData({ ...formData, track: e.target.value })} />
              <input className="admin-input" type="number" min="0" placeholder="Stipend" value={formData.stipend || ""} onChange={(e) => setFormData({ ...formData, stipend: e.target.value })} />
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Designation / Position</label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g. Frontend Developer"
                value={formData.designation || ""}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Department</label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g. Engineering"
                value={formData.department || ""}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* VIEW USER DETAILS MODAL */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="User Account Details"
        footer={
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => setViewModalOpen(false)}
          >
            Close
          </button>
        }
      >
        {selectedUser && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", paddingBottom: "14px", borderBottom: "1px solid #e2e8f0" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "#e0e7ff",
                  color: "#3730a3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "18px",
                }}
              >
                {selectedUser.name?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>{selectedUser.name}</h3>
                <div style={{ fontSize: "13px", color: "#64748b" }}>{selectedUser.email}</div>
                <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                  <RoleBadge role={selectedUser.role} />
                  <StatusBadge active={selectedUser.isActive} />
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
              <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px" }}>
                <span style={{ color: "#64748b", display: "block" }}>User ID</span>
                <span style={{ fontFamily: "monospace", fontWeight: "600" }}>{selectedUser._id}</span>
              </div>
              <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px" }}>
                <span style={{ color: "#64748b", display: "block" }}>Created Date</span>
                <span style={{ fontWeight: "600" }}>
                  {new Date(selectedUser.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {(selectedUser.position || selectedUser.designation || selectedUser.candidateId?.position || selectedUser.employeeId?.designation) && (
              <div style={{ padding: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                <h4 style={{ margin: "0 0 6px", fontSize: "13px", color: "#0f172a" }}>Role & Profile Details</h4>
                <div style={{ fontSize: "12.5px", color: "#475569" }}>
                  Role: <strong style={{ textTransform: "capitalize" }}>{selectedUser.role}</strong>
                  {(selectedUser.position || selectedUser.candidateId?.position) && (
                    <span> · Position: <strong>{selectedUser.position || selectedUser.candidateId?.position}</strong></span>
                  )}
                  {(selectedUser.designation || selectedUser.employeeId?.designation) && (
                    <span> · Designation: <strong>{selectedUser.designation || selectedUser.employeeId?.designation}</strong></span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
}
