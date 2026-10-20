
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const {
  getCandidateInterviews,
  createInterview,
  getInterviewById,
  updateInterview,
  deleteInterview,
} = require("../controllers/interviewController");

// Get all interviews for a candidate
router.get(
  "/candidates/:id/interviews",
  protect,
  authorize("admin", "hr", "hiring_manager", "interviewer"),
  getCandidateInterviews
);

// Create an interview for a candidate (HR only)
router.post(
  "/candidates/:id/interviews",
  protect,
  authorize("hr"),
  createInterview
);


// Get a specific interview for a candidate
router.get(
  "/candidates/:id/interviews/:roundId",
  protect,
  authorize("admin", "hr", "hiring_manager", "interviewer"),
  getInterviewById
);


router.patch(
  "/candidates/:id/interviews/:roundId",
  protect,
  authorize("hr"),
  updateInterview
);


router.delete(
  "/candidates/:id/interviews/:roundId",
  protect,
  authorize("hr"),
  deleteInterview
);


module.exports = router;
