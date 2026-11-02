const mongoose = require("mongoose");

const interviewRoundSchema = new mongoose.Schema(
  {
    round: { type: Number, required: true },
    scheduledAt: { type: Date, required: true },
    interviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, default: null },
    feedback: { type: String, default: "" },
    feedbackSubmittedAt: { type: Date, default: null },
    feedbackLocked: { type: Boolean, default: false },
    lockedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },
  },
  { timestamps: true }
);

const candidateSchema = new mongoose.Schema(
  {
    role: { type: String, default: "candidate", index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", sparse: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, trim: true, default: "" },
    firstName: { type: String, trim: true, default: "" },
    lastName: { type: String, trim: true, default: "" },
    email: { type: String, lowercase: true, trim: true, default: "", index: true },
    phone: { type: String, trim: true, default: null },
    position: { type: String, trim: true, default: "Candidate" },
    department: { type: String, trim: true, default: null },
    source: { type: String, trim: true, default: "Direct" },
    applicationSource: { type: String, trim: true, default: "Direct" },
    resumeUrl: { type: String, default: null },
    appliedDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: [
        "applied",
        "screening",
        "interview",
        "selected",
        "rejected",
        "Applied",
        "Screening",
        "Interview",
        "Selected",
        "Rejected",
      ],
      default: "Applied",
      index: true,
    },
    selectedAs: { type: String, enum: ["intern", "employee", null], default: null },
    hiringManagerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    hiringRecommendation: {
      status: { type: String, enum: ["select", "reject", null], default: null },
      comments: { type: String, default: null },
      recommendedAt: { type: Date, default: null },
      recommendedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    },
    interviews: [interviewRoundSchema],
    isArchived: { type: Boolean, default: false, index: true },
    archived: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, collection: "users" }
);

candidateSchema.pre("validate", function () {
  this.role = "candidate";
  if (!this.name && (this.firstName || this.lastName)) {
    this.name = [this.firstName, this.lastName].filter(Boolean).join(" ");
  }
  if (!this.user) {
    this.user = this._id;
  }
  if (!this.userId) {
    this.userId = this._id;
  }
});

module.exports =
  mongoose.models.Candidate ||
  mongoose.model("Candidate", candidateSchema, "users");
