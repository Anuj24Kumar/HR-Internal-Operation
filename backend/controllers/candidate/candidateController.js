const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Candidate = require("../../models/Candidate");
const User = require("../../models/User");
const Document = require("../../models/Document");
const Offer = require("../../models/Offer");
const AuditLogs = require("../../models/AuditLogs");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const notArchived = { isArchived: false, archived: false };
const uploadPath = (filename) =>
  path.join(__dirname, "..", "..", "uploads", "candidate-documents", path.basename(filename));

const cleanupUploadedFile = (req) => {
  if (!req.file?.filename) return;
  try {
    const file = uploadPath(req.file.filename);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  } catch (error) {
    console.error("Uploaded file cleanup error:", error.message);
  }
};

const createCandidate = async (req, res) => {
  try {
    const { name, email, phone, position, source } = req.body;
    if (![name, email, phone, position].every((value) => typeof value === "string" && value.trim())) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone and position are required",
      });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const duplicate = await Candidate.findOne({
      $or: [{ email: normalizedEmail }, { phone: phone.trim() }],
    });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Candidate with this email or phone already exists",
      });
    }
    const candidate = await Candidate.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      position: position.trim(),
      source: typeof source === "string" && source.trim() ? source.trim() : "Other",
      applicationSource: typeof source === "string" && source.trim() ? source.trim() : "Other",
      status: "applied",
      createdBy: req.user.id,
    });
    return res.status(201).json({
      success: true,
      message: "Candidate created successfully",
      data: candidate,
    });
  } catch (error) {
    console.error("Create candidate error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getCandidates = async (req, res) => {
  try {
    const { status, position, source, page = 1, limit = 10 } = req.query;
    const filter = { ...notArchived };
    if (status) filter.status = status;
    if (position) filter.position = position;
    if (source) filter.$or = [{ source }, { applicationSource: source }];
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
    const [candidates, total] = await Promise.all([
      Candidate.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize),
      Candidate.countDocuments(filter),
    ]);
    return res.status(200).json({
      success: true,
      data: candidates,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Get candidates error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getCandidateById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid candidate ID" });
    }
    const candidate = await Candidate.findOne({ _id: req.params.id, ...notArchived });
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }
    return res.status(200).json({ success: true, data: candidate });
  } catch (error) {
    console.error("Get candidate error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid candidate ID" });
    }
    const fields = ["name", "email", "phone", "position", "source", "resumeUrl"];
    const updates = {};
    for (const field of fields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    if (!Object.keys(updates).length) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }
    if (updates.email !== undefined) {
      if (typeof updates.email !== "string" || !updates.email.trim()) {
        return res.status(400).json({ success: false, message: "Email cannot be empty" });
      }
      updates.email = updates.email.trim().toLowerCase();
      if (await Candidate.findOne({ email: updates.email, _id: { $ne: id } })) {
        return res.status(409).json({ success: false, message: "Email already exists" });
      }
    }
    if (updates.source !== undefined) updates.applicationSource = updates.source;
    const candidate = await Candidate.findOneAndUpdate(
      { _id: id, ...notArchived },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Candidate updated successfully",
      data: candidate,
    });
  } catch (error) {
    console.error("Update candidate error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateCandidateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const statuses = ["applied", "screening", "interview", "selected", "rejected"];
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid candidate ID" });
    }
    if (!statuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status", allowedStatuses: statuses });
    }
    const candidate = await Candidate.findOneAndUpdate(
      { _id: id, ...notArchived },
      { $set: { status } },
      { new: true, runValidators: true }
    );
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Candidate status updated successfully",
      data: candidate,
    });
  } catch (error) {
    console.error("Update candidate status error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const selectCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const { selectedAs } = req.body;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid candidate ID" });
    }
    if (!["intern", "employee"].includes(selectedAs)) {
      return res.status(400).json({ success: false, message: "selectedAs must be intern or employee" });
    }
    const candidate = await Candidate.findOneAndUpdate(
      { _id: id, ...notArchived },
      { $set: { status: "selected", selectedAs } },
      { new: true, runValidators: true }
    );
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }
    return res.status(200).json({ success: true, message: "Candidate selected successfully", data: candidate });
  } catch (error) {
    console.error("Select candidate error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const archiveCandidate = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid candidate ID" });
    }
    const candidate = await Candidate.findOneAndUpdate(
      { _id: req.params.id, ...notArchived },
      { $set: { isArchived: true, archived: true } },
      { new: true }
    );
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found or already archived" });
    }
    return res.status(200).json({ success: true, message: "Candidate archived successfully", data: candidate });
  } catch (error) {
    console.error("Archive candidate error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid candidate ID" });
    }
    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }
    await AuditLogs.create({
      userId: req.user.id,
      action: "DELETE",
      entity: "Candidate",
      entityId: candidate._id,
      details: `Candidate deleted: ${candidate.name} (${candidate.email})`,
      ipAddress: req.ip,
    });
    await Candidate.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "Candidate deleted successfully" });
  } catch (error) {
    console.error("Delete candidate error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to delete candidate" });
  }
};

