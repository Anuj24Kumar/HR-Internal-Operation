const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Employee profile controllers
const {
  getMyEmployeeProfile,
  getMyEmploymentHistory,
  getMySalaryBreakdown,
} = require("../controllers/Employee/employeeController");

// Employee document controllers
const {
  getMyEmployeeDocuments,
  uploadEmployeeDocument,
  updateEmployeeDocument,
} = require("../controllers/Employee/employeeDocumentController");

// Employee letter controllers
const {
  getMyEmployeeLetters,
  downloadEmployeeLetterPdf,
} = require("../controllers/Employee/employeeLetterController");

// Resignation controllers
const {
  getMyResignation,
  submitResignation,
  withdrawResignation,
} = require("../controllers/Employee/resignationController");

// All employee routes require authentication and employee role.
router.use(protect);
router.use(authorizeRoles("employee"));

// 1. Get employee profile
router.get("/profile", getMyEmployeeProfile);

// 2. Get employment history
router.get("/profile/history", getMyEmploymentHistory);

// 3. Get salary breakdown
router.get("/profile/salary", getMySalaryBreakdown);

// 4. Get employee documents
router.get("/documents", getMyEmployeeDocuments);

// 5. Upload employee document
router.post(
  "/documents",
  upload.single("document"),
  uploadEmployeeDocument
);

// 6. Re-upload rejected employee document
router.patch(
  "/documents/:id",
  upload.single("document"),
  updateEmployeeDocument
);

// 7. Get employee letters
router.get("/letters", getMyEmployeeLetters);

// 8. Download employee letter PDF
router.get("/letters/:id/pdf", downloadEmployeeLetterPdf);

// 9. Get resignation status
router.get("/resignation", getMyResignation);

// 10. Submit resignation
router.post("/resignation", submitResignation);

// 11. Withdraw pending resignation
router.delete("/resignation", withdrawResignation);

module.exports = router;