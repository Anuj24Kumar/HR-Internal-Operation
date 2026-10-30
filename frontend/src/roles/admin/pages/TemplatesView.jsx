import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Power,
  Eye,
  CheckCircle,
  AlertCircle,
  Code,
  Tag,
  RefreshCw,
  Copy,
} from "lucide-react";
import {
  fetchLetterTemplates,
  fetchLetterTemplateById,
  createLetterTemplate,
  updateLetterTemplate,
  deactivateLetterTemplate,
  deleteLetterTemplate,
} from "../adminApi.js";
import { StatusBadge } from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";

const TEMPLATE_TYPES = [
  { value: "offer", label: "Offer Letter (offer)" },
  { value: "appointment", label: "Appointment Letter (appointment)" },
  { value: "internship_offer", label: "Internship Offer (internship_offer)" },
  { value: "relieving", label: "Relieving Letter (relieving)" },
  { value: "experience", label: "Experience Certificate (experience)" },
  { value: "custom", label: "Custom Document (custom)" },
];

const SUGGESTED_TOKENS = [
  "candidate_name",
  "employee_name",
  "designation",
  "department",
  "salary",
  "joining_date",
  "manager_name",
  "company_name",
  "issue_date",
];

const DEFAULT_SAMPLE_HTML = `<div style="font-family: Arial, sans-serif; padding: 30px; line-height: 1.6; color: #1e293b;">
  <h2 style="color: #1e40af; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">PeopleOps Enterprise Offer Letter</h2>
  <p>Date: {{issue_date}}</p>
  <p>Dear <strong>{{candidate_name}}</strong>,</p>
  <p>We are delighted to offer you the position of <strong>{{designation}}</strong> in the <strong>{{department}}</strong> department at {{company_name}}.</p>
  <p>Your annual cost-to-company (CTC) will be <strong>{{salary}}</strong>. Your anticipated date of joining will be <strong>{{joining_date}}</strong>.</p>
  <p>Please review and sign this offer letter within 5 working days.</p>
  <br/>
  <p>Warm regards,<br/><strong>Human Resources Team</strong><br/>{{company_name}}</p>
</div>`;

