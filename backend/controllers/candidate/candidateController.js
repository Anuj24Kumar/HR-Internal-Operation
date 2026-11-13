const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const {
  User: Candidate,
  User,
  Document,
  Offer,
  Application,
  Interview,
} = require("../../models");
const { notifyMany, notify } = require("../../utils/notificationHelper");
const { recordAuditLog } = require("../../utils/auditLogger");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const notArchived = { isActive: { $ne: false } };
const uploadPath = (filename) =>
  path.join(__dirname, "..", "..", "uploads", "candidate-documents", path.basename(filename));

const latestApplicationFor = (candidateId) =>
  Application.findOne({ candidateId }).sort({ createdAt: -1 });

const applicationStatus = (status) => {
  const normalized = String(status || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return normalized === "offer" ? "offer_sent" : normalized;
};

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
    const candidate = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      position: position.trim(),
      password: crypto.randomBytes(24).toString("hex"),
      passwordResetRequired: true,
      createdBy: req.user.id,
    });
    const application = await Application.create({
      candidateId: candidate._id,
      candidateName: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      position: candidate.position,
      jobType: /intern/i.test(position) ? "internship" : "full_time",
      source: typeof source === "string" && source.trim() ? source.trim() : "other",
    });
    return res.status(201).json({
      success: true,
      message: "Candidate created successfully",
      data: { ...candidate.toJSON(), status: application.status, applicationId: application._id },
    });
  } catch (error) {
    console.error("Create candidate error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getCandidates = async (req, res) => {
  try {
    const {
      status,
      position,
      source,
      search,
      page = 1,
      limit = 10,
    } = req.query;
    const includeSelected = String(req.query.includeSelected).toLowerCase() === "true";
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
    const roleFilter = includeSelected
      ? { $in: ["candidate", "intern", "employee"] }
      : "candidate";
    const userFilter = { role: roleFilter, isActive: true };
    if (search) {
      const escapedSearch = String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      userFilter.$or = [
        { name: new RegExp(escapedSearch, "i") },
        { email: new RegExp(escapedSearch, "i") },
      ];
    }

    const users = await User.find(userFilter).sort({ createdAt: -1 }).lean();
    const userIds = users.map((user) => user._id);
    const applications = await Application.find({ candidateId: { $in: userIds } })
      .sort({ createdAt: -1 })
      .lean();
    const appByCandidate = new Map();
    for (const app of applications) {
      const key = String(app.candidateId);
      if (!appByCandidate.has(key)) appByCandidate.set(key, app);
    }
    const candidates = users.map((user) => {
      const application = appByCandidate.get(String(user._id));
      return {
        ...user,
        status: application?.status || "not_applied",
        source: application?.source,
        applicationSource: application?.source,
        jobType: application?.jobType,
        appliedDate: application?.createdAt,
        resumeUrl: application?.resumeUrl || user.resumeUrl,
        applicationId: application?._id || null,
        latestApplication: application || null,
      };
    }).filter((candidate) => {
      const application = candidate.latestApplication;
      if (status && status !== "all" &&
          application?.status !== applicationStatus(status)) return false;
      if (position && !String(application?.position || "").toLowerCase()
        .includes(String(position).toLowerCase())) return false;
      if (source && application?.source !== source) return false;
      if (req.query.jobType && req.query.jobType !== "all") {
        const requestedType = applicationStatus(req.query.jobType) === "internship"
          ? "internship"
          : "full_time";
        if (application?.jobType !== requestedType) return false;
      }
      return true;
    });
    const total = candidates.length;
    const pagedCandidates = candidates.slice(
      (pageNumber - 1) * pageSize,
      pageNumber * pageSize
    );
    const pageIds = pagedCandidates.map((candidate) => candidate._id);
    const interviews = await Interview.find({ candidateId: { $in: pageIds } })
      .populate("interviewerId", "name firstName lastName email")
      .sort({ scheduledAt: 1 })
      .lean();
    const interviewsByCandidate = new Map();
    for (const interview of interviews) {
      const key = String(interview.candidateId);
      if (!interviewsByCandidate.has(key)) interviewsByCandidate.set(key, []);
      interviewsByCandidate.get(key).push(interview);
    }
    const pagedResults = pagedCandidates.map(({ latestApplication, ...candidate }) => ({
      ...candidate,
      position: latestApplication?.position || candidate.position,
      interviews: interviewsByCandidate.get(String(candidate._id)) || [],
    }));
    return res.status(200).json({
      success: true,
      data: pagedResults,
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
    const candidate = await User.findOne({
      _id: req.params.id,
      role: { $in: ["candidate", "intern", "employee"] },
      ...notArchived,
    }).lean();
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }
    const [applications, interviews, offers, documents] = await Promise.all([
      Application.find({ candidateId: candidate._id }).sort({ createdAt: -1 }).lean(),
      Interview.find({ candidateId: candidate._id }).populate("interviewerId", "name firstName lastName email").lean(),
      Offer.find({ candidateId: candidate._id }).sort({ createdAt: -1 }).lean(),
      Document.find({ ownerId: candidate._id }).sort({ createdAt: -1 }).lean(),
    ]);
    const application = applications[0];
    return res.status(200).json({
      success: true,
      data: {
        ...candidate,
        status: application?.status || "not_applied",
        source: application?.source,
        applicationSource: application?.source,
        jobType: application?.jobType,
        applicationId: application?._id,
        applications,
        interviews,
        offers,
        documents,
      },
    });
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
    const fields = ["name", "email", "phone", "position", "resumeUrl"];
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
    const source = req.body.source;
    const candidate = await User.findOneAndUpdate(
      { _id: id, role: { $in: ["candidate", "intern", "employee"] }, ...notArchived },
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }
    const application = await latestApplicationFor(candidate._id);
    if (application) {
      for (const field of ["name", "email", "phone", "position", "resumeUrl"]) {
        const appField = field === "name" ? "candidateName" : field;
        if (updates[field] !== undefined) application[appField] = updates[field];
      }
      if (source !== undefined) application.source = source;
      await application.save();
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

const archiveCandidate = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid candidate ID" });
    }
    const candidate = await User.findOneAndUpdate(
      { _id: req.params.id, role: { $in: ["candidate", "intern", "employee"] }, ...notArchived },
      { $set: { isActive: false, status: "inactive" } },
      { returnDocument: 'after' }
    );
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found or already inactive" });
    }
    return res.status(200).json({ success: true, message: "Candidate deactivated successfully", data: candidate });
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
    const candidate = await User.findById(id);
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }
    await recordAuditLog({
      userId: req.user.id,
      action: "delete",
      module: "Candidate",
      entityId: candidate._id,
      oldValue: { name: candidate.name, email: candidate.email },
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
    const candidate = await User.findOne({ _id: req.user.id, role: "candidate" }).select("position resumeUrl");
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate profile not found" });
    }

    const application = await latestApplicationFor(candidate._id);
    if (!application) {
      return res.status(200).json({
        success: true,
        message: "No application has been submitted",
        application: null,
      });
    }
    const interviews = await Interview.find({ candidateId: candidate._id, applicationId: application._id })
      .populate("interviewerId", "name firstName lastName email")
      .sort({ scheduledAt: 1, createdAt: -1 })
      .lean();
    return res.status(200).json({
      success: true,
      message: "Application fetched successfully",
      application: {
        position: candidate.position,
        applicationSource: application.source,
        appliedDate: application.createdAt,
        status: application.status,
        interviews,
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
      "firstName lastName name email phone profileImage role position resumeUrl createdAt"
    );
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const application = await latestApplicationFor(user._id);
    return res.status(200).json({
      success: true,
      message: "Candidate profile fetched successfully",
      profile: {
        ...(user.toJSON ? user.toJSON() : user.toObject()),
        position: application?.position || user.position,
        applicationSource: application?.source,
        appliedDate: application?.createdAt,
        applicationStatus: application?.status,
      },
    });
  } catch (error) {
    console.error("Get candidate profile error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getMyDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ ownerId: req.user.id })
      .select("offerId documentType label originalName fileName fileUrl status rejectionReason createdAt fileSize")
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
    const { documentType, documentName } = req.body;

    const types = [
      "resume",
      "aadhaar",
      "pan",
      "educational_certificate",
      "experience_letter",
      "other",
    ];

    // Check uploaded file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a document.",
      });
    }
    if (
      typeof documentName !== "string" ||
      !documentName.trim() ||
      !types.includes(documentType)
    ) {
      cleanupUploadedFile(req);
      return res.status(400).json({
        success: false,
        message: "Invalid document type or document name.",
      });
    }

    const category = documentType === "resume" ? "resume"
      : ["aadhaar", "pan"].includes(documentType) ? "identity"
        : documentType === "educational_certificate" ? "education"
          : documentType === "experience_letter" ? "experience" : "other";
    const document = await Document.create({
      ownerId: req.user.id,
      ownerRole: "candidate",
      category,
      documentType,
      label: documentName.trim(),
      originalName: documentName.trim(),

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
      message: "Candidate document uploaded successfully.",
      document,
    });
  } catch (error) {
    cleanupUploadedFile(req);

    console.error("Upload candidate document error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload candidate document.",
    });
  }
};

const updateCandidateDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload the corrected document" });
    }
    const document = await Document.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!document) {
      cleanupUploadedFile(req);
      return res.status(404).json({ success: false, message: "Document not found" });
    }
    if (document.status !== "pending") {
      cleanupUploadedFile(req);
      return res.status(403).json({ success: false, message: "Only pending documents can be updated" });
    }
    const oldPath = document.filePath;
    const oldUrl = document.fileUrl;
    document.fileName = req.file.filename;
    document.filePath = req.file.path;
    document.fileUrl = `/uploads/candidate-documents/${req.file.filename}`;
    document.mimeType = req.file.mimetype;
    document.fileSize = req.file.size;
    document.status = "pending";
    document.rejectionReason = "";
    await document.save();
    await recordAuditLog({
      userId: req.user.id,
      action: "update",
      module: "candidate_document",
      entityId: document._id,
      oldValue: { fileUrl: oldUrl },
      newValue: { fileUrl: document.fileUrl, status: document.status },
    });
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
    return res.status(200).json({ success: true, message: "Document updated successfully", document });
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
    const document = await Document.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }
    if (document.status !== "pending") {
      return res.status(403).json({ success: false, message: "Only pending documents can be deleted" });
    }
    await recordAuditLog({
      userId: req.user.id,
      action: "delete",
      module: "candidate_document",
      entityId: document._id,
      oldValue: { label: document.label, status: document.status },
    });
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
    let offer = await Offer.findOne({
      candidateId: req.user.id,
      status: { $in: ["sent", "offer_received", "accepted"] },
    })
      .populate("candidateId", "name email")
      .sort({ createdAt: -1 });

    if (!offer) {
      const application = await latestApplicationFor(req.user.id);
      if (application) {
        offer = await Offer.findOne({
          applicationId: application._id,
          status: { $in: ["sent", "offer_received", "accepted"] },
        })
          .populate("candidateId", "name email")
          .sort({ createdAt: -1 });
      }
    }

    if (!offer) {
      return res.status(200).json({ success: true, data: null, offer: null });
    }

    // First view of a 'sent' offer -> mark 'offer_received'
    if (offer.status === "sent") {
      offer.status = "offer_received";
      offer.offerReceivedAt = new Date();
      await offer.save();

      const app = await Application.findById(offer.applicationId);
      if (app && app.status === "offer_sent") {
        app.status = "offer_received";
        const tl = app.timeline.find((t) => t.stage === "offer_received");
        if (tl) {
          tl.completed = true;
          tl.date = new Date();
        }
        await app.save();
      }

      const hrs = await User.find({ role: "hr", isActive: true }).select("_id");
      await notifyMany({
        userIds: hrs.map((h) => h._id),
        message: `${offer.candidateId?.name || "Candidate"} viewed the offer letter.`,
        type: "info",
        link: "/hr/offers",
      });
    }

    // Attach uploaded documents for each requiredDocument
    const docMap = {};
    const docs = await Document.find({ ownerId: req.user.id, offerId: offer._id });
    docs.forEach((d) => {
      if (d.requiredDocId) docMap[d.requiredDocId] = d;
    });

    const offerObj = offer.toObject ? offer.toObject() : { ...offer };
    offerObj.pdfUrl = `/api/v1/offers/${offer._id}/pdf`;
    const requiredDocuments = (offer.requiredDocuments || []).map((rd) => ({
      ...(rd.toObject ? rd.toObject() : rd),
      uploadedDocument: docMap[rd.id] || null,
    }));

    const responseData = {
      ...offerObj,
      requiredDocuments,
      signedOfferLetterUrl: offer.signedOfferLetterUrl || null,
    };

    return res.status(200).json({
      success: true,
      message: "Candidate offer fetched successfully",
      data: responseData,
      offer: responseData,
    });
  } catch (error) {
    console.error("Get candidate offer error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch candidate offer" });
  }
};

