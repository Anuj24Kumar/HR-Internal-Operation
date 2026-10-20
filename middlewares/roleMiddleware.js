/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces role restrictions across platform endpoints.
 */

/**
 * Higher-order middleware to restrict access based on allowed roles
 * @param {string[]} allowedRoles - List of authorized role names
 */
const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required before role verification.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to perform this action. Required role(s): [${allowedRoles.join(", ")}].`,
      });
    }

    next();
  };
};

// Convenience role guards
const requireAdmin = requireRole(["admin"]);
const requireHR = requireRole(["admin", "hr"]);
const requireHiringManager = requireRole(["admin", "hr", "hiring_manager"]);
const requireInterviewer = requireRole(["admin", "hr", "interviewer"]);
const requireEmployeeOrIntern = requireRole(["admin", "hr", "employee", "intern"]);

module.exports = {
  requireRole,
  requireAdmin,
  requireHR,
  requireHiringManager,
  requireInterviewer,
  requireEmployeeOrIntern,
};
