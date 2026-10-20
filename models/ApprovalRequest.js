
const mongoose = require("mongoose");

const approvalRequestSchema = new mongoose.Schema(
  {
    requestType: {
      type: String,
      required: true,
      enum: ["Letter", "Offer", "Other"],
    },

    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    comments: {
      type: String,
      default: "",
      trim: true,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ApprovalRequest",
  approvalRequestSchema
);
