const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true, index: true },
    roundName: { type: String, required: true, trim: true },
    interviewType: { type: String, enum: ["technical", "hr", "managerial", "other"], default: "technical" },
    interviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    scheduledAt: { type: Date, required: true },
    meetingLink: String,
    status: { type: String, enum: ["scheduled", "completed", "cancelled", "rescheduled"], default: "scheduled", index: true },
    score: { type: Number, min: 0, max: 100 },
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String, maxlength: 5000 },
    feedbackSubmittedAt: Date,
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

interviewSchema.pre("validate", function () {
  if (this.status === "completed" &&
      (this.score == null || this.rating == null || !this.feedback?.trim())) {
    this.invalidate("status", "Completed interviews require a score, rating, and feedback");
  }
});

module.exports = mongoose.models.Interview || mongoose.model("Interview", interviewSchema);
