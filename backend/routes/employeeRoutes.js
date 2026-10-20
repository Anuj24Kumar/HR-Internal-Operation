const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize, authorizeRoles } = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  getMyEmployeeProfile,
  getMyEmploymentHistory,
  getMySalaryBreakdown,
} = require("../controllers/Employee/employeeController");
const {
  getMyEmployeeDocuments,
  uploadEmployeeDocument,
  updateEmployeeDocument,
} = require("../controllers/Employee/employeeDocumentController");
const {
  getMyEmployeeLetters,
  downloadEmployeeLetterPdf,
} = require("../controllers/Employee/employeeLetterController");
const {
  getMyResignation,
  submitResignation,
  withdrawResignation,
} = require("../controllers/Employee/resignationController");
const {
  getEmployees,
  getEmployeeById,
  updateEmployee,
  addEmployeeHistory,
  getEmployeeHistory,
  updateEmployeeStatus,
} = require("../controllers/employeeController");

router.get("/profile", protect, authorizeRoles("employee"), getMyEmployeeProfile);
router.get("/profile/history", protect, authorizeRoles("employee"), getMyEmploymentHistory);
router.get("/profile/salary", protect, authorizeRoles("employee"), getMySalaryBreakdown);
router.get("/documents", protect, authorizeRoles("employee"), getMyEmployeeDocuments);
router.post(
  "/documents",
  protect,
  authorizeRoles("employee"),
  upload.single("document"),
  uploadEmployeeDocument
);
router.patch(
  "/documents/:id",
  protect,
  authorizeRoles("employee"),
  upload.single("document"),
  updateEmployeeDocument
);
router.get("/letters", protect, authorizeRoles("employee"), getMyEmployeeLetters);
router.get("/letters/:id/pdf", protect, authorizeRoles("employee"), downloadEmployeeLetterPdf);
router.get("/resignation", protect, authorizeRoles("employee"), getMyResignation);
router.post("/resignation", protect, authorizeRoles("employee"), submitResignation);
router.delete("/resignation", protect, authorizeRoles("employee"), withdrawResignation);

router.get("/", protect, authorize("admin", "hr"), getEmployees);
router.get("/:id", protect, getEmployeeById);
router.patch("/:id", protect, authorize("hr"), updateEmployee);
router.post("/:id/history", protect, authorize("hr"), addEmployeeHistory);
router.get("/:id/history", protect, getEmployeeHistory);
router.patch("/:id/status", protect, authorize("hr"), updateEmployeeStatus);

module.exports = router;
