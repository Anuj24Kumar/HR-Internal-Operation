const mongoose = require("mongoose");

const requiredDocumentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    acceptedTypes: [{ type: String }],
    required: { type: Boolean, default: true },
    uploadedDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", default: null },
    uploadedAt: { type: Date, default: null },
  },
  { _id: false }
);

const approvalHistorySchema = new mongoose.Schema(
  {
    approverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, enum: ["approved", "rejected"] },
    comments: String,
    decidedAt: Date,
  },
  { _id: false }
);

const offerSchema = new mongoose.Schema(
  {
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
    offerType: { type: String, enum: ["intern", "employee"], required: true },
    designation: { type: String, required: true, trim: true },
    salary: { type: Number, required: true, min: 0 },
    joiningDate: { type: Date, required: true },
    expiryDate: Date,
    status: {
      type: String,
      enum: ["draft", "pending_approval", "approved", "sent", "offer_received", "accepted", "rejected", "expired", "declined"],
      default: "draft",
      index: true,
    },
    requiredDocuments: { type: [requiredDocumentSchema], default: [] },
    signedOfferLetterUrl: String,
    signature: { type: String, maxlength: 10000 },
    signedAt: Date,
    acceptedAt: Date,
    declinedAt: Date,
    candidateComments: String,
    signToken: { type: String, select: false },
    signTokenExpiresAt: { type: Date, select: false },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: "LetterTemplate" },
    pdfUrl: String,
    approvalId: { type: mongoose.Schema.Types.ObjectId, ref: "ApprovalRequest" },
    approvalStatus: { type: String, enum: ["pending", "approved", "rejected", "not_required"], default: "not_required" },
    approvalHistory: { type: [approvalHistorySchema], default: [] },
    sentAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Offer || mongoose.model("Offer", offerSchema);
