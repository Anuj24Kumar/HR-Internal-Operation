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
  activateUser,
  deactivateUser,
  deleteUser,
} from "../adminApi.js";
import { RoleBadge, StatusBadge } from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";

const AVAILABLE_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "hr", label: "HR" },
  { value: "hiring-manager", label: "Hiring Manager" },
  { value: "interviewer", label: "Interviewer" },
  { value: "candidate", label: "Candidate" },
  { value: "intern", label: "Intern" },
  { value: "employee", label: "Employee" },
];

export default function UsersView() {
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

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

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
        isActive: statusFilter,
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
  function openEditModal(user) {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setEditModalOpen(true);
  }

  async function handleUpdateUser(e) {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };
      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }
      await updateUser(selectedUser._id, payload);
      setAlert({ type: "success", message: `User "${formData.name}" updated successfully!` });
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
    try {
      if (user.isActive) {
        await deactivateUser(user._id);
        setAlert({ type: "success", message: `User ${user.name} deactivated.` });
      } else {
        await activateUser(user._id);
        setAlert({ type: "success", message: `User ${user.name} re-activated.` });
      }
      loadUsers();
    } catch (err) {
      setAlert({ type: "error", message: err.message });
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

  // Delete User
  function openDeleteModal(user) {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await deleteUser(selectedUser._id);
      setAlert({ type: "success", message: `User "${selectedUser.name}" permanently deleted.` });
      setDeleteModalOpen(false);
      loadUsers();
    } catch (err) {
      setAlert({ type: "error", message: err.message });
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
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
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
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Linked Entity</th>
                <th>Created At</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
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
                    <td>
                      <RoleBadge role={u.role} />
                    </td>
                    <td>
                      <StatusBadge active={u.isActive} />
                    </td>
                    <td style={{ fontSize: "12px", color: "#64748b" }}>
                      {u.employeeId ? (
                        <span>Emp ID: <strong>{u.employeeId.empId || "Assigned"}</strong></span>
                      ) : u.candidateId ? (
                        <span>Candidate Position: <strong>{u.candidateId.position || "Applicant"}</strong></span>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: "12.5px", color: "#64748b" }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
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
                          title={u.isActive ? "Deactivate user" : "Activate user"}
                        >
                          <Power size={13} />
                          <span>{u.isActive ? "Deactivate" : "Activate"}</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => openDeleteModal(u)}
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
              autoComplete="new-password"
              className="admin-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 6 characters"
            />
            <div className="admin-form-hint">Password will be bcrypt-hashed before storage.</div>
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
            <label className="admin-form-label">New Password (Leave blank to keep unchanged)</label>
            <input
              type="password"
              autoComplete="new-password"
              className="admin-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
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
              Security Notice: System prevents demoting or removing the last active Admin.
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

            {selectedUser.employeeId && (
              <div style={{ padding: "12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px" }}>
                <h4 style={{ margin: "0 0 6px", fontSize: "13px", color: "#166534" }}>Linked Employee Profile</h4>
                <div style={{ fontSize: "12.5px", color: "#15803d" }}>
                  Emp ID: <strong>{selectedUser.employeeId.empId}</strong> · {selectedUser.employeeId.designation} · {selectedUser.employeeId.department}
                </div>
              </div>
            )}

            {selectedUser.candidateId && (
              <div style={{ padding: "12px", background: "#fefce8", border: "1px solid #fef08a", borderRadius: "8px" }}>
                <h4 style={{ margin: "0 0 6px", fontSize: "13px", color: "#854d0e" }}>Linked Candidate Profile</h4>
                <div style={{ fontSize: "12.5px", color: "#a16207" }}>
                  Position: <strong>{selectedUser.candidateId.position}</strong> · Status: {selectedUser.candidateId.status}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Permanent Deletion"
        footer={
          <>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-danger"
              disabled={submitting}
              onClick={handleDeleteConfirm}
            >
              {submitting ? "Deleting..." : "Permanently Delete"}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", gap: "12px" }}>
          <AlertCircle size={24} style={{ color: "#dc2626", flexShrink: 0 }} />
          <div>
            <p style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>
              Are you sure you want to delete user "{selectedUser?.name}" ({selectedUser?.email})?
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
              This action cannot be undone. An immutable audit record of this deletion will be stored in the audit logs.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
