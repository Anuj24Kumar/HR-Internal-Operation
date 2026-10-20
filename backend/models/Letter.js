const mongoose = require("mongoose");

const letterSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: "LetterTemplate", default: null },
    type: {
      type: String,
      enum: ["offer", "appointment", "promotion", "increment", "experience", "relieving", "warning"],
      index: true,
    },
    letterType: {
      type: String,
      trim: true,
      enum: [
        "Offer Letter", "Appointment Letter", "Internship Letter", "Experience Letter",
        "Relieving Letter", "Promotion Letter", "Salary Revision Letter", "Warning Letter", "Other",
      ],
    },
    template: { type: String, trim: true, default: "default" },
    placeholders: { type: mongoose.Schema.Types.Mixed, default: {} },
    version: { type: Number, default: 1, min: 1 },
    status: {
      type: String,
      enum: ["draft", "pending_approval", "generated", "sent", "signed", "Draft", "Pending Approval", "Approved", "Sent", "Signed", "Rejected"],
      default: "draft",
      index: true,
    },
    pdfUrl: { type: String, default: null },
    approvalId: { type: mongoose.Schema.Types.ObjectId, ref: "ApprovalRequest", default: null },
    previousVersions: [{
      version: { type: Number, required: true },
      pdfUrl: { type: String, required: true },
      generatedAt: { type: Date, default: Date.now },
    }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Letter", letterSchema);
