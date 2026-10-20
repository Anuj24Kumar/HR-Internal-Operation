const mongoose = require("mongoose");
const Offer = require("../models/Offer");
const Candidate = require("../models/Candidate");
const PDFDocument = require("pdfkit");


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
      salary,
      designation,
      joiningDate,
      template,
    } = req.body;

    if (
      !candidateId ||
      !mongoose.Types.ObjectId.isValid(candidateId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid candidateId is required",
      });
    }

    if (
      salary === undefined ||
      salary === null ||
      salary === "" ||
      !Number.isFinite(Number(salary)) ||
      Number(salary) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid non-negative salary is required",
      });
    }

    if (!designation || !designation.trim()) {
      return res.status(400).json({
        success: false,
        message: "Designation is required",
      });
    }

    if (
      !joiningDate ||
      Number.isNaN(Date.parse(joiningDate))
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid joiningDate is required",
      });
    }

    const candidate = await Candidate.findOne({
      _id: candidateId,
      isArchived: false,
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    const offer = await Offer.create({
      candidateId: candidate._id,
      createdBy: req.user.id,
      salary: Number(salary),
      designation: designation.trim(),
      joiningDate: new Date(joiningDate),
      template: template?.trim() || "default",
      status: "Draft",
    });

    const populatedOffer = await Offer.findById(offer._id)
      .populate("candidateId", "name email phone position status")
      .populate("createdBy", "name email");

    return res.status(201).json({
      success: true,
      message: "Offer draft created successfully",
      data: populatedOffer,
    });
  } catch (error) {
    console.error("Create offer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create offer",
    });
  }
};

const getOfferById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer ID",
      });
    }

    const offer = await Offer.findById(id)
      .populate("candidateId", "name email phone position status")
      .populate("createdBy", "name email");

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: offer,
    });
  } catch (error) {
    console.error("Get offer by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch offer",
    });
  }
};


