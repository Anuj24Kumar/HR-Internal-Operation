const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  getMyInternProfile,
} = require("../controllers/Intern/internController");

const {
  getMyOnboarding,
  completeOnboardingTask,
} = require("../controllers/Intern/onboardingController");

const {
  getMyDocuments,
  uploadInternDocument,
  updateInternDocument,
} = require("../controllers/Intern/internDocumentController");

// 1. Get intern profile
router.get(
  "/profile",
  protect,
  authorizeRoles("intern"),
  getMyInternProfile
);

// 2. Get onboarding checklist
router.get(
  "/onboarding",
  protect,
  authorizeRoles("intern"),
  getMyOnboarding
);

// 3. Complete onboarding task
router.patch(
  "/onboarding/tasks/:taskId",
  protect,
  authorizeRoles("intern"),
  completeOnboardingTask
);

// 4. Get intern documents
router.get(
  "/documents",
  protect,
  authorizeRoles("intern"),
  getMyDocuments
);

// 5. Upload intern document
router.post(
  "/documents",
  protect,
  authorizeRoles("intern"),
  upload.single("document"),
  uploadInternDocument
);

// 6. Update/re-upload rejected document
router.patch(
  "/documents/:id",
  protect,
  authorizeRoles("intern"),
  upload.single("document"),
  updateInternDocument
);

module.exports = router;