
const mongoose = require("mongoose");
const Exit = require("../models/Exit");
const Employee = require("../models/Employee");
const ApprovalRequest = require("../models/ApprovalRequest");

const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const getAllExits = async (req, res) => {
  try {
    const exits = await Exit.find()
      .populate(
        "employeeId",
        "empId personalInfo department designation joiningDate status"
      )
      .populate("createdBy", "name email")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: exits.length,
      data: exits,
    });
  } catch (error) {
    console.error("Get all exits error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch exit records",
    });
  }
};

const createExit = async (req, res) => {
  try {
    const { employeeId, resignationDate, lastWorkingDay, reason } =
      req.body;

    if (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "A valid employeeId is required",
      });
    }

    if (!lastWorkingDay || !reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Last working day and resignation reason are required",
      });
    }

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const existingExit = await Exit.findOne({
      employeeId,
      status: { $in: ["Pending Approval", "Approved"] },
    });

    if (existingExit) {
      return res.status(409).json({
        success: false,
        message: "An active exit request already exists for this employee",
      });
    }

    const resignation = new Date(resignationDate || Date.now());
    const lastDay = new Date(lastWorkingDay);

    if (
      Number.isNaN(resignation.getTime()) ||
      Number.isNaN(lastDay.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid resignation date or last working day",
      });
    }

    if (lastDay < resignation) {
      return res.status(400).json({
        success: false,
        message: "Last working day cannot be before resignation date",
      });
    }

    const exit = await Exit.create({
      employeeId,
      resignationDate: resignation,
      lastWorkingDay: lastDay,
      reason: reason.trim(),
      createdBy: req.user.id,
      status: "Pending Approval",
    });

    let approvalRequest;

    try {
      approvalRequest = await ApprovalRequest.create({
        requestType: "Other",
        resourceId: exit._id,
        requestedBy: req.user.id,
        status: "Pending",
      });

      exit.approvalRequestId = approvalRequest._id;
      await exit.save();
    } catch (approvalError) {
      // Avoid leaving an exit request without its approval request.
      await Exit.findByIdAndDelete(exit._id);
      throw approvalError;
    }

    const populatedExit = await Exit.findById(exit._id)
      .populate("employeeId", "empId personalInfo department designation")
      .populate("createdBy", "name email");

    return res.status(201).json({
      success: true,
      message: "Resignation initiated successfully",
      data: populatedExit,
    });
  } catch (error) {
    console.error("Create exit error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to initiate resignation",
    });
  }
};

const getExitById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exit ID",
      });
    }

    const exit = await Exit.findById(id)
      .populate(
        "employeeId",
        "empId personalInfo department designation joiningDate status"
      )
      .populate("createdBy", "name email")
      .populate("approvedBy", "name email");

    if (!exit) {
      return res.status(404).json({
        success: false,
        message: "Exit record not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: exit,
    });
  } catch (error) {
    console.error("Get exit by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch exit details",
    });
  }
};


const updateExitClearance = async (req, res) => {
  try {
    const { id, dept } = req.params;
    const allowedDepartments = ["it", "finance", "manager", "hr"];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exit ID",
      });
    }

    if (!allowedDepartments.includes(dept)) {
      return res.status(400).json({
        success: false,
        message: "Department must be it, finance, manager, or hr",
      });
    }

    const exit = await Exit.findById(id);

    if (!exit) {
      return res.status(404).json({
        success: false,
        message: "Exit record not found",
      });
    }

    if (exit.status !== "Approved") {
      return res.status(400).json({
        success: false,
        message: "Resignation must be approved before clearance",
      });
    }

    exit.clearance[dept].status = "Completed";
    exit.clearance[dept].clearedBy = req.user.id;
    exit.clearance[dept].clearedAt = new Date();

    await exit.save();

    return res.status(200).json({
      success: true,
      message: `${dept.toUpperCase()} clearance completed successfully`,
      data: {
        exitId: exit._id,
        department: dept,
        clearance: exit.clearance[dept],
        clearanceProgress: exit.clearanceProgress,
      },
    });
  } catch (error) {
    console.error("Update exit clearance error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update exit clearance",
    });
  }
};


const approveExit = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comments } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exit ID",
      });
    }

    if (!["approved", "rejected"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be approved or rejected",
      });
    }

    const exit = await Exit.findById(id);

    if (!exit) {
      return res.status(404).json({
        success: false,
        message: "Exit record not found",
      });
    }

    if (exit.status !== "Pending Approval") {
      return res.status(400).json({
        success: false,
        message: "Only pending exit requests can be reviewed",
      });
    }

    if (!exit.approvalRequestId) {
      return res.status(400).json({
        success: false,
        message: "Approval request not found for this exit",
      });
    }

    const approvalRequest = await ApprovalRequest.findById(
      exit.approvalRequestId
    );

    if (!approvalRequest) {
      return res.status(404).json({
        success: false,
        message: "Approval request record not found",
      });
    }

    if (approvalRequest.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Approval request has already been reviewed",
      });
    }

    const nextStatus = action === "approved" ? "Approved" : "Rejected";
    const requestStatus = action === "approved" ? "Approved" : "Rejected";

    approvalRequest.status = requestStatus;
    approvalRequest.approverId = req.user.id;
    approvalRequest.comments = comments || "";
    approvalRequest.reviewedAt = new Date();

    await approvalRequest.save();

    exit.status = nextStatus;

    if (action === "approved") {
      exit.approvedBy = req.user.id;
      exit.approvedAt = new Date();
    }

    await exit.save();

    return res.status(200).json({
      success: true,
      message: `Exit request ${action} successfully`,
      data: {
        exitId: exit._id,
        status: exit.status,
        approvalRequestId: approvalRequest._id,
        approvalStatus: approvalRequest.status,
        approvedBy: exit.approvedBy,
        approvedAt: exit.approvedAt,
      },
    });
  } catch (error) {
    console.error("Approve exit error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to review exit request",
    });
  }
};


