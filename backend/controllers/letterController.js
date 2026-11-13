
const mongoose = require("mongoose");
const { Letter, User: Employee, ApprovalRequest } = require("../models");

const PDFDocument = require("pdfkit");
const { generateLetterPdf } = require("../utils/pdfGenerator");
const { notify } = require("../utils/notificationHelper");
const fs = require("fs");
const path = require("path");

// GET: List all generated letters
const getLetters = async (req, res) => {
  try {
    const letters = await Letter.find()
      .populate("employeeId", "name email role empId department designation")
      .populate("templateId", "name type")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: letters.length,
      data: letters,
    });
  } catch (error) {
    console.error("Get letters error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch letters",
    });
  }
};

// POST: Create a letter draft
const createLetter = async (req, res) => {
  try {
    const {
      employeeId,
      letterType,
      type: rawType,
      title: rawTitle,
      templateId,
      placeholders: customPlaceholders,
    } = req.body;

    if (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Valid employeeId is required",
      });
    }

    const effectiveType = letterType || rawType || rawTitle;
    if (!effectiveType || !effectiveType.trim()) {
      return res.status(400).json({
        success: false,
        message: "letterType or type is required",
      });
    }

    if (templateId && !mongoose.Types.ObjectId.isValid(templateId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid templateId",
      });
    }

    const employee = await Employee.findOne({ _id: employeeId, role: { $in: ["employee", "intern"] } });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const placeholders = {
      empId: employee.empId,
      name: employee.name || "",
      email: employee.email || "",
      department: employee.department,
      designation: employee.designation,
      joiningDate: employee.joiningDate,
      salary: employee.salary,
      ...(customPlaceholders && typeof customPlaceholders === "object" && !Array.isArray(customPlaceholders)
        ? customPlaceholders
        : {}),
    };

    const normalizedType = effectiveType.toLowerCase();
    const type = normalizedType.includes("experience") ? "experience"
      : normalizedType.includes("relieving") ? "relieving"
        : normalizedType.includes("promotion") ? "promotion"
          : normalizedType.includes("increment") || normalizedType.includes("salary") ? "increment"
            : normalizedType.includes("warning") ? "warning"
              : normalizedType.includes("appointment") || normalizedType.includes("offer") || normalizedType.includes("internship")
                ? "appointment" : "other";

    const letterTitle = rawTitle || letterType || (type.charAt(0).toUpperCase() + type.slice(1) + " Letter");

    const letter = await Letter.create({
      employeeId,
      type,
      title: letterTitle.trim(),
      templateId: templateId || undefined,
      placeholders,
      createdBy: req.user.id || req.user._id,
      status: "draft",
    });

    await notify({
      userId: employeeId,
      message: `New letter available: ${letter.title}`,
      type: "success",
      link: "/employee/letters",
    });

    const createdLetter = await Letter.findById(letter._id)
      .populate("employeeId", "name email role empId department designation")
      .populate("templateId", "name type")
      .populate("createdBy", "name email");

    return res.status(201).json({
      success: true,
      message: "Letter draft created successfully",
      data: createdLetter,
    });
  } catch (error) {
    console.error("Create letter error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create letter",
    });
  }
};

// GET: Fetch letter details
const getLetterById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid letter ID",
      });
    }

    const letter = await Letter.findById(id)
      .populate("employeeId")
      .populate("templateId", "name type")
      .populate("createdBy", "name email");

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: "Letter not found",
      });
    }

    const role = String(req.user?.role || "").toLowerCase();
    if (["employee", "intern"].includes(role)) {
      const ownerId = String(letter.employeeId?._id || letter.employeeId);
      if (ownerId !== String(req.user?.id || req.user?._id)) {
        return res.status(403).json({ success: false, message: "Not authorized to view this letter" });
      }
    }

    return res.status(200).json({
      success: true,
      data: letter,
    });
  } catch (error) {
    console.error("Get letter by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch letter",
    });
  }
};

const getLetterPdf = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid letter ID" });
    }
    const letter = await Letter.findById(id).populate("employeeId");
    if (!letter) {
      return res.status(404).json({ success: false, message: "Letter not found" });
    }
    if (!letter.employeeId) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const filename = `letter-${letter._id}-v${letter.version || 1}.pdf`;
    const storageDir = path.resolve(__dirname, "..", "uploads", "letters");
    await fs.promises.mkdir(storageDir, { recursive: true });
    const localFilePath = path.join(storageDir, filename);

    if (letter.pdfUrl && fs.existsSync(localFilePath)) {
      return res.download(localFilePath, filename);
    }

    const relativeUrl = await generateLetterPdf(letter, letter.employeeId);
    letter.pdfUrl = relativeUrl;
    letter.status = "generated";
    letter.issuedAt = new Date();
    await letter.save();

    return res.download(path.join(__dirname, "..", relativeUrl), filename);
  } catch (error) {
    console.error("Generate letter PDF error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: "Failed to generate letter PDF" });
    }
    res.destroy(error);
  }
};


