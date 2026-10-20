const express = require("express");
const {
  registerUser,
  loginUser,
  getMe,
  getAdminData,
  seedInitialData,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/seed", seedInitialData);
router.get("/me", protect, getMe);
router.get(
  "/test-admin",
  protect,
  authorizeRoles("admin", "hr"),
  getAdminData
);

module.exports = router;
