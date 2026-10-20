
const mongoose = require("mongoose");

const letterSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    letterType: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "Offer Letter",
        "Appointment Letter",
        "Internship Letter",
        "Experience Letter",
        "Relieving Letter",
        "Promotion Letter",
        "Salary Revision Letter",
        "Warning Letter",
        "Other",
      ],
    },

    template: {
      type: String,
      required: true,
      trim: true,
      default: "default",
    },

    placeholders: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    status: {
      type: String,
      enum: [
        "Draft",
        "Pending Approval",
        "Approved",
        "Sent",
        "Signed",
        "Rejected",
      ],
      default: "Draft",
    },

    version: {
      type: Number,
      default: 1,
      min: 1,
    },

    pdfUrl: {
      type: String,
      default: null,
    },

    previousVersions: [
      {
        version: {
          type: Number,
          required: true,
        },
        pdfUrl: {
          type: String,
          required: true,
        },
        generatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    submittedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Letter", letterSchema);
