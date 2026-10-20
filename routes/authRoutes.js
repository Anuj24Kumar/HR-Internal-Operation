const express = require("express");
const router = express.Router();
const { login, getMe, seedInitialData } = require("../controllers/authController");
const { verifyToken } = require("../middlewares/authMiddleware");

// Public routes
router.post("/login", login);
router.post("/seed", seedInitialData);

// Protected route
router.get("/me", verifyToken, getMe);

module.exports = router;
