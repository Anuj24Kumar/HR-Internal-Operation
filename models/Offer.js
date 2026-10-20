const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      index: true,
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    offerType: {
      type: String,
      enum: ["intern", "employee"],
      required: true,
      default: "employee",
    },
    designation: {
      type: String,
      required: [true, "Designation is required"],
      trim: true,
    },
    salary: {
      type: Number,
      required: [true, "Salary or stipend is required"],
      min: 0,
    },
    joiningDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: [
        "draft",
        "pending_approval",
        "sent",
        "accepted",
        "rejected",
        "expired",
      ],
      default: "draft",
      index: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LetterTemplate",
      default: null,
    },
    pdfUrl: {
      type: String,
      default: null,
    },
    approvalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApprovalRequest",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Offer", offerSchema);