const submitLetter = async (req, res) => {
  let approvalRequest;

  try {
    const { id } = req.params;

    // Validate letter ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid letter ID",
      });
    }

    // Find the letter
    const letter = await Letter.findById(id);

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: "Letter not found",
      });
    }

    // Only Draft letters can be submitted
    if (letter.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: `Only Draft letters can be submitted. Current status: ${letter.status}`,
      });
    }

    // Create approval request
    approvalRequest = await ApprovalRequest.create({
      requestType: "Letter",
      resourceId: letter._id,
      requestedBy: req.user.id,
      status: "pending",
      submittedAt: new Date(),
    });

    // Update letter status
    letter.status = "pending_approval";

    await letter.save();

    return res.status(200).json({
      success: true,
      message: "Letter submitted for approval successfully",
      data: {
        letter,
        approvalRequest,
      },
    });
  } catch (error) {
    // Remove the newly created request if letter update fails
    if (approvalRequest?._id) {
      try {
        await ApprovalRequest.findByIdAndDelete(
          approvalRequest._id
        );
      } catch (cleanupError) {
        console.error(
          "Approval request cleanup failed:",
          cleanupError
        );
      }
    }

    console.error("Submit letter error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit letter for approval",
      debug: error.message,
    });
  }
};


const decideLetterApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comments = "" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid letter ID",
      });
    }

    if (!["approved", "rejected"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be approved or rejected",
      });
    }

    if (
      action === "rejected" &&
      (typeof comments !== "string" || !comments.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Comments are required when rejecting a letter",
      });
    }

    const letter = await Letter.findById(id);

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: "Letter not found",
      });
    }

    if (letter.status !== "pending_approval") {
      return res.status(400).json({
        success: false,
        message: "Only letters pending approval can be reviewed",
      });
    }

    const approvalRequest = await ApprovalRequest.findOne({
      requestType: "Letter",
      resourceId: letter._id,
      status: "pending",
    });

    if (!approvalRequest) {
      return res.status(404).json({
        success: false,
        message: "Pending approval request not found",
      });
    }

    approvalRequest.status = action;
    approvalRequest.approverId = req.user.id;
    approvalRequest.comments = comments.trim();
    approvalRequest.reviewedAt = new Date();

    letter.status = action === "approved" ? "approved" : "draft";

    await approvalRequest.save();
    await letter.save();

    return res.status(200).json({
      success: true,
      message:
        action === "approved"
          ? "Letter approved successfully"
          : "Letter rejected successfully",
      data: {
        letter,
        approvalRequest,
      },
    });
  } catch (error) {
    console.error("Letter approval error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process letter approval",
      debug: error.message,
    });
  }
};



const regenerateLetter = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid letter ID",
      });
    }

    const letter = await Letter.findById(id);

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: "Letter not found",
      });
    }

    // Do not modify a letter while approval is in progress.
    if (letter.status === "pending_approval") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot regenerate a letter while approval is pending",
      });
    }

    const oldVersion = letter.version;
    const oldPdfUrl = letter.pdfUrl;

    // Preserve the existing PDF version in history.
    if (oldPdfUrl) {
      letter.previousVersions.push({
        version: oldVersion,
        pdfUrl: oldPdfUrl,
        generatedAt: new Date(),
      });
    }

    // Start a new version.
    letter.version = oldVersion + 1;
    letter.pdfUrl = null;
    letter.status = "draft";

    await letter.save();

    // Reuse the existing PDF generation function.
    // It will generate and download the new version.
    return await getLetterPdf(req, res);
  } catch (error) {
    console.error("Regenerate letter error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to regenerate letter",
        debug: error.message,
      });
    }
  }
};


const deleteLetter = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid letter ID",
      });
    }

    const letter = await Letter.findById(id);

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: "Letter not found",
      });
    }

    if (letter.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft letters can be deleted",
      });
    }

    await Letter.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Draft letter deleted successfully",
    });
  } catch (error) {
    console.error("Delete letter error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete letter",
    });
  }
};

module.exports = {
  getLetters,
  createLetter,
  getLetterById,
  getLetterPdf,
  submitLetter,
  decideLetterApproval,
  regenerateLetter,
  deleteLetter,
};
