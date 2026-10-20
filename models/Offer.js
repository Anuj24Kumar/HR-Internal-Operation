
const mongoose = require("mongoose");

const approvalHistorySchema = new mongoose.Schema(
  {
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approverRole: {
      type: String,
      enum: ["admin", "hr", "hiring_manager"],
      required: true,
    },
    action: {
      type: String,
      enum: ["approved", "rejected"],
      required: true,
    },
    comments: {
      type: String,
      trim: true,
      default: "",
    },
    decidedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const offerSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    salary: {
      type: Number,
      required: true,
      min: 0,
    },

    designation: {
      type: String,
      required: true,
      trim: true,
    },

    joiningDate: {
      type: Date,
      required: true,
    },

    template: {
      type: String,
      default: "default",
      trim: true,
    },

   status: {
  type: String,
  enum: [
    "Draft",
    "Pending Approval",
    "Approved",
    "Sent",
    "Expired",
    "Accepted",
    "Rejected",
  ],
  default: "Draft",
},

    // Approval tracking
    approvalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    approvalHistory: {
      type: [approvalHistorySchema],
      default: [],
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    sentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Offer", offerSchema);
