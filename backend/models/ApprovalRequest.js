const mongoose = require("mongoose");

const approvalStepSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true },
    approverRole: { type: String, enum: ["admin", "hr", "hiring_manager"], required: true },
    approverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, enum: ["pending", "approved", "rejected", "Pending", "Approved", "Rejected"], default: "pending" },
    comment: { type: String, default: "" },
    actedAt: { type: Date, default: null },
  },
  { _id: true }
);

const approvalRequestSchema = new mongoose.Schema(
  {
    entityType: { type: String, enum: ["offer", "letter", "exit"], index: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, index: true },
    requestType: { type: String, enum: ["Letter", "Offer", "Other"] },
    resourceId: { type: mongoose.Schema.Types.ObjectId },
    steps: [approvalStepSchema],
    currentStep: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "Pending", "Approved", "Rejected"],
      default: "pending",
      index: true,
    },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    approverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    comment: { type: String, default: "" },
    comments: { type: String, default: "", trim: true },
    actedAt: { type: Date, default: null },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ApprovalRequest", approvalRequestSchema);
