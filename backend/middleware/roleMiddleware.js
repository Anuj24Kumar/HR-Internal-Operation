const normalizeRole = (r) => String(r || "").trim().toLowerCase().replace(/[- ]/g, "_");

const createRoleGuard = (allowedRoles, unauthenticatedMessage, forbiddenMessage) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: unauthenticatedMessage,
    });
  }

  const rawUserRole = req.user.role || (Array.isArray(req.user.roles) ? req.user.roles[0] : "");
  const userRole = normalizeRole(rawUserRole);

  // Admin always has universal access across all protected resources
  if (userRole === "admin") {
    return next();
  }

  // Flatten nested arrays if passed as authorize([...]) or authorize("...", "...")
  const rawAllowed = (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]).flat(Infinity);
  const normalizedAllowed = new Set(rawAllowed.map(normalizeRole));

  // Handle aliases: "hiring_manager" <-> "hm" <-> "hiringmanager"
  if (
    normalizedAllowed.has("hiring_manager") ||
    normalizedAllowed.has("hm") ||
    normalizedAllowed.has("hiringmanager")
  ) {
    normalizedAllowed.add("hiring_manager");
    normalizedAllowed.add("hm");
    normalizedAllowed.add("hiringmanager");
  }

  const isAllowed =
    normalizedAllowed.has(userRole) ||
    (userRole === "hiring_manager" && (normalizedAllowed.has("hm") || normalizedAllowed.has("hiringmanager"))) ||
    (userRole === "hm" && normalizedAllowed.has("hiring_manager")) ||
    (userRole === "hiringmanager" && normalizedAllowed.has("hiring_manager"));

  if (!isAllowed) {
    return res.status(403).json({
      success: false,
      message: forbiddenMessage(req.user.role, rawAllowed),
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
