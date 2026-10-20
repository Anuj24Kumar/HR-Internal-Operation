
const mongoose = require("mongoose");
const Letter = require("../models/Letter");
const Employee = require("../models/Employee");
const ApprovalRequest = require("../models/ApprovalRequest");

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// GET: List all generated letters
const getLetters = async (req, res) => {
  try {
    const letters = await Letter.find()
      .populate("employeeId", "empId type department designation")
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
    const { employeeId, letterType, template = "default" } = req.body;

    if (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Valid employeeId is required",
      });
    }

    if (!letterType || !letterType.trim()) {
      return res.status(400).json({
        success: false,
        message: "letterType is required",
      });
    }

    if (typeof template !== "string" || !template.trim()) {
      return res.status(400).json({
        success: false,
        message: "Valid template is required",
      });
    }

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const placeholders = {
      empId: employee.empId,
      name: employee.personalInfo?.name || "",
      email: employee.personalInfo?.email || "",
      department: employee.department,
      designation: employee.designation,
      joiningDate: employee.joiningDate,
      salary: employee.salary,
    };

    const letter = await Letter.create({
      employeeId,
      letterType: letterType.trim(),
      template: template.trim(),
      placeholders,
      createdBy: req.user.id,
      status: "Draft",
      version: 1,
    });

    const createdLetter = await Letter.findById(letter._id)
      .populate("employeeId", "empId type department designation")
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
      .populate("createdBy", "name email");

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: "Letter not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: letter,
    });
  } catch (error) {
    console.error("Get letter error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch letter",
    });
  }
};

// The following endpoints are placeholders for the next implementation steps.

const getLetterPdf = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid letter ID",
      });
    }

    const letter = await Letter.findById(id).populate("employeeId");

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: "Letter not found",
      });
    }

    if (!letter.employeeId) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Create storage folder if it doesn't exist.
const storageDir = path.resolve(
  __dirname,
  "..",
  "uploads",
  "letters"
);

await fs.promises.mkdir(storageDir, {
  recursive: true,
});

    // Use a predictable filename for the current version.
    const filename = `letter-${letter._id}-v${letter.version}.pdf`;
    const filePath = path.join(storageDir, filename);
    const relativeUrl = `/uploads/letters/${filename}`;

    // Reuse the stored PDF if it already exists.
    if (letter.pdfUrl && fs.existsSync(filePath)) {
      return res.download(filePath, filename);
    }

    const employee = letter.employeeId;
    const p = letter.placeholders || {};

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: letter.letterType,
        Author: "HR Department",
      },
    });
console.log("PDF storage directory:", storageDir);
console.log("Directory exists:", fs.existsSync(storageDir));
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .text(letter.letterType.toUpperCase(), { align: "center" });

    doc.moveDown(2);
    doc.font("Helvetica").fontSize(11);

    doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`);
    doc.text(`Employee ID: ${p.empId || employee.empId || "N/A"}`);

    doc.moveDown();
    doc.text(`Dear ${p.name || "Employee"},`);
    doc.moveDown();

    if (letter.letterType === "Experience Letter") {
      doc.text(
        `This letter confirms that ${p.name || "the employee"} was associated with our organization as ${p.designation || employee.designation || "N/A"} in the ${p.department || employee.department || "N/A"} department.`
      );

      doc.moveDown();

      doc.text(
        `The recorded joining date is ${
          p.joiningDate
            ? new Date(p.joiningDate).toLocaleDateString("en-IN")
            : "not available"
        }. We appreciate the employee's contribution to the organization.`
      );
    } else {
      doc.text(
        `This letter has been generated for ${p.name || "the employee"} regarding ${letter.letterType}.`
      );

      doc.moveDown();
      doc.text(
        `Designation: ${p.designation || employee.designation || "N/A"}`
      );
      doc.text(
        `Department: ${p.department || employee.department || "N/A"}`
      );
    }

    doc.moveDown(2);
    doc.text("Regards,");
    doc.moveDown();
    doc.font("Helvetica-Bold").text("HR Department");
    doc.font("Helvetica").text("Company Representative");

    doc.moveDown(2);
    doc
      .fontSize(8)
      .fillColor("gray")
      .text(`Letter Reference: ${letter._id} | Version: ${letter.version}`, {
        align: "center",
      });

    // Wait for the PDF file to finish writing.
    const fileSaved = new Promise((resolve, reject) => {
  writeStream.once("finish", resolve);
  writeStream.once("error", (error) => {
    console.error("PDF file write error:", error);
    reject(error);
  });

  doc.once("error", (error) => {
    console.error("PDF document error:", error);
    reject(error);
  });
});

doc.end();
await fileSaved;

    // Persist the URL in MongoDB.
    letter.pdfUrl = relativeUrl;
    await letter.save();

    return res.download(filePath, filename);
 
} catch (error) {
  console.error("Generate letter PDF error:", error);

  if (!res.headersSent) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate and save letter PDF",
      debug: error.message,
      code: error.code || null,
    });
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
    if (letter.status !== "Draft") {
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
      status: "Pending",
      submittedAt: new Date(),
    });

    // Update letter status
    letter.status = "Pending Approval";
    letter.submittedAt = new Date();

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

    if (letter.status !== "Pending Approval") {
      return res.status(400).json({
        success: false,
        message: "Only letters pending approval can be reviewed",
      });
    }

    const approvalRequest = await ApprovalRequest.findOne({
      requestType: "Letter",
      resourceId: letter._id,
      status: "Pending",
    });

    if (!approvalRequest) {
      return res.status(404).json({
        success: false,
        message: "Pending approval request not found",
      });
    }

    approvalRequest.status =
      action === "approved" ? "Approved" : "Rejected";
    approvalRequest.approverId = req.user.id;
    approvalRequest.comments = comments.trim();
    approvalRequest.reviewedAt = new Date();

    letter.status =
      action === "approved" ? "Approved" : "Rejected";

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
    if (letter.status === "Pending Approval") {
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
    letter.status = "Draft";
    letter.submittedAt = null;

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

    if (letter.status !== "Draft") {
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
