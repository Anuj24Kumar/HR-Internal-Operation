const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: [true, "Candidate reference is required"],
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
      required: [true, "Salary/Stipend is required"],
    },
    joiningDate: {
      type: Date,
      required: [true, "Joining date is required"],
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: [
          "draft",
          "pending_approval",
          "sent",
          "accepted",
          "rejected",
          "expired",
        ],
        message: "{VALUE} is not a valid offer status",
      },
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

const Offer = mongoose.model("Offer", offerSchema);

module.exports = Offer;
