const mongoose = require("mongoose");

const approvalStepSchema = new mongoose.Schema(
  {
    order: {
      type: Number,
      required: true,
    },
    approverRole: {
      type: String,
      enum: ["admin", "hr", "hiring_manager"],
      required: true,
    },
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    comment: {
      type: String,
      default: "",
    },
    actedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
);

const approvalRequestSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      required: [true, "Entity type is required"],
      enum: {
        values: ["offer", "letter", "exit"],
        message: "{VALUE} is not a valid approval entity type",
      },
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Entity ID is required"],
      index: true,
    },
    steps: [approvalStepSchema],
    currentStep: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected"],
        message: "{VALUE} is not a valid approval status",
      },
      default: "pending",
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Requested by user reference is required"],
    },
  },
  {
    timestamps: true,
  }
);

const ApprovalRequest = mongoose.model("ApprovalRequest", approvalRequestSchema);

module.exports = ApprovalRequest;
