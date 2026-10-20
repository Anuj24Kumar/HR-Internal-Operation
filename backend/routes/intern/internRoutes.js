const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/authMiddleware");
const requireIntern = require("../../middleware/intern/requireIntern");
const upload = require("../../middleware/uploadMiddleware");

const {
  getMyInternProfile,
} = require("../../controllers/Intern/internController");

const {
  getMyOnboarding,
  completeOnboardingTask,
} = require("../../controllers/Intern/onboardingController");

const {
  getMyDocuments,
  uploadInternDocument,
  updateInternDocument,
} = require("../../controllers/Intern/internDocumentController");

// 1. Get intern profile
router.get(
  "/profile",
  protect,
  requireIntern,
  getMyInternProfile
);

// 2. Get onboarding checklist
router.get(
  "/onboarding",
  protect,
  requireIntern,
  getMyOnboarding
);

// 3. Complete onboarding task
router.patch(
  "/onboarding/tasks/:taskId",
  protect,
  requireIntern,
  completeOnboardingTask
);

// 4. Get intern documents
router.get(
  "/documents",
  protect,
  requireIntern,
  getMyDocuments
);

// 5. Upload intern document
router.post(
  "/documents",
  protect,
  requireIntern,
  upload.single("document"),
  uploadInternDocument
);

// 6. Update/re-upload rejected document
router.patch(
  "/documents/:id",
  protect,
  requireIntern,
  upload.single("document"),
  updateInternDocument
);

module.exports = router;