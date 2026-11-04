const mongoose = require("mongoose");

const interviewFeedbackSchema = new mongoose.Schema(
  {
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
    interviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Interview" },
    roundId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    interviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    score: { type: Number, min: 0, max: 100 },
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String, trim: true, maxlength: 5000 },
    submittedAt: { type: Date, default: Date.now },
    lockedAt: Date,
  },
  { timestamps: true }
);

interviewFeedbackSchema.index({ candidateId: 1, roundId: 1, interviewerId: 1 });
module.exports = mongoose.models.InterviewFeedback ||
  mongoose.model("InterviewFeedback", interviewFeedbackSchema);
