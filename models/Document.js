
const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      default: null,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    documentType: {
      type: String,
      required: true,
      trim: true,
    },

    originalName: {
      type: String,
      required: true,
      trim: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    filePath: {
      type: String,
      required: true,
    },

    mimeType: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
      required: true,
      min: 1,
      max: 5 * 1024 * 1024,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

// Each document must belong to a candidate or an employee.

documentSchema.pre("validate", function () {
  const hasCandidate = Boolean(this.candidateId);
  const hasEmployee = Boolean(this.employeeId);

  if (hasCandidate === hasEmployee) {
    this.invalidate(
      "candidateId",
      "Provide exactly one of candidateId or employeeId"
    );
  }
});


module.exports = mongoose.model("Document", documentSchema);
