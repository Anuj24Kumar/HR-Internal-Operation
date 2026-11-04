const fs = require("fs");
const path = require("path");

const { Document, User: Intern } = require("../../models");

// GET: Logged-in intern ke documents
const getMyDocuments = async (req, res) => {
  try {
    const intern = await Intern.findOne({ _id: req.user.id, role: "intern" });

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: "Intern profile not found",
      });
    }

    const documents = await Document.find({ ownerId: req.user.id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Intern documents fetched successfully",
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error("Get Intern Documents Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch intern documents",
    });
  }
};

// POST: Intern document upload
const uploadInternDocument = async (req, res) => {
  let uploadedFilePath;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a document",
      });
    }

    uploadedFilePath = req.file.path;

    const { documentType, documentName } = req.body;

    const allowedTypes = [
      "resume",
      "aadhaar",
      "pan",
      "educational_certificate",
      "experience_letter",
      "other",
    ];

    if (!allowedTypes.includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document type",
      });
    }

    if (
      typeof documentName !== "string" ||
      !documentName.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Document name is required",
      });
    }

    const intern = await Intern.findOne({ _id: req.user.id, role: "intern" });

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: "Intern profile not found",
      });
    }

    const document = await Document.create({
      ownerId: req.user.id,
      ownerRole: "intern",
      category: documentType === "resume" ? "resume" : "other",
      documentType,
      label: documentName.trim(),
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileUrl: `/uploads/candidate-documents/${req.file.filename}`,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      status: "pending",
      uploadedBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Intern document uploaded successfully",
      document,
    });
  } catch (error) {
    console.error("Upload Intern Document Error:", error);

    if (uploadedFilePath) {
      try {
        await fs.promises.unlink(uploadedFilePath);
      } catch (cleanupError) {
        console.error("Uploaded file cleanup failed:", cleanupError);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to upload intern document",
    });
  }
};

// PATCH: Re-upload a rejected intern document
const updateInternDocument = async (req, res) => {
  let uploadedFilePath;

  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload the replacement document",
      });
    }

    uploadedFilePath = req.file.path;

    const intern = await Intern.findOne({ _id: req.user.id, role: "intern" });

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: "Intern profile not found",
      });
    }

    const document = await Document.findOne({
      _id: id,
      ownerId: req.user.id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    if (document.status !== "rejected") {
      return res.status(403).json({
        success: false,
        message: "Only rejected documents can be re-uploaded",
      });
    }

    const oldFileUrl = document.fileUrl;

    document.fileUrl =
      `/uploads/candidate-documents/${req.file.filename}`;
    document.status = "pending";
    document.rejectionReason = "";
    document.originalName = req.file.originalname;
    document.fileName = req.file.filename;
    document.filePath = req.file.path;
    document.mimeType = req.file.mimetype;
    document.fileSize = req.file.size;

    await document.save();

    // Delete old local file after successful database update
    if (oldFileUrl) {
      const filename = path.basename(oldFileUrl);
      const oldFilePath = path.join(
        process.cwd(),
        "uploads",
        "candidate-documents",
        filename
      );

      if (oldFilePath !== uploadedFilePath) {
        try {
          await fs.promises.unlink(oldFilePath);
        } catch (cleanupError) {
          if (cleanupError.code !== "ENOENT") {
            console.error("Old file cleanup failed:", cleanupError);
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Intern document re-uploaded successfully",
      document,
    });
  } catch (error) {
    console.error("Update Intern Document Error:", error);

    if (uploadedFilePath) {
      try {
        await fs.promises.unlink(uploadedFilePath);
      } catch (cleanupError) {
        console.error("Replacement file cleanup failed:", cleanupError);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to re-upload intern document",
    });
  }
};

module.exports = {
  getMyDocuments,
  uploadInternDocument,
  updateInternDocument,
};