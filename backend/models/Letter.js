const mongoose = require("mongoose");

const letterSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["appointment", "promotion", "increment", "experience", "relieving", "warning", "other"], required: true },
    title: { type: String, required: true },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: "LetterTemplate" },
    placeholders: mongoose.Schema.Types.Mixed,
    version: { type: Number, min: 1, default: 1 },
    status: { type: String, enum: ["draft", "pending_approval", "approved", "generated", "sent"], default: "draft" },
    pdfUrl: String,
    approvalId: { type: mongoose.Schema.Types.ObjectId, ref: "ApprovalRequest" },
    previousVersions: [{
      version: Number,
      pdfUrl: String,
      generatedAt: Date,
      _id: false,
    }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    issuedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.models.Letter || mongoose.model("Letter", letterSchema);
