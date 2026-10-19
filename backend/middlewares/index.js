const { verifyToken } = require("./authMiddleware");
const {
  requireRole,
  requireAdmin,
  requireHR,
  requireHiringManager,
  requireInterviewer,
  requireEmployeeOrIntern,
} = require("./roleMiddleware");
const { recordAuditLog, auditRoute } = require("./auditMiddleware");

module.exports = {
  verifyToken,
  requireRole,
  requireAdmin,
  requireHR,
  requireHiringManager,
  requireInterviewer,
  requireEmployeeOrIntern,
  recordAuditLog,
  auditRoute,
};
