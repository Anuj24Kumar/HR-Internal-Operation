const jwt = require("jsonwebtoken");
const { User } = require("../models");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret_jwt_key_hr_platform_dev";

/**
 * Middleware to verify JWT authentication token and attach authenticated user to req.user
 */
const verifyToken = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // In development mode, allow optional bypass header for testing convenience
    if (!token && process.env.NODE_ENV !== "production" && req.headers["x-dev-admin"] === "true") {
      let devAdmin = await User.findOne({ role: "admin", isActive: true });
      if (!devAdmin) {
        devAdmin = {
          _id: "000000000000000000000001",
          name: "Dev Admin",
          role: "admin",
          email: "admin@example.com",
          isActive: true,
        };
      }
      req.user = devAdmin;
      return next();
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No authentication token provided.",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. User no longer exists.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact an administrator.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please log in again.",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Invalid authentication token.",
      error: error.message,
    });
  }
};

module.exports = {
  verifyToken,
};
