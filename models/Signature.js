const mongoose = require("mongoose");

const signatureSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Document ID is required"],
      refPath: "documentType",
      index: true,
    },
    documentType: {
      type: String,
      required: [true, "Document type is required"],
      enum: {
        values: ["Offer", "Letter"],
        message: "{VALUE} must be either Offer or Letter",
      },
    },
    signerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    token: {
      type: String,
      required: [true, "Signing token is required"],
      unique: true,
      index: true,
    },
    tokenExpires: {
      type: Date,
      required: [true, "Token expiry date is required"],
    },
    signatureImage: {
      type: String,
      default: null,
    },
    signedAt: {
      type: Date,
      default: null,
    },
    ip: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "signed", "declined", "expired"],
        message: "{VALUE} is not a valid signature status",
      },
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Signature = mongoose.model("Signature", signatureSchema);

module.exports = Signature;
