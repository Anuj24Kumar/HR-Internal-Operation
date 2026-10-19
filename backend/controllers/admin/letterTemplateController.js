const { LetterTemplate, Letter, Offer } = require("../../models");
const { recordAuditLog } = require("../../utils/auditLogger");

/**
 * Helper to extract {{placeholder}} tokens from HTML content
 */
const extractPlaceholders = (html) => {
  if (!html) return [];
  const matches = html.match(/\{\{([a-zA-Z0-9_]+)\}\}/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, "").trim())));
};

/**
 * 1. List all active/inactive letter templates with type and placeholder info
 * GET /api/admin/letter-templates
 */
const getAllLetterTemplates = async (req, res) => {
  try {
    const { type, isActive } = req.query;
    const query = {};

    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === "true";

    const templates = await LetterTemplate.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: templates.length,
      templates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve letter templates",
      error: error.message,
    });
  }
};

/**
 * 2. Create a new HTML template with {{placeholder}} tokens
 * POST /api/admin/letter-templates
 */
const createLetterTemplate = async (req, res) => {
  try {
    const { name, type, htmlContent, placeholders } = req.body;

    if (!name || !type || !htmlContent) {
      return res.status(400).json({
        success: false,
        message: "Name, type, and htmlContent are required",
      });
    }

    // Auto-extract placeholders if not explicitly supplied
    const tokens =
      placeholders && Array.isArray(placeholders) && placeholders.length > 0
        ? placeholders
        : extractPlaceholders(htmlContent);

    const template = await LetterTemplate.create({
      name: name.trim(),
      type,
      htmlContent,
      placeholders: tokens,
      version: 1,
      isActive: true,
    });

    await recordAuditLog({
      userId: req.user ? req.user._id : null,
      action: "create",
      module: "letter_templates",
      entityId: template._id,
      newValue: template.toObject(),
    });

    res.status(201).json({
      success: true,
      message: "Letter template created successfully",
      template,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create letter template",
      error: error.message,
    });
  }
};

/**
 * 3. Get full template HTML content and placeholder list
 * GET /api/admin/letter-templates/:id
 */
const getLetterTemplateById = async (req, res) => {
  try {
    const template = await LetterTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Letter template not found",
      });
    }

    res.status(200).json({
      success: true,
      template,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve letter template",
      error: error.message,
    });
  }
};

/**
 * 4. Edit template HTML, name, type, or placeholder list (auto-increments version)
 * PATCH /api/admin/letter-templates/:id
 */
const updateLetterTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, htmlContent, placeholders } = req.body;

    const template = await LetterTemplate.findById(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Letter template not found",
      });
    }

    const oldValue = template.toObject();

    if (name) template.name = name.trim();
    if (type) template.type = type;

    if (htmlContent) {
      template.htmlContent = htmlContent;
      template.placeholders =
        placeholders && Array.isArray(placeholders) && placeholders.length > 0
          ? placeholders
          : extractPlaceholders(htmlContent);
    } else if (placeholders && Array.isArray(placeholders)) {
      template.placeholders = placeholders;
    }

    // Auto-increment version on edit
    template.version = (template.version || 1) + 1;

    await template.save();

    await recordAuditLog({
      userId: req.user ? req.user._id : null,
      action: "update",
      module: "letter_templates",
      entityId: template._id,
      oldValue,
      newValue: template.toObject(),
    });

    res.status(200).json({
      success: true,
      message: `Letter template updated to version ${template.version}`,
      template,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update letter template",
      error: error.message,
    });
  }
};

/**
 * 5. Soft-deactivate template (hides from HR generator, retains generated letters)
 * PATCH /api/admin/letter-templates/:id/deactivate
 */
const deactivateLetterTemplate = async (req, res) => {
  try {
    const template = await LetterTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Letter template not found",
      });
    }

    if (!template.isActive) {
      return res.status(200).json({
        success: true,
        message: "Template is already deactivated",
        template,
      });
    }

    template.isActive = false;
    await template.save();

    await recordAuditLog({
      userId: req.user ? req.user._id : null,
      action: "update",
      module: "letter_templates",
      entityId: template._id,
      oldValue: { isActive: true },
      newValue: { isActive: false },
    });

    res.status(200).json({
      success: true,
      message: "Letter template deactivated successfully",
      template,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to deactivate letter template",
      error: error.message,
    });
  }
};

/**
 * 6. Delete template (only if no letters or offers have been generated from it)
 * DELETE /api/admin/letter-templates/:id
 */
const deleteLetterTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await LetterTemplate.findById(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Letter template not found",
      });
    }

    // Check if letters or offers exist with this template
    const letterCount = await Letter.countDocuments({ templateId: id });
    const offerCount = await Offer.countDocuments({ templateId: id });

    if (letterCount > 0 || offerCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete template. Found ${letterCount} letter(s) and ${offerCount} offer(s) generated with this template. Deactivate it instead.`,
      });
    }

    const deletedData = template.toObject();
    await LetterTemplate.findByIdAndDelete(id);

    await recordAuditLog({
      userId: req.user ? req.user._id : null,
      action: "delete",
      module: "letter_templates",
      entityId: id,
      oldValue: deletedData,
      newValue: null,
    });

    res.status(200).json({
      success: true,
      message: "Letter template deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete letter template",
      error: error.message,
    });
  }
};

module.exports = {
  getAllLetterTemplates,
  createLetterTemplate,
  getLetterTemplateById,
  updateLetterTemplate,
  deactivateLetterTemplate,
  deleteLetterTemplate,
};
