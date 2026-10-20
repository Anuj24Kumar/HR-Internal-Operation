
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const {
  getAllExits,
  createExit,
  getExitById,
  updateExitClearance,
    approveExit,
    generateExitLetters,
    completeExit
} = require("../controllers/exitController");

router.get(
  "/",
  protect,
  authorize("admin", "hr"),
  getAllExits
);

router.post(
  "/",
  protect,
  authorize("hr", "employee"),
  createExit
);

router.get(
  "/:id",
  protect,
  authorize("admin", "hr", "employee"),
  getExitById
);

router.patch(
  "/:id/clearance/:dept",
  protect,
  authorize("hr"),
  updateExitClearance
);

router.patch(
  "/:id/approve",
  protect,
  authorize("admin", "hr"),
  approveExit
);

router.post(
  "/:id/letter",
  protect,
  authorize("hr"),
  generateExitLetters
);

router.patch(
  "/:id/complete",
  protect,
  authorize("hr"),
  completeExit
);
module.exports = router;
