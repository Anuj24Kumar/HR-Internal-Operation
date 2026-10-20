
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const {
  getAllOnboarding,
  getOnboardingByEmployee,
  createOnboarding,
  updateOnboardingTask,
  addOnboardingTask,
    deleteOnboardingTask
} = require("../controllers/onboardingController");

// GET /api/v1/onboarding
router.get(
  "/",
  protect,
  authorize("admin", "hr"),
  getAllOnboarding
);

// POST /api/v1/onboarding
router.post(
  "/",
  protect,
  authorize("hr"),
  createOnboarding
);

// GET /api/v1/onboarding/:employeeId
router.get(
  "/:employeeId",
  protect,
  authorize("admin", "hr", "intern", "employee"),
  getOnboardingByEmployee
);

router.patch(
  "/:id/tasks/:taskId",
  protect,
  authorize("hr"),
  updateOnboardingTask
);

router.post(
  "/:id/tasks",
  protect,
  authorize("hr"),
  addOnboardingTask
);

router.delete(
  "/:id/tasks/:taskId",
  protect,
  authorize("hr"),
  deleteOnboardingTask
);
module.exports = router;
