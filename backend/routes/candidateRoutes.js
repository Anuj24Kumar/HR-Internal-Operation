const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize, authorizeRoles } = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  createCandidate,
  getCandidates,
  getCandidateById,
  updateCandidate,
  updateCandidateStatus,
  selectCandidate,
  archiveCandidate,
  deleteCandidate,
  getMyApplication,
  getMyProfile,
  getMyDocuments,
  uploadCandidateDocument,
  updateCandidateDocument,
  deleteCandidateDocument,
  getMyOffer,
} = require("../controllers/candidateController");

router.get("/", protect, authorize("admin", "hr"), getCandidates);
router.post("/", protect, authorize("hr"), createCandidate);
router.get(
  "/application",
  protect,
  authorizeRoles("candidate"),
  getMyApplication
);
router.get(
  "/profile",
  protect,
  authorizeRoles("candidate"),
  getMyProfile
);
router.get(
  "/documents",
  protect,
  authorizeRoles("candidate"),
  getMyDocuments
);
router.post(
  "/documents",
  protect,
  authorizeRoles("candidate"),
  upload.single("document"),
  uploadCandidateDocument
);
router.patch(
  "/documents/:id",
  protect,
  authorizeRoles("candidate"),
  upload.single("document"),
  updateCandidateDocument
);
router.delete(
  "/documents/:id",
  protect,
  authorizeRoles("candidate"),
  deleteCandidateDocument
);
router.get(
  "/offer",
  protect,
  authorizeRoles("candidate"),
  getMyOffer
);

router.get(
  "/:id",
  protect,
  authorize("admin", "hr", "hiring_manager", "interviewer"),
  getCandidateById
);
router.patch("/:id", protect, authorize("hr"), updateCandidate);
router.patch(
  "/:id/status",
  protect,
  authorize("hr"),
  updateCandidateStatus
);
router.patch("/:id/select", protect, authorize("hr"), selectCandidate);
router.patch("/:id/archive", protect, authorize("hr"), archiveCandidate);
router.delete("/:id", protect, authorize("admin"), deleteCandidate);

module.exports = router;
