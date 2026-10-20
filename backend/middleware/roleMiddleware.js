const createRoleGuard = (allowedRoles, unauthenticatedMessage, forbiddenMessage) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: unauthenticatedMessage,
    });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: forbiddenMessage(req.user.role, allowedRoles),
    });
  }

  return next();
};

const requireRole = (allowedRoles = []) =>
  createRoleGuard(
    allowedRoles,
    "Authentication required before role verification.",
    (role, roles) =>
      `Forbidden. Role '${role}' is not authorized to perform this action. Required role(s): [${roles.join(", ")}].`
  );
const authorizeRoles = (...allowedRoles) =>
  createRoleGuard(
    allowedRoles,
    "Authentication required",
    () => "You do not have permission to access this resource"
  );
const authorize = (...allowedRoles) =>
  createRoleGuard(
    allowedRoles,
    "Authentication required",
    () => "You do not have permission to access this resource"
  );

const requireAdmin = requireRole(["admin"]);
const requireHR = requireRole(["admin", "hr"]);
const requireHiringManager = requireRole(["admin", "hr", "hiring_manager"]);
const requireInterviewer = requireRole(["admin", "hr", "interviewer"]);
const requireEmployeeOrIntern = requireRole(["admin", "hr", "employee", "intern"]);

module.exports = {
  authorizeRoles,
  authorize,
  requireRole,
  requireAdmin,
  requireHR,
  requireHiringManager,
  requireInterviewer,
  requireEmployeeOrIntern,
};