const getMyApplication = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({
      $or: [{ user: req.user.id }, { userId: req.user.id }],
      archived: false,
      isArchived: false,
    }).select("position applicationSource source appliedDate status");
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate application not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Application fetched successfully",
      application: {
        position: candidate.position,
        applicationSource: candidate.applicationSource || candidate.source,
        appliedDate: candidate.appliedDate,
        status: candidate.status,
      },
    });
  } catch (error) {
    console.error("Get application error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "firstName lastName name email phone profileImage createdAt"
    );
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const candidate = await Candidate.findOne({
      $or: [{ user: req.user.id }, { userId: req.user.id }],
      archived: false,
      isArchived: false,
    }).select("position applicationSource source appliedDate status");
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate profile not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Candidate profile fetched successfully",
      profile: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        position: candidate.position,
        applicationSource: candidate.applicationSource || candidate.source,
        appliedDate: candidate.appliedDate,
        applicationStatus: candidate.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get candidate profile error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getMyDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ user: req.user.id })
      .select("documentType documentName fileUrl status rejectionReason uploadedAt createdAt")
      .sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      message: "Candidate documents fetched successfully",
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error("Get candidate documents error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const uploadCandidateDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload a document" });
    }
    const { documentType, documentName } = req.body;
    const types = ["resume", "aadhaar", "pan", "educational_certificate", "experience_letter", "other"];
    if (typeof documentName !== "string" || !documentName.trim() || !types.includes(documentType)) {
      cleanupUploadedFile(req);
      return res.status(400).json({
        success: false,
        message: "A valid document type and document name are required",
      });
    }
    const document = await Document.create({
      user: req.user.id,
      documentType,
      documentName: documentName.trim(),
      originalName: documentName.trim(),
      fileName: req.file.filename,
      filePath: req.file.path,
      fileUrl: `/uploads/candidate-documents/${req.file.filename}`,
      mimeType: req.file.mimetype,
      size: req.file.size,
      status: "pending",
      uploadedBy: req.user.id,
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
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateCandidateDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload the corrected document" });
    }
    const document = await Document.findOne({ _id: req.params.id, user: req.user.id });
    if (!document) {
      cleanupUploadedFile(req);
      return res.status(404).json({ success: false, message: "Document not found" });
    }
    if (!["rejected", "Rejected"].includes(document.status)) {
      cleanupUploadedFile(req);
      return res.status(403).json({ success: false, message: "Only rejected documents can be re-uploaded" });
    }
    const oldPath = document.filePath;
    const oldUrl = document.fileUrl;
    document.fileName = req.file.filename;
    document.filePath = req.file.path;
    document.fileUrl = `/uploads/candidate-documents/${req.file.filename}`;
    document.mimeType = req.file.mimetype;
    document.size = req.file.size;
    document.status = "pending";
    document.rejectionReason = "";
    document.uploadedAt = new Date();
    await document.save();
    const previousFile = oldPath && path.isAbsolute(oldPath)
      ? oldPath
      : oldUrl ? uploadPath(path.basename(oldUrl)) : null;
    if (previousFile && fs.existsSync(previousFile)) {
      try {
        fs.unlinkSync(previousFile);
      } catch (error) {
        console.error("Old document cleanup error:", error.message);
      }
    }
    return res.status(200).json({ success: true, message: "Rejected document re-uploaded successfully", document });
  } catch (error) {
    cleanupUploadedFile(req);
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid document ID" });
    }
    console.error("Re-upload candidate document error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const deleteCandidateDocument = async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, user: req.user.id });
    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }
    if (!["pending", "Pending"].includes(document.status)) {
      return res.status(403).json({ success: false, message: "Only pending documents can be deleted" });
    }
    await Document.findByIdAndDelete(document._id);
    const storedPath = document.filePath && path.isAbsolute(document.filePath)
      ? document.filePath
      : document.fileUrl ? uploadPath(path.basename(document.fileUrl)) : null;
    if (storedPath && fs.existsSync(storedPath)) {
      try {
        fs.unlinkSync(storedPath);
      } catch (error) {
        console.error("Deleted document file cleanup error:", error.message);
      }
    }
    return res.status(200).json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid document ID" });
    }
    console.error("Delete candidate document error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getMyOffer = async (req, res) => {
  try {
    const offer = await Offer.findOne({
      $or: [{ candidate: req.user.id }, { candidateId: { $in: await Candidate.find({
        $or: [{ user: req.user.id }, { userId: req.user.id }],
      }).distinct("_id") } }],
      status: { $in: ["sent", "Sent"] },
    }).select("-createdBy -approvalId");
    if (!offer) {
      return res.status(404).json({ success: false, message: "No offer found for your account." });
    }
    return res.status(200).json({
      success: true,
      message: "Candidate offer fetched successfully",
      offer,
    });
  } catch (error) {
    console.error("Get candidate offer error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch candidate offer" });
  }
};

module.exports = {
  createCandidate,
  getCandidates,
  getCandidateById,
  updateCandidate,
  updateCandidateStatus,
  selectCandidate,
  archiveCandidate,
  deleteCandidate,
  getMyApplication,
  getMyProfile,
  getMyDocuments,
  uploadCandidateDocument,
  updateCandidateDocument,
  deleteCandidateDocument,
  getMyOffer,
};
