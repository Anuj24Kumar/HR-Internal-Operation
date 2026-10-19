const mongoose = require("mongoose");

const letterSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee reference is required"],
      index: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LetterTemplate",
      required: [true, "Template reference is required"],
    },
    type: {
      type: String,
      required: [true, "Letter type is required"],
      enum: {
        values: [
          "offer",
          "appointment",
          "promotion",
          "increment",
          "experience",
          "relieving",
          "warning",
        ],
        message: "{VALUE} is not a valid letter type",
      },
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: {
        values: [
          "draft",
          "pending_approval",
          "generated",
          "sent",
          "signed",
        ],
        message: "{VALUE} is not a valid letter status",
      },
      default: "draft",
      index: true,
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

const Letter = mongoose.model("Letter", letterSchema);

module.exports = Letter;
