const express = require("express");
const {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  getAdminData,
  seedInitialData,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/seed", seedInitialData);
router.get("/me", protect, getMe);
router.post("/logout", protect, logoutUser);
router.get(
  "/test-admin",
  protect,
  authorizeRoles("admin", "hr"),
  getAdminData
);

module.exports = router;