const getOfferPdf = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer ID",
      });
    }

    const offer = await Offer.findById(id).populate(
      "candidateId",
      "name email phone position"
    );

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    if (!offer.candidateId) {
      return res.status(400).json({
        success: false,
        message: "Candidate details are not available",
      });
    }

    const candidate = offer.candidateId;

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: "Employment Offer Letter",
        Author: "HR Department",
      },
    });

    const filename = `offer-${offer._id}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    doc.on("error", (error) => {
      console.error("PDF generation error:", error);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Failed to generate offer PDF",
        });
      } else {
        res.destroy(error);
      }
    });

    doc.pipe(res);

    // Company heading
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("EMPLOYMENT OFFER LETTER", {
        align: "center",
      });

    doc.moveDown(0.5);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text("HR Department", { align: "center" });

    doc.moveDown(2);

    // Date and candidate information
    doc
      .fontSize(11)
      .text(`Offer Reference: ${offer._id}`);

    doc.text(
      `Date Generated: ${new Date().toLocaleDateString("en-IN")}`
    );

    doc.moveDown();

    doc.text(`Dear ${candidate.name},`);

    doc.moveDown();

    doc.text(
      "We are pleased to present you with the following employment offer, subject to the applicable company policies and terms."
    );

    doc.moveDown();

    // Offer details
    doc.font("Helvetica-Bold").text("OFFER DETAILS");
    doc.moveDown(0.5);

    doc.font("Helvetica");

    doc.text(`Candidate Name: ${candidate.name}`);
    doc.text(`Email: ${candidate.email || "N/A"}`);
    doc.text(`Phone: ${candidate.phone || "N/A"}`);
    doc.text(`Position: ${offer.designation}`);
    doc.text(
      `Annual Salary / Compensation: ${Number(offer.salary).toLocaleString("en-IN")}`
    );
    doc.text(
      `Joining Date: ${new Date(offer.joiningDate).toLocaleDateString("en-IN")}`
    );

    doc.moveDown();

    doc.text(
      "Please contact the HR Department for any clarification regarding this offer."
    );

    doc.moveDown(2);

    doc.text("Regards,");
    doc.moveDown();
    doc.font("Helvetica-Bold").text("HR Department");
    doc.font("Helvetica").text("Company Representative");

    doc.moveDown(2);

    doc
      .fontSize(8)
      .fillColor("gray")
      .text(
        "This document was generated electronically by the HR Internal Operations Platform. It is not a digitally signed document.",
        { align: "center" }
      );

    doc.end();
  } catch (error) {
    console.error("Get offer PDF error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate offer PDF",
      });
    }

    res.destroy(error);
  }
};


const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer ID",
      });
    }

    const offer = await Offer.findById(id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    if (offer.status !== "Draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft offers can be updated",
      });
    }

    const allowedFields = [
      "salary",
      "designation",
      "joiningDate",
      "template",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    if (
      updates.salary !== undefined &&
      (!Number.isFinite(Number(updates.salary)) ||
        Number(updates.salary) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Salary must be a non-negative number",
      });
    }

    if (
      updates.designation !== undefined &&
      (typeof updates.designation !== "string" ||
        !updates.designation.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Designation cannot be empty",
      });
    }

    if (updates.joiningDate !== undefined) {
      if (Number.isNaN(Date.parse(updates.joiningDate))) {
        return res.status(400).json({
          success: false,
          message: "Invalid joining date",
        });
      }

      updates.joiningDate = new Date(updates.joiningDate);
    }

    if (updates.template !== undefined) {
      if (
        typeof updates.template !== "string" ||
        !updates.template.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Template cannot be empty",
        });
      }

      updates.template = updates.template.trim();
    }

    Object.assign(offer, updates);
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

    return res.status(500).json({
      success: false,
      message: "Failed to update offer",
    });
  }
};
const submitOffer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer ID",
      });
    }

    const offer = await Offer.findById(id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    if (offer.status !== "Draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft offers can be submitted",
      });
    }

    offer.status = "Pending Approval";
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

    return res.status(500).json({
      success: false,
      message: "Failed to submit offer for approval",
    });
  }
};


const decideOfferApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comments = "" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer ID",
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
      (!comments || !comments.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Comments are required when rejecting an offer",
      });
    }

    const offer = await Offer.findById(id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    if (offer.status !== "Pending Approval") {
      return res.status(400).json({
        success: false,
        message: "Only offers pending approval can be reviewed",
      });
    }

    // Existing documents may not yet contain approvalStatus.
    if (
      offer.approvalStatus &&
      offer.approvalStatus !== "Pending"
    ) {
      return res.status(400).json({
        success: false,
        message: "This offer has already been reviewed",
      });
    }

    offer.approvalHistory.push({
      approverId: req.user.id,
      approverRole: req.user.role,
      action,
      comments: comments.trim(),
      decidedAt: new Date(),
    });

  if (action === "approved") {
  offer.approvalStatus = "Approved";
  offer.status = "Approved";
} else {
  offer.approvalStatus = "Rejected";
  offer.status = "Rejected";
}

    await offer.save();

    const updatedOffer = await Offer.findById(offer._id)
      .populate("candidateId", "name email phone position status")
      .populate("createdBy", "name email")
      .populate("approvalHistory.approverId", "name email role");

    return res.status(200).json({
      success: true,
      message:
        action === "approved"
          ? "Offer approved successfully"
          : "Offer rejected successfully",
      data: updatedOffer,
    });
  } catch (error) {
    console.error("Offer approval error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process offer approval",
    });
  }
};


const sendOffer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer ID",
      });
    }

    const offer = await Offer.findById(id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    if (offer.approvalStatus !== "Approved") {
      return res.status(400).json({
        success: false,
        message: "Offer must be approved before sending",
      });
    }

    if (offer.status !== "Approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved offers can be sent",
      });
    }

    offer.status = "Sent";
    offer.sentAt = new Date();

    await offer.save();

    const updatedOffer = await Offer.findById(offer._id)
      .populate("candidateId", "name email phone position status")
      .populate("createdBy", "name email")
      .populate("approvalHistory.approverId", "name email role");

    return res.status(200).json({
      success: true,
      message: "Offer marked as sent successfully",
      data: updatedOffer,
    });
  } catch (error) {
    console.error("Send offer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send offer",
    });
  }
};


const expireOffer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer ID",
      });
    }

    const offer = await Offer.findById(id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    // An offer can be expired manually only after it has been sent.
    if (offer.status !== "Sent") {
      return res.status(400).json({
        success: false,
        message: "Only sent offers can be expired",
      });
    }

    offer.status = "Expired";
    offer.expiredAt = new Date();

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

    return res.status(500).json({
      success: false,
      message: "Failed to expire offer",
    });
  }
};


const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer ID",
      });
    }

    const offer = await Offer.findById(id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    if (offer.status !== "Draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft offers can be deleted",
      });
    }

    await Offer.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Offer deleted successfully",
    });
  } catch (error) {
    console.error("Delete offer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete offer",
    });
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
