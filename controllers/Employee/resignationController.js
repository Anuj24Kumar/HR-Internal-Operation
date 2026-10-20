const Employee = require("../../models/Employee/Employee");
const Resignation = require("../../models/Employee/Resignation");

// GET /api/employee/resignation
const getMyResignation = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const resignation = await Resignation.findOne({
      employee: employee._id,
      status: { $in: ["pending", "approved"] },
    })
      .populate("reviewedBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    if (!resignation) {
      return res.status(200).json({
        success: true,
        message: "No active resignation found",
        resignation: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Resignation details fetched successfully",
      resignation,
    });
  } catch (error) {
    console.error("Get Resignation Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch resignation details",
    });
  }
};

// POST /api/employee/resignation
const submitResignation = async (req, res) => {
  try {
    const { reason, requestedLastWorkingDay } = req.body;

    if (
      typeof reason !== "string" ||
      reason.trim().length < 10 ||
      reason.trim().length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message: "Reason must be between 10 and 2000 characters",
      });
    }

    if (!requestedLastWorkingDay) {
      return res.status(400).json({
        success: false,
        message: "Requested last working day is required",
      });
    }

    const lastWorkingDay = new Date(requestedLastWorkingDay);

    if (Number.isNaN(lastWorkingDay.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid last working day",
      });
    }

    const employee = await Employee.findOne({ user: req.user.id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    if (employee.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Only active employees can submit a resignation",
      });
    }

    if (
      employee.joiningDate &&
      lastWorkingDay < employee.joiningDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Last working day cannot be before joining date",
      });
    }

    const existingResignation = await Resignation.findOne({
      employee: employee._id,
      status: { $in: ["pending", "approved"] },
    });

    if (existingResignation) {
      return res.status(409).json({
        success: false,
        message: "An active resignation request already exists",
      });
    }

    const resignation = await Resignation.create({
      employee: employee._id,
      reason: reason.trim(),
      requestedLastWorkingDay: lastWorkingDay,
      status: "pending",
      submittedAt: new Date(),
      clearance: {
        status: "not_started",
        tasks: [],
      },
    });

    return res.status(201).json({
      success: true,
      message: "Resignation submitted successfully",
      resignation,
    });
  } catch (error) {
    // Protect against a duplicate active resignation index.
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An active resignation request already exists",
      });
    }

    console.error("Submit Resignation Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit resignation",
    });
  }
};

// DELETE /api/employee/resignation
const withdrawResignation = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const resignation = await Resignation.findOne({
      employee: employee._id,
      status: "pending",
    }).sort({ createdAt: -1 });

    if (!resignation) {
      return res.status(404).json({
        success: false,
        message: "No pending resignation available to withdraw",
      });
    }

    resignation.status = "withdrawn";

    await resignation.save();

    return res.status(200).json({
      success: true,
      message: "Resignation withdrawn successfully",
      resignation,
    });
  } catch (error) {
    console.error("Withdraw Resignation Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to withdraw resignation",
    });
  }
};

module.exports = {
  getMyResignation,
  submitResignation,
  withdrawResignation,
};