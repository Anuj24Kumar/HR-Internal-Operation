
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs/promises");
const Document = require("../models/Document");
const Candidate = require("../models/Candidate");
const Employee = require("../models/Employee");

const uploadDocument = async (req, res) => {
  let savedFilePath;

  try {
    const { candidateId, employeeId, documentType } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a document file",
      });
    }

    savedFilePath = req.file.path;

    if (
      Boolean(candidateId) === Boolean(employeeId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide exactly one of candidateId or employeeId",
      });
    }

    if (!documentType || !documentType.trim()) {
      return res.status(400).json({
        success: false,
        message: "documentType is required",
      });
    }

    const ownerId = candidateId || employeeId;

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid candidateId or employeeId",
      });
    }

    if (candidateId) {
      const candidate = await Candidate.findById(candidateId);

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: "Candidate not found",
        });
      }
    }

    if (employeeId) {
      const employee = await Employee.findById(employeeId);

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }
    }

    const document = await Document.create({
      candidateId: candidateId || null,
      employeeId: employeeId || null,
      documentType: documentType.trim(),
      originalName: path.basename(req.file.originalname),
      fileName: req.file.filename,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user.id,
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: document,
    });
 
  } catch (error) {
    console.error("Upload document error:", error);

    if (savedFilePath) {
      try {
        await fs.unlink(savedFilePath);
      } catch (cleanupError) {
        console.error(
          "File cleanup error:",
          cleanupError.message
        );
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to upload document",
      debug: error.message,
      errorName: error.name,
    });
  }

};


const getDocuments = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status) {
      const allowedStatuses = ["Pending", "Verified", "Rejected"];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status filter",
          allowedStatuses,
        });
      }

      filter.status = status;
    }

    const documents = await Document.find(filter)
      .populate("candidateId")
      .populate("employeeId")
      .populate("uploadedBy", "name email")
      .populate("verifiedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    console.error("Get documents error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch documents",
    });
  }
};


const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    const document = await Document.findById(id)
      .populate("candidateId")
      .populate("employeeId")
      .populate("uploadedBy", "name email")
      .populate("verifiedBy", "name email");

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error("Get document by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch document",
    });
  }
};


const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const filePath = path.resolve(document.filePath);

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        message: "Document file not found in storage",
      });
    }

    return res.download(filePath, document.originalName);
  } catch (error) {
    console.error("Download document error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to download document",
      });
    }
  }
};


const verifyDocument = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    if (document.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot verify a document with status ${document.status}`,
      });
    }

    document.status = "Verified";
    document.verifiedBy = req.user.id;
    document.verifiedAt = new Date();
    document.rejectionReason = "";

    await document.save();

    return res.status(200).json({
      success: true,
      message: "Document verified successfully",
      data: document,
    });
  } catch (error) {
    console.error("Verify document error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify document",
    });
  }
};


const rejectDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    if (typeof reason !== "string" || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    if (document.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot reject a document with status ${document.status}`,
      });
    }

    document.status = "Rejected";
    document.rejectionReason = reason.trim();
    document.verifiedBy = req.user.id;
    document.verifiedAt = new Date();

    await document.save();

    return res.status(200).json({
      success: true,
      message: "Document rejected successfully",
      data: document,
    });
  } catch (error) {
    console.error("Reject document error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reject document",
    });
  }
};


const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const filePath = path.resolve(document.filePath);

    // Delete the stored file first.
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error("Document file deletion error:", error);

        return res.status(500).json({
          success: false,
          message: "Could not delete document file",
        });
      }
    }

    await Document.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Document record and stored file deleted successfully",
      data: { id },
    });
  } catch (error) {
    console.error("Delete document error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete document",
    });
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  getDocumentById,
  downloadDocument,
  verifyDocument,
  rejectDocument,
  deleteDocument,
};
