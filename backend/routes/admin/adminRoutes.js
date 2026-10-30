const express = require("express");
const router = express.Router();

const { verifyToken } = require("../../middleware/authMiddleware");
const requireAdmin = require("../../middleware/admin/requireAdmin");

// Separate controllers in admin folder
const userController = require("../../controllers/admin/userController");
const workflowController = require("../../controllers/admin/workflowController");
const letterTemplateController = require("../../controllers/admin/letterTemplateController");
const auditController = require("../../controllers/admin/auditController");
const dashboardController = require("../../controllers/admin/dashboardController");
const searchController = require("../../controllers/admin/searchController");

// Health check endpoint (Public)
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Admin API router is active and operational",
  });
});

// Protect all following admin routes with authentication and role check
router.use(verifyToken, requireAdmin);

// ==========================================
// 1. Users & Role Management
// ==========================================
router.get("/users", userController.getAllUsers);
router.post("/users", userController.createUser);
router.get("/users/:id", userController.getUserById);
router.patch("/users/:id", userController.updateUser);
router.patch("/users/:id/activate", userController.activateUser);
router.patch("/users/:id/deactivate", userController.deactivateUser);
router.delete("/users/:id", userController.deleteUser);

// ==========================================
// 2. Approval Workflow Configuration
// ==========================================
router.get("/workflows", workflowController.getAllWorkflows);
router.post("/workflows", workflowController.createWorkflow);
router.get("/workflows/type/:type", workflowController.getWorkflowByType);
router.get("/workflows/:id", workflowController.getWorkflowById);
router.patch("/workflows/:id", workflowController.updateWorkflow);
router.delete("/workflows/:id", workflowController.deleteWorkflow);

// ==========================================
// 3. Letter Template Management
// ==========================================
router.get("/letter-templates", letterTemplateController.getAllLetterTemplates);
router.get("/templates", letterTemplateController.getAllLetterTemplates);
router.post("/letter-templates", letterTemplateController.createLetterTemplate);
router.post("/templates", letterTemplateController.createLetterTemplate);
router.get("/letter-templates/:id", letterTemplateController.getLetterTemplateById);
router.get("/templates/:id", letterTemplateController.getLetterTemplateById);
router.patch("/letter-templates/:id", letterTemplateController.updateLetterTemplate);
router.patch("/templates/:id", letterTemplateController.updateLetterTemplate);
router.patch("/letter-templates/:id/deactivate", letterTemplateController.deactivateLetterTemplate);
router.patch("/templates/:id/deactivate", letterTemplateController.deactivateLetterTemplate);
router.delete("/letter-templates/:id", letterTemplateController.deleteLetterTemplate);
router.delete("/templates/:id", letterTemplateController.deleteLetterTemplate);

// ==========================================
// 4. Audit Log (Read-only)
// ==========================================
router.get("/audit", auditController.getAuditLogs);
router.get("/audit-logs", auditController.getAuditLogs);
router.get("/audit/export", auditController.exportAuditLogs);
router.get("/audit-logs/export", auditController.exportAuditLogs);
router.get("/audit/:id", auditController.getAuditLogById);
router.get("/audit-logs/:id", auditController.getAuditLogById);

// ==========================================
// 5. Admin Dashboard
// ==========================================
router.get("/dashboard", dashboardController.getAdminDashboard);
router.get("/dashboard/admin", dashboardController.getAdminDashboard);
router.get("/dashboard/pipeline", dashboardController.getPipelineDistribution);
router.get("/dashboard/admin/pipeline", dashboardController.getPipelineDistribution);

// ==========================================
// 6. Global Search & Export
// ==========================================
router.get("/search", searchController.globalSearch);
router.get("/search/export", searchController.exportSearchResults);

module.exports = router;