export default function TemplatesView() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    type: "offer",
    htmlContent: DEFAULT_SAMPLE_HTML,
    placeholders: [],
  });

  // Tab inside editor: 'code' or 'preview'
  const [editorTab, setEditorTab] = useState("code");

  useEffect(() => {
    loadTemplates();
  }, [typeFilter, statusFilter]);

  async function loadTemplates() {
    setLoading(true);
    setAlert(null);
    try {
      const res = await fetchLetterTemplates({
        type: typeFilter,
        isActive: statusFilter,
      });
      setTemplates(res.templates || []);
    } catch (err) {
      setAlert({ type: "error", message: err.message || "Failed to load templates" });
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setFormData({
      name: "",
      type: "offer",
      htmlContent: DEFAULT_SAMPLE_HTML,
      placeholders: [],
    });
    setEditorTab("code");
    setCreateModalOpen(true);
  }

  function openEditModal(template) {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      htmlContent: template.htmlContent,
      placeholders: template.placeholders || [],
    });
    setEditorTab("code");
    setEditModalOpen(true);
  }

  function openPreviewModal(template) {
    setSelectedTemplate(template);
    setPreviewModalOpen(true);
  }

  function openDeleteModal(template) {
    setSelectedTemplate(template);
    setDeleteModalOpen(true);
  }

  function insertToken(token) {
    const tokenStr = `{{${token}}}`;
    setFormData((prev) => ({
      ...prev,
      htmlContent: prev.htmlContent + " " + tokenStr,
    }));
  }

  async function handleCreateTemplate(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createLetterTemplate(formData);
      setAlert({ type: "success", message: `Template "${formData.name}" created successfully!` });
      setCreateModalOpen(false);
      loadTemplates();
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateTemplate(e) {
    e.preventDefault();
    if (!selectedTemplate) return;
    setSubmitting(true);
    try {
      const res = await updateLetterTemplate(selectedTemplate._id, {
        name: formData.name,
        type: formData.type,
        htmlContent: formData.htmlContent,
      });
      setAlert({
        type: "success",
        message: `Template updated to version ${res.template?.version || selectedTemplate.version + 1}!`,
      });
      setEditModalOpen(false);
      loadTemplates();
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate(template) {
    try {
      await deactivateLetterTemplate(template._id);
      setAlert({ type: "success", message: `Template "${template.name}" deactivated.` });
      loadTemplates();
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    }
  }

  async function handleDeleteConfirm() {
    if (!selectedTemplate) return;
    setSubmitting(true);
    try {
      await deleteLetterTemplate(selectedTemplate._id);
      setAlert({ type: "success", message: `Template "${selectedTemplate.name}" deleted successfully.` });
      setDeleteModalOpen(false);
      loadTemplates();
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  // Generate Dummy Sample HTML for preview
  function getRenderedPreviewHtml(html) {
    if (!html) return "<p>No content</p>";
    return html
      .replace(/\{\{candidate_name\}\}/g, "Alex Morgan")
      .replace(/\{\{employee_name\}\}/g, "Alex Morgan")
      .replace(/\{\{designation\}\}/g, "Senior Software Engineer")
      .replace(/\{\{department\}\}/g, "Engineering")
      .replace(/\{\{salary\}\}/g, "₹ 18,50,000 PA")
      .replace(/\{\{joining_date\}\}/g, "15th November 2026")
      .replace(/\{\{company_name\}\}/g, "Acme Corporation")
      .replace(/\{\{issue_date\}\}/g, new Date().toLocaleDateString())
      .replace(/\{\{manager_name\}\}/g, "James Davis");
  }

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="admin-page-header">
        <div className="admin-breadcrumbs">
          <span>Workspace</span>
          <span>&gt;</span>
          <span style={{ color: "#0f172a", fontWeight: "600" }}>Templates</span>
        </div>

        <div className="admin-header-title-row">
          <h1 className="admin-page-title">Letter & Offer Templates</h1>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={openCreateModal}
          >
            <Plus size={16} />
            <span>Create Template</span>
          </button>
        </div>

        <p className="admin-page-subtitle">
          Manage dynamic document templates with auto-extracted `{"{{token}}"}` placeholders and version history.
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
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ width: "200px" }}>
            <select
              className="admin-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Document Types</option>
              {TEMPLATE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ width: "160px" }}>
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
              setTypeFilter("");
              setStatusFilter("");
              loadTemplates();
            }}
          >
            <RefreshCw size={13} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
          gap: "18px",
        }}
      >
        {templates.length === 0 && !loading && (
          <div
            className="admin-card"
            style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#94a3b8" }}
          >
            <FileText size={40} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: "15px", fontWeight: "600" }}>No letter templates found.</p>
            <p style={{ margin: "4px 0 16px", fontSize: "13px" }}>Create your first HTML template with variable placeholders.</p>
            <button type="button" className="admin-btn admin-btn-primary admin-btn-sm" onClick={openCreateModal}>
              Create Template
            </button>
          </div>
        )}

        {templates.map((tpl) => (
          <div
            key={tpl._id}
            className="admin-card"
            style={{
              margin: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                    {tpl.name}
                  </h3>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span className="admin-badge badge-blue">{tpl.type}</span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "#475569",
                        background: "#f1f5f9",
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      v{tpl.version || 1}
                    </span>
                    <StatusBadge active={tpl.isActive} />
                  </div>
                </div>
              </div>

              {/* Tokens Preview */}
              <div style={{ marginTop: "14px" }}>
                <div style={{ fontSize: "11.5px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>
                  Placeholders ({tpl.placeholders?.length || 0}):
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                  {tpl.placeholders?.length > 0 ? (
                    tpl.placeholders.map((p, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: "11px",
                          fontFamily: "monospace",
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #bfdbfe",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        {`{{${p}}}`}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>No placeholders detected</span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div
              style={{
                marginTop: "20px",
                paddingTop: "14px",
                borderTop: "1px solid #f1f5f9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-btn-sm"
                onClick={() => openPreviewModal(tpl)}
              >
                <Eye size={13} />
                <span>Preview</span>
              </button>

              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  onClick={() => openEditModal(tpl)}
                  title="Edit template HTML"
                >
                  <Edit2 size={13} />
                </button>

                <button
                  type="button"
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  onClick={() => handleDeactivate(tpl)}
                  title="Deactivate template"
                >
                  <Power size={13} />
                </button>

                <button
                  type="button"
                  className="admin-btn admin-btn-danger admin-btn-sm"
                  onClick={() => openDeleteModal(tpl)}
                  title="Delete template"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE TEMPLATE MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Letter Template"
        size="xl"
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
              form="create-template-form"
              className="admin-btn admin-btn-primary"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save Template"}
            </button>
          </>
        }
      >
        <form id="create-template-form" onSubmit={handleCreateTemplate}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Template Name *</label>
              <input
                type="text"
                required
                className="admin-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Standard Full-time Offer Letter"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Template Type *</label>
              <select
                className="admin-select"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                {TEMPLATE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Insert Tokens Bar */}
          <div style={{ marginBottom: "12px", background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginRight: "8px" }}>
              Insert Placeholder Token:
            </span>
            <div style={{ display: "inline-flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
              {SUGGESTED_TOKENS.map((tok) => (
                <button
                  key={tok}
                  type="button"
                  onClick={() => insertToken(tok)}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  style={{ fontSize: "11px", padding: "2px 8px" }}
                >
                  +{`{{${tok}}}`}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Switcher */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            <button
              type="button"
              className={`admin-btn admin-btn-sm ${editorTab === "code" ? "admin-btn-primary" : "admin-btn-secondary"}`}
              onClick={() => setEditorTab("code")}
            >
              <Code size={13} />
              <span>HTML Source</span>
            </button>
            <button
              type="button"
              className={`admin-btn admin-btn-sm ${editorTab === "preview" ? "admin-btn-primary" : "admin-btn-secondary"}`}
              onClick={() => setEditorTab("preview")}
            >
              <Eye size={13} />
              <span>Live Sample Preview</span>
            </button>
          </div>

          {editorTab === "code" ? (
            <div className="admin-form-group">
              <textarea
                className="admin-textarea"
                rows={12}
                style={{ fontFamily: "monospace", fontSize: "12.5px" }}
                value={formData.htmlContent}
                onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                required
              />
            </div>
          ) : (
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "20px",
                background: "#ffffff",
                minHeight: "260px",
                maxHeight: "360px",
                overflowY: "auto",
              }}
              dangerouslySetInnerHTML={{ __html: getRenderedPreviewHtml(formData.htmlContent) }}
            />
          )}
        </form>
      </Modal>

      {/* EDIT TEMPLATE MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Template: ${selectedTemplate?.name} (Current: v${selectedTemplate?.version || 1})`}
        size="xl"
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
              form="edit-template-form"
              className="admin-btn admin-btn-primary"
              disabled={submitting}
            >
              {submitting ? "Saving..." : `Save & Increment to v${(selectedTemplate?.version || 1) + 1}`}
            </button>
          </>
        }
      >
        <form id="edit-template-form" onSubmit={handleUpdateTemplate}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Template Name *</label>
              <input
                type="text"
                required
                className="admin-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Template Type *</label>
              <select
                className="admin-select"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                {TEMPLATE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Tokens */}
          <div style={{ marginBottom: "12px", background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginRight: "8px" }}>
              Insert Placeholder Token:
            </span>
            <div style={{ display: "inline-flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
              {SUGGESTED_TOKENS.map((tok) => (
                <button
                  key={tok}
                  type="button"
                  onClick={() => insertToken(tok)}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  style={{ fontSize: "11px", padding: "2px 8px" }}
                >
                  +{`{{${tok}}}`}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            <button
              type="button"
              className={`admin-btn admin-btn-sm ${editorTab === "code" ? "admin-btn-primary" : "admin-btn-secondary"}`}
              onClick={() => setEditorTab("code")}
            >
              <Code size={13} />
              <span>HTML Source</span>
            </button>
            <button
              type="button"
              className={`admin-btn admin-btn-sm ${editorTab === "preview" ? "admin-btn-primary" : "admin-btn-secondary"}`}
              onClick={() => setEditorTab("preview")}
            >
              <Eye size={13} />
              <span>Live Sample Preview</span>
            </button>
          </div>

          {editorTab === "code" ? (
            <div className="admin-form-group">
              <textarea
                className="admin-textarea"
                rows={12}
                style={{ fontFamily: "monospace", fontSize: "12.5px" }}
                value={formData.htmlContent}
                onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                required
              />
            </div>
          ) : (
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "20px",
                background: "#ffffff",
                minHeight: "260px",
                maxHeight: "360px",
                overflowY: "auto",
              }}
              dangerouslySetInnerHTML={{ __html: getRenderedPreviewHtml(formData.htmlContent) }}
            />
          )}
        </form>
      </Modal>

      {/* PREVIEW MODAL */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title={`Template Preview: ${selectedTemplate?.name}`}
        size="lg"
        footer={
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => setPreviewModalOpen(false)}
          >
            Close
          </button>
        }
      >
        <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "24px", background: "#ffffff" }}>
          <div
            dangerouslySetInnerHTML={{
              __html: getRenderedPreviewHtml(selectedTemplate?.htmlContent),
            }}
          />
        </div>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Template Deletion"
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
              {submitting ? "Deleting..." : "Delete Template"}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", gap: "12px" }}>
          <AlertCircle size={24} style={{ color: "#dc2626", flexShrink: 0 }} />
          <div>
            <p style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>
              Are you sure you want to delete template "{selectedTemplate?.name}"?
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
              Safety check: If any letter or offer has been generated using this template, deletion will be blocked to preserve document integrity. You can deactivate it instead.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
