const fs = require("fs");
const path = require("path");

const Document = require("../../models/Document");
const Employee = require("../../models/Employee/Employee");

const ALLOWED_DOCUMENT_TYPES = [
  "resume",
  "aadhaar",
  "pan",
  "educational_certificate",
  "experience_letter",
  "other",
];

const removeUploadedFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// GET /api/employee/documents
const getMyEmployeeDocuments = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const documents = await Document.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Employee documents fetched successfully",
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error("Get Employee Documents Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee documents",
    });
  }
};

// POST /api/employee/documents
const uploadEmployeeDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a document file",
      });
    }

    const { documentType, documentName } = req.body;

    if (
      !documentType ||
      !ALLOWED_DOCUMENT_TYPES.includes(documentType)
    ) {
      removeUploadedFile(req.file.path);

      return res.status(400).json({
        success: false,
        message: "Invalid document type",
      });
    }

    if (
      typeof documentName !== "string" ||
      !documentName.trim()
    ) {
      removeUploadedFile(req.file.path);

      return res.status(400).json({
        success: false,
        message: "Document name is required",
      });
    }

    const employee = await Employee.findOne({ user: req.user.id });

    if (!employee) {
      removeUploadedFile(req.file.path);

      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const document = await Document.create({
      user: req.user.id,
      documentType,
      documentName: documentName.trim(),
      fileUrl: `/uploads/candidate-documents/${req.file.filename}`,
      status: "pending",
      uploadedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Employee document uploaded successfully",
      document,
    });
  } catch (error) {
    if (req.file) {
      removeUploadedFile(req.file.path);
    }

    console.error("Upload Employee Document Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload employee document",
    });
  }
};

// PATCH /api/employee/documents/:id
const updateEmployeeDocument = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      if (req.file) {
        removeUploadedFile(req.file.path);
      }

      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload the corrected document",
      });
    }

    const employee = await Employee.findOne({ user: req.user.id });

    if (!employee) {
      removeUploadedFile(req.file.path);

      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const document = await Document.findOne({
      _id: id,
      user: req.user.id,
    });

    if (!document) {
      removeUploadedFile(req.file.path);

      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    if (document.status !== "rejected") {
      removeUploadedFile(req.file.path);

      return res.status(400).json({
        success: false,
        message: "Only rejected documents can be re-uploaded",
      });
    }

    const oldFileUrl = document.fileUrl;

    document.fileUrl =
      `/uploads/candidate-documents/${req.file.filename}`;

    document.status = "pending";
    document.rejectionReason = "";
    document.uploadedAt = new Date();

    await document.save();

    // Remove the old local file only after the new file is saved.
    if (oldFileUrl) {
      const filename = path.basename(oldFileUrl);
      const oldFilePath = path.resolve(
        process.cwd(),
        "uploads",
        "candidate-documents",
        filename
      );

      const uploadDirectory = path.resolve(
        process.cwd(),
        "uploads",
        "candidate-documents"
      );

      if (
        oldFilePath.startsWith(uploadDirectory + path.sep) &&
        fs.existsSync(oldFilePath)
      ) {
        fs.unlinkSync(oldFilePath);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Employee document re-uploaded successfully",
      document,
    });
  } catch (error) {
    if (req.file) {
      removeUploadedFile(req.file.path);
    }

    console.error("Update Employee Document Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update employee document",
    });
  }
};

module.exports = {
  getMyEmployeeDocuments,
  uploadEmployeeDocument,
  updateEmployeeDocument,
};