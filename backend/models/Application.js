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
      enum: ["Applied", "Interview", "Selected", "Offer", "Rejected"],
      default: "Applied",
    },
    timeline: {
      type: [applicationTimelineSchema],
      default: () => [
        {
          stage: "Applied",
          title: "Applied",
          description: "Your application has been received and logged.",
          completed: true,
          date: new Date(),
        },
        {
          stage: "Interview",
          title: "Interview",
          description: "Your application is moving forward to the interview stage.",
          completed: false,
          date: null,
        },
        {
          stage: "Selected",
          title: "Selected",
          description: "You have been selected and are progressing to the final stage.",
          completed: false,
          date: null,
        },
        {
          stage: "Offer",
          title: "Offer",
          description: "The final offer is being prepared for you.",
          completed: false,
          date: null,
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
