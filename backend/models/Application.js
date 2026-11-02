const mongoose = require("mongoose");

const applicationTimelineSchema = new mongoose.Schema(
  {
    stage: {
      type: String,
      required: true,
      default: "Applied",
    },
    title: {
      type: String,
      required: true,
      default: "Application Submitted",
    },
    description: {
      type: String,
      default: "Your application has been received.",
    },
    completed: {
      type: Boolean,
      default: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const applicationSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    candidateName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    position: {
      type: String,
      required: true,
      trim: true,
    },
    jobType: {
      type: String,
      enum: ["Internship", "Full-time"],
      required: true,
      default: "Full-time",
    },
    resumeUrl: {
      type: String,
      trim: true,
      default: "",
    },
    resumeOriginalName: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["Applied", "Screening", "Interview", "Selected", "Rejected"],
      default: "Applied",
    },
    timeline: {
      type: [applicationTimelineSchema],
      default: () => [
        {
          stage: "Applied",
          title: "Application Submitted",
          description: "Your application has been received and logged.",
          completed: true,
          date: new Date(),
        },
      ],
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "applications",
  }
);

module.exports = mongoose.model("Application", applicationSchema, "applications");
