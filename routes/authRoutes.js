const express = require("express");
const router = express.Router();



const {
  registerUser,
  loginUser,
  getMe,
  getAdminData,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const { authorizeRoles } = require("../middleware/roleMiddleware");

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Protected route
router.get("/me", protect, getMe);

// Admin and HR only
router.get(
  "/test-admin",
  protect,
  authorizeRoles("admin", "hr"),
  getAdminData
);

module.exports = router;