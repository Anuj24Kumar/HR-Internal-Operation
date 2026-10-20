const mongoose = require('mongoose');

const interviewFeedbackSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
  roundId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  interviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  feedback: { type: String, required: true, trim: true, maxlength: 5000 },
  submittedAt: { type: Date, default: Date.now },
  lockedAt: { type: Date, default: null }
}, { timestamps: true });

interviewFeedbackSchema.index({ candidateId: 1, roundId: 1, interviewerId: 1 }, { unique: true });
module.exports = mongoose.models.InterviewFeedback ||
  mongoose.model('InterviewFeedback', interviewFeedbackSchema);
