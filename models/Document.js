const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "ownerType",
      default: null,
      index: true,
    },
    ownerType: {
      type: String,
      enum: ["Candidate", "Employee", "Intern"],
      index: true,
    },
    category: {
      type: String,
      trim: true,
      default: "",
    },
    fileType: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "uploaded", "verified", "rejected"],
      default: "uploaded",
      index: true,
    },
    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    documentType: {
      type: String,
      enum: [
        "resume",
        "aadhaar",
        "pan",
        "educational_certificate",
        "experience_letter",
        "other",
      ],
    },
    documentName: {
      type: String,
      trim: true,
      default: "",
    },
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
      trim: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Document", documentSchema);
