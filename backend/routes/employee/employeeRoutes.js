const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/authMiddleware");
const { authorize } = require("../../middleware/roleMiddleware");
const requireEmployee = require("../../middleware/employee/requireEmployee");
const upload = require("../../middleware/uploadMiddleware");
const {
  getMyEmployeeProfile,
  getMyEmploymentHistory,
  getMySalaryBreakdown,
} = require("../../controllers/Employee/employeeController");
const {
  getMyEmployeeDocuments,
  uploadEmployeeDocument,
  updateEmployeeDocument,
} = require("../../controllers/Employee/employeeDocumentController");
const {
  getMyEmployeeLetters,
  downloadEmployeeLetterPdf,
} = require("../../controllers/Employee/employeeLetterController");
const {
  getMyResignation,
  submitResignation,
  withdrawResignation,
} = require("../../controllers/Employee/resignationController");
const {
  getAcceptedOffers,
  convertCandidate,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  addEmployeeHistory,
  getEmployeeHistory,
  updateEmployeeStatus,
} = require("../../controllers/hr/employeeController");

// Employee self-service routes
router.get("/profile", protect, requireEmployee, getMyEmployeeProfile);
router.get("/profile/history", protect, requireEmployee, getMyEmploymentHistory);
router.get("/profile/salary", protect, requireEmployee, getMySalaryBreakdown);
router.get("/documents", protect, requireEmployee, getMyEmployeeDocuments);
router.post(
  "/documents",
  protect,
  requireEmployee,
  upload.single("document"),
  uploadEmployeeDocument
);
router.patch(
  "/documents/:id",
  protect,
  requireEmployee,
  upload.single("document"),
  updateEmployeeDocument
);
router.get("/letters", protect, requireEmployee, getMyEmployeeLetters);
router.get("/letters/:id/pdf", protect, requireEmployee, downloadEmployeeLetterPdf);
router.get("/resignation", protect, requireEmployee, getMyResignation);
router.post("/resignation", protect, requireEmployee, submitResignation);
router.delete("/resignation", protect, requireEmployee, withdrawResignation);

// HR-only & Management endpoints
router.get("/", protect, authorize("admin", "hr"), getEmployees);
router.get("/accepted-offers", protect, authorize("admin", "hr"), getAcceptedOffers);
router.post("/convert", protect, authorize("admin", "hr"), convertCandidate);
router.get("/:id", protect, authorize("admin", "hr", "employee", "intern"), getEmployeeById);
router.patch("/:id", protect, authorize("admin", "hr"), updateEmployee);
router.patch("/:id/status", protect, authorize("admin", "hr"), updateEmployeeStatus);
router.post("/:id/history", protect, authorize("admin", "hr"), addEmployeeHistory);
router.get("/:id/history", protect, getEmployeeHistory);

module.exports = router;
