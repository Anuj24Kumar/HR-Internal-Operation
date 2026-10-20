const mongoose = require("mongoose");

const approvalHistorySchema = new mongoose.Schema(
  {
    approverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    approverRole: { type: String, enum: ["admin", "hr", "hiring_manager"], required: true },
    action: { type: String, enum: ["approved", "rejected"], required: true },
    comments: { type: String, trim: true, default: "" },
    decidedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const offerSchema = new mongoose.Schema(
  {
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", index: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    offerType: { type: String, enum: ["intern", "employee"], default: "employee", required: true },
    designation: { type: String, required: true, trim: true },
    salary: { type: Number, required: true, min: 0 },
    joiningDate: { type: Date, required: true },
    expiryDate: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    status: {
      type: String,
      enum: [
        "draft", "pending_approval", "sent", "accepted", "rejected", "expired",
        "Draft", "Pending Approval", "Approved", "Sent", "Expired", "Accepted", "Rejected",
      ],
      default: "draft",
      index: true,
    },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: "LetterTemplate", default: null },
    template: { type: String, trim: true, default: "default" },
    pdfUrl: { type: String, default: null },
    approvalId: { type: mongoose.Schema.Types.ObjectId, ref: "ApprovalRequest", default: null },
    approvalStatus: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    approvalHistory: { type: [approvalHistorySchema], default: [] },
    sentAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Offer", offerSchema);
