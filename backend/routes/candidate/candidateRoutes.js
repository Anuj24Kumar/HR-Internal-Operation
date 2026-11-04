const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/authMiddleware");
const { authorize } = require("../../middleware/roleMiddleware");
const requireCandidate = require("../../middleware/candidate/requireCandidate");
const upload = require("../../middleware/uploadMiddleware");
const {
  createCandidate,
  getCandidates,
  getCandidateById,
  updateCandidate,
  archiveCandidate,
  deleteCandidate,
  getMyApplication,
  getMyProfile,
  getMyDocuments,
  uploadCandidateDocument,
  updateCandidateDocument,
  deleteCandidateDocument,
  getMyOffer,
  acceptOffer,
  declineOffer,
  applyJob,
  getMyApplications,
  getApplicationById,
} = require("../../controllers/candidate/candidateController");

router.get("/", protect, authorize("admin", "hr"), getCandidates);
router.post("/", protect, authorize("hr"), createCandidate);

// Candidate application routes
router.post(
  "/apply",
  protect,
  requireCandidate,
  upload.single("resume"),
  applyJob
);
router.post(
  "/application",
  protect,
  requireCandidate,
  upload.single("resume"),
  applyJob
);
router.get(
  "/my-applications",
  protect,
  requireCandidate,
  getMyApplications
);
router.get(
  "/applications/:id",
  protect,
  requireCandidate,
  getApplicationById
);
router.get(
  "/application",
  protect,
  requireCandidate,
  getMyApplication
);

router.get(
  "/profile",
  protect,
  requireCandidate,
  getMyProfile
);
router.get(
  "/documents",
  protect,
  requireCandidate,
  getMyDocuments
);
router.post(
  "/documents",
  protect,
  requireCandidate,
  upload.single("document"),
  uploadCandidateDocument
);
router.patch(
  "/documents/:id",
  protect,
  requireCandidate,
  upload.single("document"),
  updateCandidateDocument
);
router.delete(
  "/documents/:id",
  protect,
  requireCandidate,
  deleteCandidateDocument
);
router.get(
  "/offer",
  protect,
  requireCandidate,
  getMyOffer
);
router.post(
  "/offer/accept",
  protect,
  requireCandidate,
  upload.any(),
  acceptOffer
);
router.post(
  "/offer/decline",
  protect,
  requireCandidate,
  declineOffer
);

router.get(
  "/:id",
  protect,
  authorize("admin", "hr", "hiring_manager", "interviewer"),
  getCandidateById
);
router.patch("/:id", protect, authorize("hr"), updateCandidate);
router.patch("/:id/archive", protect, authorize("hr"), archiveCandidate);
router.delete("/:id", protect, authorize("admin"), deleteCandidate);

module.exports = router;
