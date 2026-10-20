const createRoleGuard = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to access this resource",
    });
  }

  return next();
};

const authorizeRoles = (...allowedRoles) => createRoleGuard(...allowedRoles);
const authorize = (...allowedRoles) => createRoleGuard(...allowedRoles);

module.exports = { authorizeRoles, authorize };
