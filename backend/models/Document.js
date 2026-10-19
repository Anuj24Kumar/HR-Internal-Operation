const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Owner ID is required"],
      refPath: "ownerType",
      index: true,
    },
    ownerType: {
      type: String,
      required: [true, "Owner type is required"],
      enum: {
        values: ["Candidate", "Employee"],
        message: "{VALUE} must be either Candidate or Employee",
      },
      index: true,
    },
    category: {
      type: String,
      required: [true, "Document category is required"],
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
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
      enum: {
        values: ["pending", "uploaded", "verified", "rejected"],
        message: "{VALUE} is not a valid document status",
      },
      default: "uploaded",
      index: true,
    },
    rejectionReason: {
      type: String,
      default: null,
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
  },
  {
    timestamps: true,
  }
);

const Document = mongoose.model("Document", documentSchema);

module.exports = Document;
