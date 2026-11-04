const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { Offer, User, Application } = require("../models");
const { generateOfferPdf } = require("../utils/pdfGenerator");
const { notify } = require("../utils/notificationHelper");
const { recordAuditLog } = require("../utils/auditLogger");

const userIdOf = (req) => req.user?.id || req.user?._id;

// GET: Fetch all offers with optional status filter
const getOffers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const offers = await Offer.find(filter)
      .populate("candidateId", "name email phone position status")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: offers.length,
      data: offers,
    });
  } catch (error) {
    console.error("Get offers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch offers",
    });
  }
};

// POST: Create a new offer draft
const createOffer = async (req, res) => {
  try {
    const {
      candidateId,
      offerType,
      designation,
      salary,
      joiningDate,
      expiryDate,
      requiredDocuments,
      sendImmediately,
    } = req.body;

    if (!candidateId || !offerType || !designation || salary === undefined || salary === null || !joiningDate) {
      return res.status(400).json({
        success: false,
        message: "candidateId, offerType, designation, salary, joiningDate are required",
      });
    }

    if (!["intern", "employee"].includes(offerType)) {
      return res.status(400).json({
        success: false,
        message: "offerType must be intern or employee",
      });
    }

    if (!Array.isArray(requiredDocuments)) {
      return res.status(400).json({
        success: false,
        message: "requiredDocuments must be an array (can be empty)",
      });
    }

    const candidate = await User.findById(candidateId);
    if (!candidate || candidate.role !== "candidate") {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    const application = await Application.findOne({ candidateId, status: "selected" }).sort({ createdAt: -1 });
    if (!application) {
      return res.status(400).json({
        success: false,
        message: "Candidate has no selected application. HM must select first.",
      });
    }

    // Validate and normalize requiredDocuments shape
    const normalizedDocs = requiredDocuments.map((d, i) => ({
      id: d.id || `doc-${Date.now()}-${i}`,
      label: d.label || "Document",
      acceptedTypes: Array.isArray(d.acceptedTypes) && d.acceptedTypes.length ? d.acceptedTypes : ["pdf", "jpg", "png"],
      required: d.required !== false,
      uploadedDocumentId: null,
      uploadedAt: null,
    }));

    const offer = await Offer.create({
      candidateId,
      applicationId: application._id,
      offerType,
      designation: designation.trim(),
      salary: Number(salary),
      joiningDate: new Date(joiningDate),
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      requiredDocuments: normalizedDocs,
      status: "draft",
      approvalStatus: "not_required",
      createdBy: userIdOf(req),
    });

    // Generate the PDF immediately so HR can preview before sending
    offer.pdfUrl = await generateOfferPdf(offer, candidate);
    await offer.save();

    if (sendImmediately) {
      offer.status = "sent";
      offer.sentAt = new Date();
      await offer.save();

      application.status = "offer_sent";
      application.currentOfferId = offer._id;
      const tl = application.timeline.find((t) => t.stage === "offer_sent");
      if (tl) {
        tl.completed = true;
        tl.date = new Date();
      }
      await application.save();

      await notify({
        userId: candidateId,
        message: `Offer letter received: ${designation}. Check My Offers.`,
        type: "success",
        link: "/candidate/offer",
      });
    }

    await recordAuditLog({
      userId: userIdOf(req),
      action: "create",
      module: "offer",
      entityId: offer._id,
      newValue: { candidateId, offerType, designation },
    });

    return res.status(201).json({ success: true, data: offer });
  } catch (e) {
    console.error("Create offer error:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// GET: Fetch offer by ID
const getOfferById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid offer ID" });
    }

    const offer = await Offer.findById(id)
      .populate("candidateId", "name email phone position status")
      .populate("createdBy", "name email");

    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found" });
    }

    const role = String(req.user?.role || "").toLowerCase();
    const candidateIdStr = String(offer.candidateId?._id || offer.candidateId);
    const userIdStr = String(userIdOf(req));

    if (["candidate", "intern", "employee"].includes(role)) {
      if (candidateIdStr !== userIdStr) {
        return res.status(403).json({ success: false, message: "Not authorized to view this offer" });
      }
      if (!["sent", "offer_received", "accepted"].includes(offer.status)) {
        return res.status(403).json({ success: false, message: "Offer is not available for viewing yet" });
      }
    }

    return res.status(200).json({ success: true, data: offer });
  } catch (error) {
    console.error("Get offer by ID error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET: Stream PDF of offer
const getOfferPdf = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid offer ID" });
    }

    const offer = await Offer.findById(id).populate("candidateId", "name email phone position");
    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found" });
    }

    const candidate = offer.candidateId;
    let filePath;
    if (offer.pdfUrl) {
      filePath = path.join(__dirname, "..", offer.pdfUrl);
    }

    if (!filePath || !fs.existsSync(filePath)) {
      const generatedRelPath = await generateOfferPdf(offer, candidate);
      offer.pdfUrl = generatedRelPath;
      await offer.save();
      filePath = path.join(__dirname, "..", generatedRelPath);
    }

    const filename = `offer-${offer._id}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.on("error", (err) => {
      console.error("Stream PDF error:", err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: "Failed to stream offer PDF" });
      }
    });
    fileStream.pipe(res);
  } catch (error) {
    console.error("Get offer PDF error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: "Failed to generate offer PDF" });
    }
  }
};

// PATCH: Update offer (draft only)
const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid offer ID" });
    }

    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found" });
    }

    if (offer.status !== "draft") {
      return res.status(400).json({ success: false, message: "Only draft offers can be updated" });
    }

    const { salary, designation, joiningDate, expiryDate, offerType, requiredDocuments } = req.body;

    if (salary !== undefined) {
      if (!Number.isFinite(Number(salary)) || Number(salary) < 0) {
        return res.status(400).json({ success: false, message: "Salary must be a non-negative number" });
      }
      offer.salary = Number(salary);
    }

    if (designation !== undefined) {
      if (typeof designation !== "string" || !designation.trim()) {
        return res.status(400).json({ success: false, message: "Designation cannot be empty" });
      }
      offer.designation = designation.trim();
    }

    if (offerType !== undefined) {
      if (!["intern", "employee"].includes(offerType)) {
        return res.status(400).json({ success: false, message: "offerType must be intern or employee" });
      }
      offer.offerType = offerType;
    }

    if (joiningDate !== undefined) {
      if (Number.isNaN(Date.parse(joiningDate))) {
        return res.status(400).json({ success: false, message: "Invalid joining date" });
      }
      offer.joiningDate = new Date(joiningDate);
    }

    if (expiryDate !== undefined) {
      offer.expiryDate = expiryDate ? new Date(expiryDate) : null;
    }

    if (requiredDocuments !== undefined) {
      if (!Array.isArray(requiredDocuments)) {
        return res.status(400).json({ success: false, message: "requiredDocuments must be an array" });
      }
      offer.requiredDocuments = requiredDocuments.map((d, i) => ({
        id: d.id || `doc-${Date.now()}-${i}`,
        label: d.label || "Document",
        acceptedTypes: Array.isArray(d.acceptedTypes) && d.acceptedTypes.length ? d.acceptedTypes : ["pdf", "jpg", "png"],
        required: d.required !== false,
        uploadedDocumentId: d.uploadedDocumentId || null,
        uploadedAt: d.uploadedAt || null,
      }));
    }

    const candidate = await User.findById(offer.candidateId);
    offer.pdfUrl = await generateOfferPdf(offer, candidate);
    await offer.save();

    const updatedOffer = await Offer.findById(offer._id)
      .populate("candidateId", "name email phone position status")
      .populate("createdBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Offer updated successfully",
      data: updatedOffer,
    });
  } catch (error) {
    console.error("Update offer error:", error);
    return res.status(500).json({ success: false, message: "Failed to update offer" });
  }
};

// PATCH: Send offer to candidate
const sendOffer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid offer ID" });
    }

    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found" });
    }

    if (offer.status === "sent") {
      return res.status(400).json({ success: false, message: "Offer already sent" });
    }

    if (!["draft", "approved"].includes(offer.status)) {
      return res.status(400).json({ success: false, message: "Only draft or approved offers can be sent" });
    }

    offer.status = "sent";
    offer.sentAt = new Date();
    await offer.save();

    const application = await Application.findById(offer.applicationId);
    if (application) {
      application.currentOfferId = offer._id;
      application.status = "offer_sent";
      const tl = application.timeline.find((t) => t.stage === "offer_sent");
      if (tl) {
        tl.completed = true;
        tl.date = new Date();
      }
      await application.save();
    }

    // Notify candidate
    await notify({
      userId: offer.candidateId,
      message: `Offer letter received: ${offer.designation}. Check My Offers.`,
      type: "success",
      link: "/candidate/offer",
    });

    await recordAuditLog({
      userId: userIdOf(req),
      action: "update",
      module: "offer",
      entityId: offer._id,
      newValue: { status: "sent", sentAt: offer.sentAt },
    });

    const updatedOffer = await Offer.findById(offer._id)
      .populate("candidateId", "name email phone position status")
      .populate("createdBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Offer marked as sent successfully",
      data: updatedOffer,
    });
  } catch (error) {
    console.error("Send offer error:", error);
    return res.status(500).json({ success: false, message: "Failed to send offer" });
  }
};

// PATCH: Submit offer for approval (if approval workflow used)
const submitOffer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid offer ID" });
    }

    const offer = await Offer.findById(id);
    if (!offer) return res.status(404).json({ success: false, message: "Offer not found" });
    if (offer.status !== "draft") {
      return res.status(400).json({ success: false, message: "Only draft offers can be submitted" });
    }

    offer.status = "pending_approval";
    offer.approvalStatus = "pending";
    await offer.save();

    const updatedOffer = await Offer.findById(offer._id)
      .populate("candidateId", "name email phone position status")
      .populate("createdBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Offer submitted for approval successfully",
      data: updatedOffer,
    });
  } catch (error) {
    console.error("Submit offer error:", error);
    return res.status(500).json({ success: false, message: "Failed to submit offer for approval" });
  }
};

// PATCH: Review / decide offer approval
const decideOfferApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comments = "" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid offer ID" });
    }
    if (!["approved", "rejected"].includes(action)) {
      return res.status(400).json({ success: false, message: "Action must be approved or rejected" });
    }
    if (action === "rejected" && (!comments || !comments.trim())) {
      return res.status(400).json({ success: false, message: "Comments are required when rejecting an offer" });
    }

    const offer = await Offer.findById(id);
    if (!offer) return res.status(404).json({ success: false, message: "Offer not found" });
    if (offer.status !== "pending_approval") {
      return res.status(400).json({ success: false, message: "Only offers pending approval can be reviewed" });
    }

    offer.approvalHistory.push({
      approverId: userIdOf(req),
      action,
      comments: comments.trim(),
      decidedAt: new Date(),
    });

    if (action === "approved") {
      offer.approvalStatus = "approved";
      offer.status = "approved";
    } else {
      offer.approvalStatus = "rejected";
      offer.status = "rejected";
    }

    await offer.save();

    const updatedOffer = await Offer.findById(offer._id)
      .populate("candidateId", "name email phone position status")
      .populate("createdBy", "name email")
      .populate("approvalHistory.approverId", "name email role");

    return res.status(200).json({
      success: true,
      message: action === "approved" ? "Offer approved successfully" : "Offer rejected successfully",
      data: updatedOffer,
    });
  } catch (error) {
    console.error("Offer approval error:", error);
    return res.status(500).json({ success: false, message: "Failed to process offer approval" });
  }
};

// PATCH: Expire offer
const expireOffer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid offer ID" });
    }

    const offer = await Offer.findById(id);
    if (!offer) return res.status(404).json({ success: false, message: "Offer not found" });
    if (offer.status !== "sent") {
      return res.status(400).json({ success: false, message: "Only sent offers can be expired" });
    }

    offer.status = "expired";
    await offer.save();

    const updatedOffer = await Offer.findById(offer._id)
      .populate("candidateId", "name email phone position status")
      .populate("createdBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Offer expired successfully",
      data: updatedOffer,
    });
  } catch (error) {
    console.error("Expire offer error:", error);
    return res.status(500).json({ success: false, message: "Failed to expire offer" });
  }
};

// DELETE: Delete draft offer
const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid offer ID" });
    }

    const offer = await Offer.findById(id);
    if (!offer) return res.status(404).json({ success: false, message: "Offer not found" });
    if (offer.status !== "draft") {
      return res.status(400).json({ success: false, message: "Only draft offers can be deleted" });
    }

    await Offer.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "Offer deleted successfully" });
  } catch (error) {
    console.error("Delete offer error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete offer" });
  }
};

module.exports = {
  getOffers,
  createOffer,
  getOfferById,
  updateOffer,
  submitOffer,
  decideOfferApproval,
  sendOffer,
  expireOffer,
  getOfferPdf,
  deleteOffer,
};
