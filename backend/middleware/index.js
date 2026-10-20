const { protect, verifyToken } = require("./authMiddleware");
const {
  authorize,
  authorizeRoles,
  requireRole,
  requireAdmin,
  requireHR,
  requireHiringManager,
  requireInterviewer,
  requireEmployeeOrIntern,
} = require("./roleMiddleware");
const { recordAuditLog, auditRoute } = require("./auditMiddleware");

module.exports = {
  protect,
  verifyToken,
  authorize,
  authorizeRoles,
  requireRole,
  requireAdmin,
  requireHR,
  requireHiringManager,
  requireInterviewer,
  requireEmployeeOrIntern,
  recordAuditLog,
  auditRoute,
};
