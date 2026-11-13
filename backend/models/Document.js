const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    ownerRole: { type: String, enum: ["candidate", "intern", "employee"], required: true },
    offerId: { type: mongoose.Schema.Types.ObjectId, ref: "Offer", default: null, index: true },
    requiredDocId: { type: String, default: null },
    category: { type: String, required: true, enum: ["resume", "identity", "education", "experience", "offer_letter_signed", "other"] },
    documentType: { type: String, required: true },
    label: { type: String, required: true },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileUrl: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending", index: true },
    rejectionReason: String,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: Date,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Document || mongoose.model("Document", documentSchema);
