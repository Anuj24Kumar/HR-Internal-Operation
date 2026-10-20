const Candidate = require("../models/Candidate");
const User = require("../models/User");
const Document = require("../models/Document");
const fs = require("fs");
const path = require("path");
const Offer = require("../models/Offer");

// ==========================================
// HELPER: GET UPLOADED FILE PATH
// ==========================================
const getUploadedFilePath = (filename) => {
  return path.join(
    __dirname,
    "../uploads/candidate-documents",
    path.basename(filename)
  );
};

// ==========================================
// HELPER: DELETE LOCAL FILE SAFELY
// ==========================================
const deleteLocalFile = (filename) => {
  if (!filename) return;

  const filePath = getUploadedFilePath(filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// ==========================================
// HELPER: CLEAN UP NEWLY UPLOADED FILE
// ==========================================
const cleanupUploadedFile = (req) => {
  if (req.file?.filename) {
    try {
      deleteLocalFile(req.file.filename);
    } catch (error) {
      console.error("Uploaded file cleanup error:", error.message);
    }
  }
};

// ==========================================
// GET MY APPLICATION
// ==========================================
const getMyApplication = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({
      user: req.user.id,
      archived: false,
    }).select("position applicationSource appliedDate status");

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate application not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Application fetched successfully",
      application: {
        position: candidate.position,
        applicationSource: candidate.applicationSource,
        appliedDate: candidate.appliedDate,
        status: candidate.status,
      },
    });
  } catch (error) {
    console.error("Get application error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// GET MY CANDIDATE PROFILE
// ==========================================
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "firstName lastName email phone profileImage createdAt"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const candidate = await Candidate.findOne({
      user: req.user.id,
      archived: false,
    }).select("position applicationSource appliedDate status");

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Candidate profile fetched successfully",
      profile: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        position: candidate.position,
        applicationSource: candidate.applicationSource,
        appliedDate: candidate.appliedDate,
        applicationStatus: candidate.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get candidate profile error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// GET MY CANDIDATE DOCUMENTS
// ==========================================
const getMyDocuments = async (req, res) => {
  try {
    const documents = await Document.find({
      user: req.user.id,
    })
      .select(
        "documentType documentName fileUrl status rejectionReason uploadedAt createdAt"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Candidate documents fetched successfully",
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error("Get candidate documents error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// UPLOAD CANDIDATE DOCUMENT
// ==========================================
const uploadCandidateDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a document",
      });
    }

    const { documentType, documentName } = req.body;

    if (
      typeof documentType !== "string" ||
      typeof documentName !== "string" ||
      !documentName.trim()
    ) {
      cleanupUploadedFile(req);

      return res.status(400).json({
        success: false,
        message: "Document type and document name are required",
      });
    }

    const allowedTypes = [
      "resume",
      "aadhaar",
      "pan",
      "educational_certificate",
      "experience_letter",
      "other",
    ];

    if (!allowedTypes.includes(documentType)) {
      cleanupUploadedFile(req);

      return res.status(400).json({
        success: false,
        message: "Invalid document type",
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
      message: "Document uploaded successfully",
      document: {
        id: document._id,
        documentType: document.documentType,
        documentName: document.documentName,
        fileUrl: document.fileUrl,
        status: document.status,
        uploadedAt: document.uploadedAt,
      },
    });
  } catch (error) {
    cleanupUploadedFile(req);

    console.error("Upload candidate document error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// RE-UPLOAD REJECTED CANDIDATE DOCUMENT
// ==========================================
const updateCandidateDocument = async (req, res) => {
  try {
    const { id } = req.params;

    // Require a corrected file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload the corrected document",
      });
    }

    const document = await Document.findOne({
      _id: id,
      user: req.user.id,
    });

    if (!document) {
      cleanupUploadedFile(req);

      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Only rejected documents can be re-uploaded
    if (document.status !== "rejected") {
      cleanupUploadedFile(req);

      return res.status(403).json({
        success: false,
        message: "Only rejected documents can be re-uploaded",
      });
    }

    const oldFileName = path.basename(document.fileUrl);

    // Update document record
    document.fileUrl =
      `/uploads/candidate-documents/${req.file.filename}`;

    document.status = "pending";
    document.rejectionReason = "";
    document.uploadedAt = new Date();

    await document.save();

    // Delete old file only after database save succeeds
    try {
      deleteLocalFile(oldFileName);
    } catch (cleanupError) {
      console.error(
        "Old document cleanup error:",
        cleanupError.message
      );
    }

    return res.status(200).json({
      success: true,
      message: "Rejected document re-uploaded successfully",
      document: {
        id: document._id,
        documentType: document.documentType,
        documentName: document.documentName,
        fileUrl: document.fileUrl,
        status: document.status,
        uploadedAt: document.uploadedAt,
      },
    });
  } catch (error) {
    cleanupUploadedFile(req);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    console.error("Re-upload candidate document error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// DELETE CANDIDATE DOCUMENT
// ==========================================
const deleteCandidateDocument = async (req, res) => {
  try {
    const { id } = req.params;

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

    // Candidate can delete pending documents only
    if (document.status !== "pending") {
      return res.status(403).json({
        success: false,
        message: "Only pending documents can be deleted",
      });
    }

    // Delete database record first
    const fileName = path.basename(document.fileUrl);

    await Document.findByIdAndDelete(document._id);

    // Remove the associated local file
    try {
      deleteLocalFile(fileName);
    } catch (cleanupError) {
      console.error(
        "Deleted document file cleanup error:",
        cleanupError.message
      );
    }

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    console.error("Delete candidate document error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET MY OFFER
const getMyOffer = async (req, res) => {
  try {
    const offer = await Offer.findOne({
      candidate: req.user.id,
      status: "sent",
    }).select("-createdBy -approvalId");

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "No offer found for your account.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Candidate offer fetched successfully",
      offer,
    });
  } catch (error) {
    console.error("Get My Offer Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch candidate offer",
    });
  }
};

// ==========================================
// EXPORT CANDIDATE CONTROLLERS
// ==========================================
module.exports = {
  getMyApplication,
  getMyProfile,
  getMyDocuments,
  uploadCandidateDocument,
  updateCandidateDocument,
  deleteCandidateDocument,
  getMyOffer,
};