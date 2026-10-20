const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  getMyApplication,
  getMyProfile,
  getMyDocuments,
  uploadCandidateDocument,
  updateCandidateDocument,
  deleteCandidateDocument,
  getMyOffer,
} = require("../controllers/candidateController");

// ==========================================
// CANDIDATE APPLICATION
// ==========================================
router.get(
  "/application",
  protect,
  authorizeRoles("candidate"),
  getMyApplication
);

// ==========================================
// CANDIDATE PROFILE
// ==========================================
router.get(
  "/profile",
  protect,
  authorizeRoles("candidate"),
  getMyProfile
);

// ==========================================
// GET CANDIDATE DOCUMENTS
// ==========================================
router.get(
  "/documents",
  protect,
  authorizeRoles("candidate"),
  getMyDocuments
);

// ==========================================
// UPLOAD CANDIDATE DOCUMENT
// ==========================================
router.post(
  "/documents",
  protect,
  authorizeRoles("candidate"),
  upload.single("document"),
  uploadCandidateDocument
);

// UPDATE CANDIDATE DOCUMENT
router.patch(
  "/documents/:id",
  protect,
  authorizeRoles("candidate"),
  upload.single("document"),
  updateCandidateDocument
);

// DELETE CANDIDATE DOCUMENT
router.delete(
  "/documents/:id",
  protect,
  authorizeRoles("candidate"),
  deleteCandidateDocument
);

// GET CANDIDATE OFFER
router.get(
  "/offer",
  protect,
  authorizeRoles("candidate"),
  getMyOffer
);

module.exports = router;