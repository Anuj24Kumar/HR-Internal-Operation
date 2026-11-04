const { User: Employee, EmployeeHistory } = require("../../models");

// GET /api/employee/profile
const getMyEmployeeProfile = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      _id: req.user.id,
      role: { $in: ["employee", "intern"] },
    }).populate("managerId", "firstName lastName email");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employee profile fetched successfully",
      employee,
    });
  } catch (error) {
    console.error("Get Employee Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee profile",
    });
  }
};

// GET /api/employee/profile/history
const getMyEmploymentHistory = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      _id: req.user.id,
      role: { $in: ["employee", "intern"] },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const history = await EmployeeHistory.find({
      employeeId: employee._id,
    })
      .populate("changedBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Employment history fetched successfully",
      count: history.length,
      history,
    });
  } catch (error) {
    console.error("Get Employment History Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employment history",
    });
  }
};

// GET /api/employee/profile/salary
const getMySalaryBreakdown = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      _id: req.user.id,
      role: { $in: ["employee", "intern"] },
    }).select(
      "employeeCode empId department designation salary joiningDate"
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const salary = typeof employee.salary === "number" ? { totalCTC: employee.salary } : employee.salary || {};

    return res.status(200).json({
      success: true,
      message: "Salary breakdown fetched successfully",
      salary: {
        basic: salary.basic || 0,
        hra: salary.hra || 0,
        allowances: salary.allowances || 0,
        pf: salary.pf || 0,
        totalCTC: salary.totalCTC || 0,
      },
    });
  } catch (error) {
    console.error("Get Salary Breakdown Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch salary breakdown",
    });
  }
};

module.exports = {
  getMyEmployeeProfile,
  getMyEmploymentHistory,
  getMySalaryBreakdown,
};