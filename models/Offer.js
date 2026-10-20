const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    offerType: {
      type: String,
      enum: ["intern", "employee"],
      required: true,
    },

    designation: {
      type: String,
      required: true,
      trim: true,
    },

    salary: {
      type: Number,
      required: true,
      min: 0,
    },

    joiningDate: {
      type: Date,
      required: true,
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
    },

    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    pdfUrl: {
      type: String,
      default: "",
      trim: true,
    },

    approvalId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Offer", offerSchema);