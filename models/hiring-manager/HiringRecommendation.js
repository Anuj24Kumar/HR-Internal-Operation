const mongoose = require('mongoose');

const hiringRecommendationSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true,
    index: true
  },
  hiringManagerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  decision: {
    type: String,
    enum: ['select', 'reject'],
    required: true
  },
  comments: { type: String, trim: true, maxlength: 3000, required: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

hiringRecommendationSchema.index({ candidateId: 1, hiringManagerId: 1, createdAt: -1 });
module.exports = mongoose.models.HiringRecommendation ||
  mongoose.model('HiringRecommendation', hiringRecommendationSchema);
