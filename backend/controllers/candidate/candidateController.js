const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Candidate = require("../../models/Candidate");
const User = require("../../models/User");
const Document = require("../../models/Document");
const Offer = require("../../models/Offer");
const Application = require("../../models/Application");
const Interview = require("../../models/Interview");
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
    if (String(req.query.includeSelected).toLowerCase() === "true") {
      filter.$or = [
        { role: { $in: ["candidate", "Candidate", "intern", "employee"] } },
        { "hiringRecommendation.status": "select" },
        { status: { $in: ["selected", "Selected", "offer", "Offer"] } },
        { selectedAs: { $in: ["intern", "employee"] } },
      ];
    } else {
      filter.role = { $in: ["candidate", "Candidate"] };
    }
    if (status && status !== 'all') filter.status = new RegExp('^' + status + '$', 'i');
    if (req.query.jobType && req.query.jobType !== 'all') filter.jobType = req.query.jobType;
    if (position) filter.position = position;
    if (source) {
      filter.$and = [{ $or: [{ source }, { applicationSource: source }] }];
    }
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
    const [candidates, total] = await Promise.all([
      Candidate.find(filter)
        .populate("interviews.interviewerId", "name firstName lastName email")
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
    const candidate = await Candidate.findOne({ _id: req.params.id, role: { $in: ["candidate", "Candidate"] }, ...notArchived })
      .populate("interviews.interviewerId", "name firstName lastName email");
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
      { returnDocument: 'after', runValidators: true }
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
    const statuses = ["applied", "interview", "selected", "offer", "rejected", "screening"];
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid candidate ID" });
    }
    const normalizedStatus = String(status || "").toLowerCase();
    if (!statuses.includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: "Invalid status", allowedStatuses: statuses });
    }
    const candidate = await Candidate.findOneAndUpdate(
      { _id: id, ...notArchived },
      { $set: { status: normalizedStatus } },
      { returnDocument: 'after', runValidators: true }
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
    const candidate = await Candidate.findOne({ _id: id, ...notArchived });
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    const isIntern = selectedAs === "intern" || String(candidate.jobType || candidate.position || "").toLowerCase().includes("intern");
    const roleType = isIntern ? "intern" : "employee";

    candidate.status = "selected";
    candidate.selectedAs = roleType;
    candidate.role = roleType;
    await candidate.save();

    // Sync Application
    const candidateUserId = candidate.user || candidate.userId || candidate._id;
    const application = await Application.findOne({
      $or: [
        { candidateId: candidateUserId },
        { email: candidate.email ? candidate.email.toLowerCase() : null }
      ]
    }).sort({ appliedAt: -1 });

    if (application) {
      application.status = "Selected";
      for (const event of application.timeline) {
        const stage = String(event.stage || "").trim().toLowerCase();
        if (stage === "applied" || stage === "interview") {
          event.completed = true;
        } else if (stage === "selected") {
          event.completed = true;
          event.date = new Date();
          event.description = `Candidate selected for ${isIntern ? 'Internship' : 'Full-time'}.`;
        }
      }
      await application.save();
    }

    // Convert role in User collection
    const userDoc = await User.findById(candidateUserId) || await User.findOne({ email: candidate.email.toLowerCase() });
    if (userDoc) {
      userDoc.role = roleType;
      userDoc.status = "active";
      userDoc.isActive = true;
      userDoc.selectedAs = roleType;
      await userDoc.save();
    }

    return res.status(200).json({
      success: true,
      message: `Candidate selected successfully and converted to ${roleType}`,
      data: candidate,
    });
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
      { returnDocument: 'after' }
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
    const interviews = await Interview.find({ candidateId: candidate._id })
      .populate("interviewerId", "name firstName lastName email")
      .sort({ scheduledAt: 1, createdAt: -1 })
      .lean();
    return res.status(200).json({
      success: true,
      message: "Application fetched successfully",
      application: {
        position: candidate.position,
        applicationSource: candidate.applicationSource || candidate.source,
        appliedDate: candidate.appliedDate,
        status: candidate.status,
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
    const candidateIds = await Candidate.find({
      $or: [
        { user: req.user.id },
        { userId: req.user.id },
        { _id: req.user.id },
        { email: req.user.email ? req.user.email.toLowerCase() : null },
      ],
    }).distinct("_id");

    const offer = await Offer.findOne({
      $or: [
        { candidate: req.user.id },
        { candidateId: req.user.id },
        { candidateId: { $in: candidateIds } },
      ],
      status: { $in: ["sent", "Sent", "approved", "Approved", "Draft", "draft"] },
    }).sort({ createdAt: -1 });

    if (!offer) {
      return res.status(404).json({ success: false, message: "No offer found for your account." });
    }

    const offerObj = offer.toObject ? offer.toObject() : { ...offer };
    offerObj.pdfUrl = `/api/offers/${offer._id}/pdf`;

    return res.status(200).json({
      success: true,
      message: "Candidate offer fetched successfully",
      offer: offerObj,
      data: { offer: offerObj },
    });
  } catch (error) {
    console.error("Get candidate offer error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch candidate offer" });
  }
};


const applyJob = async (req, res) => {
  try {
    const { position, jobType } = req.body;
    if (!position || typeof position !== "string" || !position.trim()) {
      cleanupUploadedFile(req);
      return res.status(400).json({
        success: false,
        message: "Position is required",
      });
    }

    const validJobType =
      jobType === "Internship" || jobType === "internship" ? "Internship" : "Full-time";

    const user = await User.findById(req.user.id);
    if (!user) {
      cleanupUploadedFile(req);
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    const candidateName =
      user.name ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      req.body.candidateName ||
      "Candidate";

    const email = user.email;
    const phone = user.phone || req.body.phone || "";

    const resumeUrl = req.file
      ? `/uploads/candidate-documents/${req.file.filename}`
      : req.body.resumeUrl || "";

    const resumeOriginalName = req.file
      ? req.file.originalname
      : req.body.resumeOriginalName || "";

    const application = await Application.create({
      candidateId: user._id,
      candidateName,
      email,
      phone,
      position: position.trim(),
      jobType: validJobType,
      resumeUrl,
      resumeOriginalName,
      status: "Applied",
      appliedAt: new Date(),
      timeline: [
        {
          stage: "Applied",
          title: "Application Submitted",
          description: `Application for ${position.trim()} (${validJobType}) submitted successfully.`,
          completed: true,
          date: new Date(),
        },
        {
          stage: "Interview",
          title: "Interview Scheduled",
          description: "Technical assessment and HR evaluation rounds.",
          completed: false,
          date: null,
        },
        {
          stage: "Selected",
          title: "Candidate Selected",
          description: "Candidate selection and evaluation decision.",
          completed: false,
          date: null,
        },
        {
          stage: "Offer",
          title: "Job Offer",
          description: "Official employment offer letter issuance and onboarding.",
          completed: false,
          date: null,
        },
      ],
    });

    user.position = position.trim();
    if (resumeUrl) user.resumeUrl = resumeUrl;
    user.status = "applied";
    await user.save();

    // Ensure Candidate document exists so HR can see the applicant
    await Candidate.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        $set: {
          name: candidateName,
          email: email.toLowerCase(),
          phone,
          position: position.trim(),
          jobType: validJobType,
          resumeUrl: resumeUrl || "",
          user: user._id,
          userId: user._id,
          status: "applied",
          applicationSource: "Direct Application",
          source: "Direct",
          appliedDate: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

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
    let applications = await Application.find({ candidateId: req.user.id }).sort({ createdAt: -1 });

    if (applications.length === 0) {
      const user = await User.findById(req.user.id);
      if (user && user.position) {
        const fallbackApp = await Application.create({
          candidateId: user._id,
          candidateName:
            user.name ||
            [user.firstName, user.lastName].filter(Boolean).join(" ") ||
            "Candidate",
          email: user.email,
          phone: user.phone || "",
          position: user.position,
          jobType: "Full-time",
          resumeUrl: user.resumeUrl || "",
          status: "Applied",
          appliedAt: user.createdAt || new Date(),
          timeline: [
            {
              stage: "Applied",
              title: "Application Submitted",
              description: `Application for ${user.position} submitted.`,
              completed: true,
              date: user.createdAt || new Date(),
            },
            {
              stage: "Screening",
              title: "Profile Screening",
              description: "Your application is under review.",
              completed: false,
              date: null,
            },
            {
              stage: "Interview",
              title: "Interview Rounds",
              description: "Awaiting interview scheduling.",
              completed: false,
              date: null,
            },
            {
              stage: "Selected",
              title: "Final Decision",
              description: "Final outcome & onboarding.",
              completed: false,
              date: null,
            },
          ],
        });
        applications = [fallbackApp];
      }
    }

    // Enrich applications with candidate interviews
    const candidateDoc = await Candidate.findOne({
      $or: [{ user: req.user.id }, { userId: req.user.id }, { email: req.user.email?.toLowerCase() }]
    }).populate("interviews.interviewerId", "name firstName lastName email").lean();

    const enrichedApplications = applications.map(app => {
      const appObj = app.toObject ? app.toObject() : { ...app };
      if (candidateDoc && candidateDoc.interviews) {
        appObj.interviews = candidateDoc.interviews;
      }
      return appObj;
    });

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

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    if (
      req.user.role === "candidate" &&
      String(application.candidateId) !== String(req.user.id)
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const candidateDoc = await Candidate.findOne({
      $or: [{ user: application.candidateId }, { userId: application.candidateId }, { email: application.email?.toLowerCase() }]
    }).populate("interviews.interviewerId", "name firstName lastName email").lean();

    const appObj = application.toObject ? application.toObject() : { ...application };
    if (candidateDoc && candidateDoc.interviews) {
      appObj.interviews = candidateDoc.interviews;
    }

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