const acceptOffer = async (req, res) => {
  try {
    const offer = await Offer.findOne({
      candidateId: req.user.id,
      status: { $in: ["offer_received", "sent"] },
    }).sort({ createdAt: -1 });

    if (!offer) {
      return res.status(404).json({ success: false, message: "No offer awaiting acceptance" });
    }

    // signedOfferLetter file is required
    const signedFile = Array.isArray(req.files)
      ? req.files.find((f) => f.fieldname === "signedOfferLetter")
      : req.files?.signedOfferLetter?.[0];

    if (!signedFile) {
      return res.status(400).json({ success: false, message: "Signed offer letter PDF is required" });
    }

    offer.signedOfferLetterUrl = `/uploads/candidate-documents/${signedFile.filename}`;
    offer.signedAt = new Date();

    // Create Document record for signed offer letter
    await Document.create({
      ownerId: req.user.id,
      ownerRole: "candidate",
      offerId: offer._id,
      category: "other",
      documentType: "signed_offer_letter",
      label: "Signed Offer Letter",
      originalName: signedFile.originalname,
      fileName: signedFile.filename,
      filePath: signedFile.path,
      fileUrl: `/uploads/candidate-documents/${signedFile.filename}`,
      mimeType: signedFile.mimetype,
      fileSize: signedFile.size,
      status: "pending",
      uploadedBy: req.user.id,
    });

    // Save each required document upload
    const uploadedDocs = [];
    for (const rd of (offer.requiredDocuments || [])) {
      const file = Array.isArray(req.files)
        ? req.files.find((f) => f.fieldname === `doc_${rd.id}` || f.fieldname === rd.id)
        : (req.files?.[`doc_${rd.id}`]?.[0] || req.files?.[rd.id]?.[0]);

      if (!file && rd.required) {
        return res.status(400).json({ success: false, message: `Missing required document: ${rd.label}` });
      }

      if (file) {
        const doc = await Document.create({
          ownerId: req.user.id,
          ownerRole: "candidate",
          offerId: offer._id,
          requiredDocId: rd.id,
          category: "other",
          documentType: rd.id,
          label: rd.label,
          originalName: file.originalname,
          fileName: file.filename,
          filePath: file.path,
          fileUrl: `/uploads/candidate-documents/${file.filename}`,
          mimeType: file.mimetype,
          fileSize: file.size,
          status: "pending",
          uploadedBy: req.user.id,
        });
        rd.uploadedDocumentId = doc._id;
        rd.uploadedAt = new Date();
        uploadedDocs.push(doc);
      }
    }

    offer.status = "accepted";
    offer.acceptedAt = new Date();
    if (req.body.candidateComments) {
      offer.candidateComments = req.body.candidateComments;
    }
    await offer.save();

    // Update application
    const app = await Application.findById(offer.applicationId);
    if (app) {
      app.status = "accepted";
      const tl = app.timeline.find((t) => t.stage === "accepted");
      if (tl) {
        tl.completed = true;
        tl.date = new Date();
      }
      await app.save();
    }

    // Notify HR — candidate is ready for conversion
    const hrs = await User.find({ role: "hr", isActive: true }).select("_id");
    const candidateName = req.user.name || "Candidate";
    await notifyMany({
      userIds: hrs.map((h) => h._id),
      message: `${candidateName} accepted the offer. Ready for conversion to ${offer.offerType}.`,
      type: "success",
      link: "/hr/employees",
    });

    await recordAuditLog({
      userId: req.user.id,
      action: "update",
      module: "offer",
      entityId: offer._id,
      newValue: { status: "accepted" },
    });

    return res.json({ success: true, data: offer, message: "Offer accepted successfully" });
  } catch (e) {
    console.error("Accept offer error:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

const declineOffer = async (req, res) => {
  try {
    const offer = await Offer.findOne({
      candidateId: req.user.id,
      status: { $in: ["sent", "offer_received"] },
    }).sort({ createdAt: -1 });

    if (!offer) {
      return res.status(404).json({ success: false, message: "No offer found to decline" });
    }

    offer.status = "declined";
    offer.declinedAt = new Date();
    if (req.body.comments || req.body.candidateComments) {
      offer.candidateComments = req.body.comments || req.body.candidateComments;
    }
    await offer.save();

    const app = await Application.findById(offer.applicationId);
    if (app) {
      app.status = "rejected";
      const tl = app.timeline.find((t) => t.stage === "rejected");
      if (tl) {
        tl.completed = true;
        tl.date = new Date();
      }
      await app.save();
    }

    const candidateName = req.user.name || "Candidate";
    const hrs = await User.find({ role: "hr", isActive: true }).select("_id");
    await notifyMany({
      userIds: hrs.map((h) => h._id),
      message: `${candidateName} declined the offer: ${offer.designation}.`,
      type: "warning",
      link: "/hr/offers",
    });

    await recordAuditLog({
      userId: req.user.id,
      action: "update",
      module: "offer",
      entityId: offer._id,
      newValue: { status: "declined" },
    });

    return res.json({ success: true, message: "Offer declined successfully", data: offer });
  } catch (e) {
    console.error("Decline offer error:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};



const applyJob = async (req, res) => {
  try {
    const { position, jobType, phone } = req.body;
    if (
      typeof position !== "string" ||
      !position.trim() ||
      typeof jobType !== "string"
    ) {
      cleanupUploadedFile(req);
      return res.status(400).json({
        success: false,
        message: "position and jobType are required",
      });
    }

    if (!["internship", "full_time"].includes(jobType)) {
      cleanupUploadedFile(req);
      return res.status(400).json({
        success: false,
        message: "jobType must be internship or full_time",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      cleanupUploadedFile(req);
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }
    if (user.role !== "candidate") {
      cleanupUploadedFile(req);
      return res.status(403).json({
        success: false,
        message: "Only candidates can apply",
      });
    }

    const candidateName =
      user.name ||
      [user.firstName, user.lastName].filter(Boolean).join(" ");
    const existingApplication = await Application.findOne({
      candidateId: user._id,
      position: position.trim(),
      jobType,
      status: { $nin: ["rejected", "converted"] },
    });
    if (existingApplication) {
      cleanupUploadedFile(req);
      return res.status(409).json({
        success: false,
        message: "You already have an active application for this position",
      });
    }

    const resumeUrl = req.file
      ? `/uploads/candidate-documents/${req.file.filename}`
      : user.resumeUrl || "";

    const resumeOriginalName = req.file
      ? req.file.originalname
      : "";

    const application = await Application.create({
      candidateId: user._id,
      candidateName,
      email: user.email,
      phone: typeof phone === "string" && phone.trim() ? phone.trim() : user.phone,
      position: position.trim(),
      jobType,
      source: "direct",
      resumeUrl,
      resumeOriginalName,
      status: "applied",
      timeline: [
        {
          stage: "applied",
          title: "Application Submitted",
          description: "Application received",
          completed: true,
          date: new Date(),
        },
        { stage: "interview", title: "Interview", completed: false },
        { stage: "selected", title: "Selected", completed: false },
        { stage: "offer_sent", title: "Offer Sent", completed: false },
        { stage: "offer_received", title: "Offer Received", completed: false },
        { stage: "accepted", title: "Offer Accepted", completed: false },
        { stage: "converted", title: "Onboarded", completed: false },
      ],
    });

    user.position = position.trim();
    if (typeof phone === "string" && phone.trim()) user.phone = phone.trim();
    if (resumeUrl) user.resumeUrl = resumeUrl;
    await user.save();

    const hrUsers = await User.find({ role: "hr", isActive: true }).select("_id");
    await notifyMany({
      userIds: hrUsers.map((hrUser) => hrUser._id),
      message: `New application: ${candidateName} applied for ${position.trim()} (${jobType})`,
      type: "info",
      link: "/hr/candidates",
    });
    await recordAuditLog({
      userId: req.user.id,
      action: "create",
      module: "application",
      entityId: application._id,
      newValue: { position: application.position, jobType: application.jobType },
    });

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application,
      application,
    });
  } catch (error) {
    cleanupUploadedFile(req);
    console.error("Apply job error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to submit application: " + error.message,
    });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ candidateId: req.user.id })
      .populate("currentInterviewId currentOfferId")
      .sort({ createdAt: -1 });

    const enrichedApplications = await Promise.all(applications.map(async (app) => {
      const appObj = app.toObject ? app.toObject() : { ...app };
      appObj.interviews = await Interview.find({ applicationId: app._id })
        .populate("interviewerId", "name firstName lastName email")
        .sort({ scheduledAt: 1 })
        .lean();
      return appObj;
    }));

    return res.status(200).json({
      success: true,
      applications: enrichedApplications,
      data: enrichedApplications,
    });
  } catch (error) {
    console.error("Get my applications error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
    });
  }
};

const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid application ID" });
    }

    const application = await Application.findById(id)
      .populate("currentInterviewId");
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    if (
      req.user.role === "candidate" &&
      String(application.candidateId) !== String(req.user.id)
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const appObj = application.toObject ? application.toObject() : { ...application };
    appObj.interviews = await Interview.find({ applicationId: application._id })
      .populate("interviewerId", "name firstName lastName email")
      .sort({ scheduledAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      application: appObj,
      data: appObj,
    });
  } catch (error) {
    console.error("Get application by ID error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch application details",
    });
  }
};

module.exports = {
  applyJob,
  getMyApplications,
  getApplicationById,
  createCandidate,
  getCandidates,
  getCandidateById,
  updateCandidate,
  archiveCandidate,
  deleteCandidate,
  getMyApplication,
  getMyProfile,
  getMyDocuments,
  uploadCandidateDocument,
  updateCandidateDocument,
  deleteCandidateDocument,
  getMyOffer,
  acceptOffer,
  declineOffer,
};