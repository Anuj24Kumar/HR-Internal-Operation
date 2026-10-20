
const express = require("express");
const router = express.Router();

const {
  createCandidate,
  getCandidates,
  getCandidateById,
  updateCandidate,
  updateCandidateStatus,
    selectCandidate,
    archiveCandidate,
    deleteCandidate
} = require("../controllers/candidateController");



const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// Candidate list: Admin and HR only
router.get("/", protect, authorize("admin", "hr"), getCandidates);
router.get(
  "/:id",
  protect,
  authorize("admin", "hr", "hiring_manager", "interviewer"),
  getCandidateById
);

// Candidate create: HR only
router.post("/", protect, authorize("hr"), createCandidate);

router.patch(
  "/:id",
  protect,
  authorize("hr"),
  updateCandidate
);

router.patch(
  "/:id/status",
  protect,
  authorize("hr"),
  updateCandidateStatus
);

router.patch(
  "/:id/select",
  protect,
  authorize("hr"),
  selectCandidate
);

router.patch(
  "/:id/archive",
  protect,
  authorize("hr"),
  archiveCandidate
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteCandidate
);

module.exports = router;
