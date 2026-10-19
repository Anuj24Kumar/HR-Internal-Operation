const mongoose = require("mongoose");

const interviewRoundSchema = new mongoose.Schema(
  {
    round: {
      type: Number,
      required: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    interviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    feedback: {
      type: String,
      default: "",
    },
    feedbackSubmittedAt: {
      type: Date,
      default: null,
    },
    feedbackLocked: {
      type: Boolean,
      default: false,
    },
    lockedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },
  },
  { _id: true, timestamps: true }
);

const candidateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: {
      type: String,
      required: [true, "Candidate name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Candidate email is required"],
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    position: {
      type: String,
      required: [true, "Position is required"],
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      default: null,
    },
    source: {
      type: String,
      trim: true,
      default: "Direct",
    },
    resumeUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ["applied", "screening", "interview", "selected", "rejected"],
        message: "{VALUE} is not a valid candidate status",
      },
      default: "applied",
      index: true,
    },
    selectedAs: {
      type: String,
      enum: ["intern", "employee", null],
      default: null,
    },
    hiringManagerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    hiringRecommendation: {
      status: {
        type: String,
        enum: ["select", "reject", null],
        default: null,
      },
      comments: {
        type: String,
        default: null,
      },
      recommendedAt: {
        type: Date,
        default: null,
      },
      recommendedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },
    interviews: [interviewRoundSchema],
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Candidate = mongoose.model("Candidate", candidateSchema);

module.exports = Candidate;
