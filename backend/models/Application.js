const mongoose = require("mongoose");

const stages = [
  "applied",
  "interview",
  "selected",
  "offer_sent",
  "offer_received",
  "accepted",
  "converted",
  "rejected",
];

const applicationSchema = new mongoose.Schema(
  {
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    candidateName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: String,
    position: { type: String, required: true, trim: true },
    jobType: { type: String, enum: ["internship", "full_time"], required: true },
    source: { type: String, trim: true },
    resumeUrl: String,
    resumeOriginalName: String,
    status: { type: String, enum: stages, default: "applied", index: true },
    currentInterviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Interview" },
    currentOfferId: { type: mongoose.Schema.Types.ObjectId, ref: "Offer" },
    convertedTo: { type: String, enum: ["intern", "employee", null], default: null },
    timeline: [{
      stage: { type: String, enum: stages },
      title: String,
      description: String,
      completed: { type: Boolean, default: false },
      date: Date,
      _id: false,
    }],
    notes: String,
  },
  { timestamps: true }
);

applicationSchema.pre("validate", function () {
  if (this.isNew && this.timeline.length === 0) {
    const now = new Date();
    this.timeline = stages.map((stage) => ({
      stage,
      title: stage.replace(/_/g, " "),
      description: "",
      completed: stage === "applied",
      date: stage === "applied" ? now : null,
    }));
  }
  if (this.isModified("status")) {
    const now = new Date();
    for (const stage of this.timeline) {
      if (stage.stage === this.status) {
        stage.completed = true;
        stage.date = now;
      }
    }
  }
});

module.exports = mongoose.models.Application ||
  mongoose.model("Application", applicationSchema, "applications");
