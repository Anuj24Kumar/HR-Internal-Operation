const mongoose = require("mongoose");
const Employee = require("../../models/Employee");

const getEmployees = async (req, res) => {
  try {
    const { type, department, designation, status } = req.query;

    const filter = {};

    if (type) filter.type = type;
    if (department) filter.department = department;
    if (designation) filter.designation = designation;
    if (status) filter.status = status;

    const employees = await Employee.find(filter)
      .select("-salary -personalInfo")
      .populate("managerId", "empId designation department")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    console.error("Get employees error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employees",
    });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const employee = await Employee.findById(id)
      .select("-salary -personalInfo")
      .populate("managerId", "empId designation department");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const isAdminOrHR = ["admin", "hr"].includes(req.user.role);
    const isOwnProfile =
      employee.userId &&
      employee.userId.toString() === req.user.id.toString();

    if (!isAdminOrHR && !isOwnProfile) {
      return res.status(403).json({
        success: false,
        message: "You can only access your own profile",
      });
    }

    const data = employee.toObject();

    if (isAdminOrHR || isOwnProfile) {
      const fullEmployee = await Employee.findById(id)
        .populate("managerId", "empId designation department");

      return res.status(200).json({
        success: true,
        data: fullEmployee,
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get employee by ID error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee",
    });
  }
};


const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const allowedFields = [
      "type",
      "personalInfo",
      "department",
      "designation",
      "managerId",
      "joiningDate",
      "salary",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const employee = await Employee.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("managerId", "empId designation department");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: employee,
    });
  } catch (error) {
    console.error("Update employee error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update employee",
    });
  }
};

const EmployeeHistory = require("../../models/EmployeeHistory");

// POST: Add employee history
const addEmployeeHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { historyType, oldValues, newValues, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const allowedTypes = ["promotion", "transfer", "increment"];

    if (!allowedTypes.includes(historyType)) {
      return res.status(400).json({
        success: false,
        message: "historyType must be promotion, transfer or increment",
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reason is required",
      });
    }

    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const history = await EmployeeHistory.create({
      employeeId: employee._id,
      historyType,
      oldValues: oldValues || {},
      newValues: newValues || {},
      reason: reason.trim(),
      changedBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Employee history added successfully",
      data: history,
    });
  } catch (error) {
    console.error("Add employee history error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add employee history",
    });
  }
};

// GET: Employee history timeline
const getEmployeeHistory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const isAdminOrHR = ["admin", "hr"].includes(req.user.role);
    const isOwnProfile =
      employee.userId &&
      employee.userId.toString() === req.user.id.toString();

    if (!isAdminOrHR && !isOwnProfile) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this history",
      });
    }

    const history = await EmployeeHistory.find({
      employeeId: employee._id,
    })
      .populate("changedBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error("Get employee history error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee history",
    });
  }
};

const updateEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const allowedStatuses = ["active", "notice", "exited"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be active, notice or exited",
      });
    }

    const employee = await Employee.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    ).populate("managerId", "empId designation department");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employee status updated successfully",
      data: employee,
    });
  } catch (error) {
    console.error("Update employee status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update employee status",
    });
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  updateEmployee,
  updateEmployeeStatus,
  addEmployeeHistory,
  getEmployeeHistory,
};
