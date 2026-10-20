const { AuditLog } = require("../models");

/**
 * Direct helper to record an immutable audit log entry in MongoDB
 *
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} [params.userId] - User performing the action
 * @param {"create"|"update"|"delete"|"approve"|"role_change"} params.action - Action type
 * @param {string} params.module - Target module (e.g. 'users', 'workflows', 'letter_templates')
 * @param {string|mongoose.Types.ObjectId} [params.entityId] - Affected record ID
 * @param {any} [params.oldValue] - State prior to mutation
 * @param {any} [params.newValue] - State post mutation
 */
const recordAuditLog = async ({
  userId,
  action,
  module: mod,
  entityId,
  oldValue = null,
  newValue = null,
}) => {
  try {
    await AuditLog.create({
      userId: userId || null,
      action,
      module: mod,
      entityId: entityId || null,
      oldValue,
      newValue,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("Failed to write audit log:", err.message);
  }
};

/**
 * Route-level middleware to automatically log successful mutation responses
 *
 * Usage: router.delete('/users/:id', auditRoute('users', 'delete'), deleteUser);
 *
 * @param {string} moduleName - Module name for the audit log
 * @param {"create"|"update"|"delete"|"approve"|"role_change"} actionType - Action category
 */
const auditRoute = (moduleName, actionType) => {
  return (req, res, next) => {
    // Listen for response completion
    res.on("finish", async () => {
      // Only log successful mutation HTTP status codes (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entityId = req.params.id || req.body._id || null;
        await recordAuditLog({
          userId: req.user ? req.user._id : null,
          action: actionType,
          module: moduleName,
          entityId,
          oldValue: req.auditOldValue || null,
          newValue: req.auditNewValue || (actionType === "delete" ? null : req.body),
        });
      }
    });

    next();
  };
};

module.exports = {
  recordAuditLog,
  auditRoute,
};
