const fs = require("fs");
const path = require("path");

const Document = require("../../models/Document");
const Intern = require("../../models/Intern/Intern");

// GET: Logged-in intern ke documents
const getMyDocuments = async (req, res) => {
  try {
    const intern = await Intern.findOne({
      user: req.user.id,
    });

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: "Intern profile not found",
      });
    }

    const documents = await Document.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

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

    const intern = await Intern.findOne({
      user: req.user.id,
    });

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: "Intern profile not found",
      });
    }

    const document = await Document.create({
      user: req.user.id,
      documentType,
      documentName: documentName.trim(),
      fileUrl: `/uploads/candidate-documents/${req.file.filename}`,
      status: "pending",
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

    const intern = await Intern.findOne({
      user: req.user.id,
    });

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: "Intern profile not found",
      });
    }

    const document = await Document.findOne({
      _id: id,
      user: req.user.id,
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
    document.uploadedAt = new Date();

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