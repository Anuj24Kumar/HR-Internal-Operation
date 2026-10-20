
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const {
  getEmployees,
  getEmployeeById,
  updateEmployee,
  addEmployeeHistory,
  getEmployeeHistory,
  updateEmployeeStatus,
} = require("../controllers/employeeController");

// List all interns and employees: Admin and HR only
router.get(
  "/",
  protect,
  authorize("admin", "hr"),
  getEmployees
);

// Get employee profile by ID
router.get(
  "/:id",
  protect,
  getEmployeeById
);

router.patch(
  "/:id",
  protect,
  authorize("hr"),
  updateEmployee
);

// Add history — HR only
router.post(
  "/:id/history",
  protect,
  authorize("hr"),
  addEmployeeHistory
);

// View history — controller checks profile access
router.get(
  "/:id/history",
  protect,
  getEmployeeHistory
);

router.patch(
  "/:id/status",
  protect,
  authorize("hr"),
  updateEmployeeStatus
);
module.exports = router;
