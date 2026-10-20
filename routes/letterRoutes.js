
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const {
  getLetters,
  createLetter,
  getLetterById,
  getLetterPdf,
  submitLetter,
  decideLetterApproval,
  regenerateLetter,
  deleteLetter,
} = require("../controllers/letterController");

// GET /api/v1/letters
router.get("/", protect, authorize("admin", "hr"), getLetters);

// POST /api/v1/letters
router.post("/", protect, authorize("hr"), createLetter);

// GET /api/v1/letters/:id/pdf
router.get(
  "/:id/pdf",
  protect,
  authorize("admin", "hr", "intern", "employee"),
  getLetterPdf
);

// GET /api/v1/letters/:id
router.get(
  "/:id",
  protect,
  authorize("admin", "hr", "intern", "employee"),
  getLetterById
);

// PATCH /api/v1/letters/:id/submit
router.patch("/:id/submit", protect, authorize("hr"), submitLetter);

// PATCH /api/v1/letters/:id/regenerate
router.patch("/:id/regenerate", protect, authorize("hr"), regenerateLetter);

// DELETE /api/v1/letters/:id
router.delete(
  "/:id",
  protect,
  authorize("hr", "admin"),
  deleteLetter
);

router.patch(
  "/:id/approval",
  protect,
  authorize("admin"),
  decideLetterApproval
);

module.exports = router;
