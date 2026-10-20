const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, refPath: "ownerType", default: null, index: true },
    ownerType: { type: String, enum: ["Candidate", "Employee", "Intern"] },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", default: null },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    category: { type: String, trim: true, default: "" },
    documentType: { type: String, trim: true },
    documentName: { type: String, trim: true, default: "" },
    originalName: { type: String, trim: true, default: "" },
    fileName: { type: String, default: "" },
    filePath: { type: String, default: "" },
    fileUrl: { type: String, trim: true, default: "" },
    fileType: { type: String, default: null },
    mimeType: { type: String, default: "" },
    fileSize: { type: Number, default: null },
    size: { type: Number, min: 1, max: 5 * 1024 * 1024 },
    status: {
      type: String,
      enum: ["pending", "uploaded", "verified", "rejected", "Pending", "Verified", "Rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: { type: String, default: "", trim: true },
    version: { type: Number, default: 1 },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    verifiedAt: { type: Date, default: null },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

documentSchema.pre("validate", function () {
  if (!this.fileUrl && this.filePath) {
    this.fileUrl = this.filePath;
  }
  if (!this.filePath && this.fileUrl.startsWith("/")) {
    this.filePath = this.fileUrl;
  }
  if (!this.documentName && this.originalName) {
    this.documentName = this.originalName;
  }
  if (!this.originalName && this.documentName) {
    this.originalName = this.documentName;
  }
  if (!this.fileUrl && !this.filePath) {
    this.invalidate("filePath", "A document file path or URL is required");
  }
  const hasCandidate = Boolean(this.candidateId);
  const hasEmployee = Boolean(this.employeeId);
  if (hasCandidate && hasEmployee) {
    this.invalidate("candidateId", "Provide only one of candidateId or employeeId");
  }
});

module.exports = mongoose.model("Document", documentSchema);
