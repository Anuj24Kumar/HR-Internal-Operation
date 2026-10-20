
const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
      index: true,
    },
    roundName: {
      type: String,
      required: true,
      trim: true,
    },
    interviewType: {
      type: String,
      enum: ["technical", "hr", "managerial", "other"],
      default: "technical",
    },
    interviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },
    meetingLink: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Interview", interviewSchema);
