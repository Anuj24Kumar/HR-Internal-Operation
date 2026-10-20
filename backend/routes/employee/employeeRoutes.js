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
  getEmployees,
  getEmployeeById,
  updateEmployee,
  addEmployeeHistory,
  getEmployeeHistory,
  updateEmployeeStatus,
} = require("../../controllers/hr/employeeController");

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

router.get("/", protect, authorize("admin", "hr"), getEmployees);
router.get("/:id", protect, getEmployeeById);
router.patch("/:id", protect, authorize("hr"), updateEmployee);
router.post("/:id/history", protect, authorize("hr"), addEmployeeHistory);
router.get("/:id/history", protect, getEmployeeHistory);
router.patch("/:id/status", protect, authorize("hr"), updateEmployeeStatus);

module.exports = router;
