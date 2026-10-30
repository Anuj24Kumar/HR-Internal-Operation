import React, { useState, useEffect } from "react";
import {
  GitBranch,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Shield,
  Layers,
  ChevronUp,
  ChevronDown,
  Power,
  RefreshCw,
} from "lucide-react";
import {
  fetchWorkflows,
  fetchWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
} from "../adminApi.js";
import { StatusBadge, RoleBadge } from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";

const WORKFLOW_TYPES = [
  { value: "offer", label: "Offer Letter Approval (offer)" },
  { value: "letter", label: "Official Document / Letter Approval (letter)" },
  { value: "exit", label: "Resignation / Exit Approval (exit)" },
];

const APPROVER_ROLES = [
  { value: "hiring-manager", label: "Hiring Manager" },
  { value: "hr", label: "HR" },
  { value: "admin", label: "Admin" },
];

export default function WorkflowsView() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    type: "offer",
    description: "",
    steps: [
      { order: 1, role: "hiring-manager", stepName: "Hiring Manager Recommendation", isRequired: true },
      { order: 2, role: "hr", stepName: "HR Verification", isRequired: true },
      { order: 3, role: "admin", stepName: "Executive Approval", isRequired: true },
    ],
  });

  useEffect(() => {
    loadWorkflows();
  }, [statusFilter]);

  async function loadWorkflows() {
    setLoading(true);
    setAlert(null);
    try {
      const res = await fetchWorkflows({ isActive: statusFilter });
      setWorkflows(res.workflows || []);
    } catch (err) {
      setAlert({ type: "error", message: err.message || "Failed to load workflows" });
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setFormData({
      name: "",
      type: "offer",
      description: "",
      steps: [
        { order: 1, role: "hiring-manager", stepName: "Hiring Manager Review", isRequired: true },
        { order: 2, role: "hr", stepName: "HR Signoff", isRequired: true },
      ],
    });
    setCreateModalOpen(true);
  }

  function openEditModal(wf) {
    setSelectedWorkflow(wf);
    setFormData({
      name: wf.name,
      type: wf.type,
      description: wf.description || "",
      isActive: wf.isActive,
      steps: wf.steps?.length > 0 ? [...wf.steps] : [{ order: 1, role: "admin", stepName: "Admin Signoff", isRequired: true }],
    });
    setEditModalOpen(true);
  }

  function openDeleteModal(wf) {
    setSelectedWorkflow(wf);
    setDeleteModalOpen(true);
  }

  // Steps handling inside modal
  function handleAddStep() {
    setFormData((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          order: prev.steps.length + 1,
          role: "hr",
          stepName: `Step ${prev.steps.length + 1}`,
          isRequired: true,
        },
      ],
    }));
  }

  function handleRemoveStep(index) {
    if (formData.steps.length <= 1) return;
    setFormData((prev) => {
      const updated = prev.steps.filter((_, idx) => idx !== index);
      return {
        ...prev,
        steps: updated.map((s, idx) => ({ ...s, order: idx + 1 })),
      };
    });
  }

  function handleStepChange(index, field, value) {
    setFormData((prev) => {
      const updated = [...prev.steps];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, steps: updated };
    });
  }

  async function handleCreateWorkflow(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createWorkflow(formData);
      setAlert({ type: "success", message: `Workflow "${formData.name}" created successfully!` });
      setCreateModalOpen(false);
      loadWorkflows();
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateWorkflow(e) {
    e.preventDefault();
    if (!selectedWorkflow) return;
    setSubmitting(true);
    try {
      await updateWorkflow(selectedWorkflow._id, {
        name: formData.name,
        description: formData.description,
        steps: formData.steps,
      });
      setAlert({ type: "success", message: `Workflow "${formData.name}" updated successfully!` });
      setEditModalOpen(false);
      loadWorkflows();
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(wf) {
    try {
      await updateWorkflow(wf._id, { isActive: !wf.isActive });
      setAlert({
        type: "success",
        message: `Workflow "${wf.name}" is now ${!wf.isActive ? "Active" : "Inactive"}.`,
      });
      loadWorkflows();
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    }
  }

  async function handleDeleteConfirm() {
    if (!selectedWorkflow) return;
    setSubmitting(true);
    try {
      await deleteWorkflow(selectedWorkflow._id);
      setAlert({ type: "success", message: `Workflow "${selectedWorkflow.name}" deleted successfully.` });
      setDeleteModalOpen(false);
      loadWorkflows();
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
          <span style={{ color: "#0f172a", fontWeight: "600" }}>Approval Workflows</span>
        </div>

        <div className="admin-header-title-row">
          <h1 className="admin-page-title">Approval Workflow Chains</h1>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={openCreateModal}
          >
            <Plus size={16} />
            <span>Create Workflow</span>
          </button>
        </div>

        <p className="admin-page-subtitle">
          Configure sequential approval chains for offers, letters, and resignation clearances with role-based routing.
        </p>
      </div>

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

      {/* Filter Bar */}
      <div className="admin-card" style={{ padding: "14px 20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Status Filter:</span>
            <select
              className="admin-select"
              style={{ width: "160px" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Workflows</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>

          <button
            type="button"
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={loadWorkflows}
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Workflows List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {workflows.length === 0 && !loading && (
          <div className="admin-card" style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
            <GitBranch size={36} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>No workflow configurations found.</p>
            <p style={{ margin: "4px 0 16px", fontSize: "12.5px" }}>Create your first sequential approval chain to start routing approvals.</p>
            <button type="button" className="admin-btn admin-btn-primary admin-btn-sm" onClick={openCreateModal}>
              Create Workflow
            </button>
          </div>
        )}

        {workflows.map((wf) => (
          <div key={wf._id} className="admin-card" style={{ margin: 0 }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>{wf.name}</h3>
                  <span className="admin-badge badge-blue" style={{ textTransform: "uppercase" }}>
                    {wf.type}
                  </span>
                  <StatusBadge active={wf.isActive} />
                </div>
                <div style={{ fontSize: "13px", color: "#64748b" }}>
                  {wf.description || "No description provided."}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  onClick={() => openEditModal(wf)}
                >
                  <Edit2 size={13} />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  onClick={() => handleToggleActive(wf)}
                >
                  <Power size={13} />
                  <span>{wf.isActive ? "Deactivate" : "Activate"}</span>
                </button>

                <button
                  type="button"
                  className="admin-btn admin-btn-danger admin-btn-sm"
                  onClick={() => openDeleteModal(wf)}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Sequential Steps Visual Chain */}
            <div
              style={{
                background: "#f8fafc",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                padding: "16px",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "12px" }}>
                Sequential Approval Pipeline ({wf.steps?.length || 0} Steps)
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                {wf.steps?.sort((a, b) => a.order - b.order).map((step, idx) => (
                  <React.Fragment key={idx}>
                    <div
                      style={{
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        minWidth: "170px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "#2563eb" }}>
                          STEP {step.order}
                        </span>
                        {step.isRequired && (
                          <span style={{ fontSize: "10px", background: "#fef3c7", color: "#92400e", padding: "1px 5px", borderRadius: "4px" }}>
                            Required
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: "600", fontSize: "13px", color: "#0f172a" }}>
                        {step.stepName}
                      </div>
                      <div style={{ marginTop: "6px" }}>
                        <RoleBadge role={step.role} />
                      </div>
                    </div>

                    {idx < wf.steps.length - 1 && (
                      <ArrowRight size={18} style={{ color: "#94a3b8", flexShrink: 0 }} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE WORKFLOW MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Approval Workflow"
        size="lg"
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
              form="create-wf-form"
              className="admin-btn admin-btn-primary"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Create Workflow"}
            </button>
          </>
        }
      >
        <form id="create-wf-form" onSubmit={handleCreateWorkflow}>
          <div className="admin-form-group">
            <label className="admin-form-label">Workflow Name *</label>
            <input
              type="text"
              required
              className="admin-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Standard Offer Approval Pipeline"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Document Type *</label>
            <select
              className="admin-select"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              {WORKFLOW_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <div className="admin-form-hint">
              Each document type can have one active configured workflow chain.
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Description</label>
            <textarea
              className="admin-textarea"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide context on when this approval workflow triggers..."
            />
          </div>

          {/* Step Builder */}
          <div style={{ marginTop: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <label className="admin-form-label" style={{ margin: 0 }}>
                Sequential Steps Configuration ({formData.steps.length})
              </label>
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-btn-sm"
                onClick={handleAddStep}
              >
                <Plus size={13} />
                <span>Add Step</span>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {formData.steps.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "10px 14px",
                  }}
                >
                  <span style={{ fontWeight: "700", color: "#2563eb", fontSize: "12px", width: "45px" }}>
                    #{step.order}
                  </span>

                  <input
                    type="text"
                    required
                    className="admin-input"
                    style={{ flex: 1 }}
                    value={step.stepName}
                    onChange={(e) => handleStepChange(idx, "stepName", e.target.value)}
                    placeholder="Step Name (e.g. Finance Clearance)"
                  />

                  <select
                    className="admin-select"
                    style={{ width: "170px" }}
                    value={step.role}
                    onChange={(e) => handleStepChange(idx, "role", e.target.value)}
                  >
                    {APPROVER_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>

                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={step.isRequired}
                      onChange={(e) => handleStepChange(idx, "isRequired", e.target.checked)}
                    />
                    Required
                  </label>

                  {formData.steps.length > 1 && (
                    <button
                      type="button"
                      className="admin-btn admin-btn-danger admin-btn-sm"
                      onClick={() => handleRemoveStep(idx)}
                      title="Remove step"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* EDIT WORKFLOW MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Workflow: ${selectedWorkflow?.name}`}
        size="lg"
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
              form="edit-wf-form"
              className="admin-btn admin-btn-primary"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </>
        }
      >
        <form id="edit-wf-form" onSubmit={handleUpdateWorkflow}>
          <div className="admin-form-group">
            <label className="admin-form-label">Workflow Name *</label>
            <input
              type="text"
              required
              className="admin-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Description</label>
            <textarea
              className="admin-textarea"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Steps */}
          <div style={{ marginTop: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <label className="admin-form-label" style={{ margin: 0 }}>
                Approval Steps Configuration
              </label>
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-btn-sm"
                onClick={handleAddStep}
              >
                <Plus size={13} />
                <span>Add Step</span>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {formData.steps.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "10px 14px",
                  }}
                >
                  <span style={{ fontWeight: "700", color: "#2563eb", fontSize: "12px", width: "45px" }}>
                    #{step.order}
                  </span>

                  <input
                    type="text"
                    required
                    className="admin-input"
                    style={{ flex: 1 }}
                    value={step.stepName}
                    onChange={(e) => handleStepChange(idx, "stepName", e.target.value)}
                  />

                  <select
                    className="admin-select"
                    style={{ width: "170px" }}
                    value={step.role}
                    onChange={(e) => handleStepChange(idx, "role", e.target.value)}
                  >
                    {APPROVER_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>

                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={step.isRequired}
                      onChange={(e) => handleStepChange(idx, "isRequired", e.target.checked)}
                    />
                    Required
                  </label>

                  {formData.steps.length > 1 && (
                    <button
                      type="button"
                      className="admin-btn admin-btn-danger admin-btn-sm"
                      onClick={() => handleRemoveStep(idx)}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Workflow Deletion"
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
              {submitting ? "Deleting..." : "Delete Workflow"}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", gap: "12px" }}>
          <AlertCircle size={24} style={{ color: "#dc2626", flexShrink: 0 }} />
          <div>
            <p style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>
              Are you sure you want to delete workflow "{selectedWorkflow?.name}"?
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
              Note: Workflows with active pending approvals cannot be deleted. Deleting this will prevent new documents of this type from automatically triggering this approval chain.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
