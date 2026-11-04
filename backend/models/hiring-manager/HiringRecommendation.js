const mongoose = require("mongoose");

const hiringRecommendationSchema = new mongoose.Schema(
  {
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
    hiringManagerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    decision: { type: String, enum: ["select", "reject"], required: true },
    comments: { type: String, required: true, maxlength: 3000 },
    interviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Interview" },
  },
  { timestamps: true }
);

module.exports = mongoose.models.HiringRecommendation ||
  mongoose.model("HiringRecommendation", hiringRecommendationSchema);
