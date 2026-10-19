const { Workflow, ApprovalRequest } = require("../../models");
const { recordAuditLog } = require("../../utils/auditLogger");

/**
 * 1. List all configured approval workflow chains
 * GET /api/admin/workflows
 */
const getAllWorkflows = async (req, res) => {
  try {
    const { isActive } = req.query;
    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const workflows = await Workflow.find(query)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: workflows.length,
      workflows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve workflows",
      error: error.message,
    });
  }
};

/**
 * 2. Create a new approval chain for a document type (offer/letter/exit)
 * POST /api/admin/workflows
 */
const createWorkflow = async (req, res) => {
  try {
    const { name, type, description, steps } = req.body;

    if (!name || !type || !steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Name, type ('offer', 'letter', 'exit'), and at least one step are required",
      });
    }

    const existingWorkflow = await Workflow.findOne({ type });
    if (existingWorkflow) {
      return res.status(400).json({
        success: false,
        message: `A workflow configuration for type '${type}' already exists. Update the existing workflow instead.`,
      });
    }

    // Sort and validate steps order
    const formattedSteps = steps.map((step, idx) => ({
      order: step.order || idx + 1,
      role: step.role,
      stepName: step.stepName || `Step ${idx + 1}`,
      isRequired: step.isRequired !== undefined ? step.isRequired : true,
    }));

    const workflow = await Workflow.create({
      name: name.trim(),
      type,
      description: description || "",
      steps: formattedSteps,
      isActive: true,
      createdBy: req.user ? req.user._id : null,
    });

    await recordAuditLog({
      userId: req.user ? req.user._id : null,
      action: "create",
      module: "workflows",
      entityId: workflow._id,
      newValue: workflow,
    });

    res.status(201).json({
      success: true,
      message: "Workflow created successfully",
      workflow,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create workflow",
      error: error.message,
    });
  }
};

/**
 * 3. Get full step-by-step config for a specific workflow
 * GET /api/admin/workflows/:id
 */
const getWorkflowById = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: "Workflow not found",
      });
    }

    res.status(200).json({
      success: true,
      workflow,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve workflow",
      error: error.message,
    });
  }
};

/**
 * 4. Fetch active workflow config by type (offer, letter, exit)
 * GET /api/admin/workflows/type/:type
 */
const getWorkflowByType = async (req, res) => {
  try {
    const { type } = req.params;
    const workflow = await Workflow.findOne({ type, isActive: true }).populate(
      "createdBy",
      "name email"
    );

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: `No active workflow configuration found for type '${type}'`,
      });
    }

    res.status(200).json({
      success: true,
      workflow,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve workflow by type",
      error: error.message,
    });
  }
};

/**
 * 5. Update step order, add/remove steps, or change approver roles
 * PATCH /api/admin/workflows/:id
 */
const updateWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, steps, isActive } = req.body;

    const workflow = await Workflow.findById(id);
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: "Workflow not found",
      });
    }

    const oldValue = workflow.toObject();

    if (name) workflow.name = name.trim();
    if (description !== undefined) workflow.description = description;
    if (isActive !== undefined) workflow.isActive = Boolean(isActive);

    if (steps && Array.isArray(steps)) {
      if (steps.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Workflow must have at least one step",
        });
      }
      workflow.steps = steps.map((step, idx) => ({
        order: step.order || idx + 1,
        role: step.role,
        stepName: step.stepName || `Step ${idx + 1}`,
        isRequired: step.isRequired !== undefined ? step.isRequired : true,
      }));
    }

    await workflow.save();

    await recordAuditLog({
      userId: req.user ? req.user._id : null,
      action: "update",
      module: "workflows",
      entityId: workflow._id,
      oldValue,
      newValue: workflow.toObject(),
    });

    res.status(200).json({
      success: true,
      message: "Workflow updated successfully",
      workflow,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update workflow",
      error: error.message,
    });
  }
};

/**
 * 6. Delete a workflow config
 * Critical Guard: Only if no pending approvals exist on it
 * DELETE /api/admin/workflows/:id
 */
const deleteWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: "Workflow not found",
      });
    }

    // Check if any pending approvals are using this workflow's entityType
    const pendingApprovalsCount = await ApprovalRequest.countDocuments({
      entityType: workflow.type,
      status: "pending",
    });

    if (pendingApprovalsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete workflow. There are ${pendingApprovalsCount} pending approval request(s) currently active for '${workflow.type}' documents.`,
      });
    }

    const deletedData = workflow.toObject();
    await Workflow.findByIdAndDelete(req.params.id);

    await recordAuditLog({
      userId: req.user ? req.user._id : null,
      action: "delete",
      module: "workflows",
      entityId: req.params.id,
      oldValue: deletedData,
      newValue: null,
    });

    res.status(200).json({
      success: true,
      message: "Workflow configuration deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete workflow",
      error: error.message,
    });
  }
};

module.exports = {
  getAllWorkflows,
  createWorkflow,
  getWorkflowById,
  getWorkflowByType,
  updateWorkflow,
  deleteWorkflow,
};
