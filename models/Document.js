const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    documentType: {
      type: String,
      required: [true, "Document type is required"],
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
      required: [true, "Document name is required"],
      trim: true,
    },

    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },

    rejectionReason: {
      type: String,
      default: "",
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