const generateExitLetters = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exit ID",
      });
    }

    const exit = await Exit.findById(id).populate(
      "employeeId",
      "empId personalInfo department designation joiningDate"
    );

    if (!exit) {
      return res.status(404).json({
        success: false,
        message: "Exit record not found",
      });
    }

    if (exit.status !== "Approved") {
      return res.status(400).json({
        success: false,
        message: "Exit request must be approved before generating letters",
      });
    }

    const departments = ["it", "finance", "manager", "hr"];

    const allCleared = departments.every(
      (dept) => exit.clearance[dept]?.status === "Completed"
    );

    if (!allCleared) {
      return res.status(400).json({
        success: false,
        message: "All department clearances must be completed first",
      });
    }

    const uploadDir = path.join(process.cwd(), "uploads", "exits");
    fs.mkdirSync(uploadDir, { recursive: true });

    const employee = exit.employeeId;
    const employeeName = employee?.personalInfo?.name || "Employee";
    const empId = employee?.empId || "N/A";

    const generatePdf = (filePath, title, bodyText) =>
      new Promise((resolve, reject) => {
        const pdf = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);

        stream.on("finish", resolve);
        stream.on("error", reject);
        pdf.on("error", reject);

        pdf.pipe(stream);
        pdf.fontSize(20).text(title, { align: "center" });
        pdf.moveDown(2);
        pdf.fontSize(12).text(`Employee Name: ${employeeName}`);
        pdf.text(`Employee ID: ${empId}`);
        pdf.text(`Designation: ${employee?.designation || "N/A"}`);
        pdf.text(
          `Department: ${employee?.department || "N/A"}`
        );
        pdf.text(
          `Last Working Day: ${new Date(exit.lastWorkingDay).toDateString()}`
        );
        pdf.moveDown();
        pdf.text(bodyText, { align: "justify" });
        pdf.moveDown(3);
        pdf.text("Authorized Signatory");
        pdf.end();
      });

    const relievingPath = path.join(
      uploadDir,
      `relieving-${exit._id}.pdf`
    );

    const experiencePath = path.join(
      uploadDir,
      `experience-${exit._id}.pdf`
    );

    await generatePdf(
      relievingPath,
      "RELIEVING LETTER",
      `This letter confirms that ${employeeName} is relieved from their duties effective from ${new Date(exit.lastWorkingDay).toDateString()}, subject to completion of the organization's exit formalities.`
    );

    await generatePdf(
      experiencePath,
      "EXPERIENCE LETTER",
      `This letter certifies that ${employeeName} worked as ${employee?.designation || "an employee"} in the ${employee?.department || "organization"} department. Their last working day was ${new Date(exit.lastWorkingDay).toDateString()}.`
    );

    exit.relievingLetterUrl = `/uploads/exits/relieving-${exit._id}.pdf`;
    exit.experienceLetterUrl = `/uploads/exits/experience-${exit._id}.pdf`;

    await exit.save();

    return res.status(201).json({
      success: true,
      message: "Exit letters generated successfully",
      data: {
        exitId: exit._id,
        relievingLetterUrl: exit.relievingLetterUrl,
        experienceLetterUrl: exit.experienceLetterUrl,
      },
    });
  } catch (error) {
    console.error("Generate exit letters error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate exit letters",
    });
  }
};


const completeExit = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exit ID",
      });
    }

    const exit = await Exit.findById(id);

    if (!exit) {
      return res.status(404).json({
        success: false,
        message: "Exit record not found",
      });
    }

    if (exit.status !== "Approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved exit requests can be completed",
      });
    }

    const departments = ["it", "finance", "manager", "hr"];

    const allCleared = departments.every(
      (dept) => exit.clearance[dept]?.status === "Completed"
    );

    if (!allCleared) {
      return res.status(400).json({
        success: false,
        message: "All department clearances must be completed first",
      });
    }

    if (!exit.relievingLetterUrl || !exit.experienceLetterUrl) {
      return res.status(400).json({
        success: false,
        message: "Generate both exit letters before completing exit",
      });
    }

    const employee = await Employee.findById(exit.employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee record not found",
      });
    }

    employee.status = "Exited";
    await employee.save();

    exit.status = "Completed";
    exit.completedAt = new Date();
    await exit.save();

    return res.status(200).json({
      success: true,
      message: "Employee exit completed successfully",
      data: {
        exitId: exit._id,
        employeeId: employee._id,
        employeeStatus: employee.status,
        exitStatus: exit.status,
        completedAt: exit.completedAt,
      },
    });
 } catch (error) {
  console.error("Complete exit error:", error);

  return res.status(500).json({
    success: false,
    message: error.message || "Failed to complete employee exit",
  });
}
};



module.exports = {
  getAllExits,
  createExit,
  getExitById,
  updateExitClearance,
  approveExit,
  generateExitLetters,
  completeExit,
};
