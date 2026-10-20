
const mongoose = require("mongoose");

const clearanceSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
    },
    clearedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    clearedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const exitSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    resignationDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    lastWorkingDay: {
      type: Date,
      required: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "Pending Approval",
        "Approved",
        "Rejected",
        "Completed",
      ],
      default: "Pending Approval",
    },

    clearance: {
      it: { type: clearanceSchema, default: () => ({}) },
      finance: { type: clearanceSchema, default: () => ({}) },
      manager: { type: clearanceSchema, default: () => ({}) },
      hr: { type: clearanceSchema, default: () => ({}) },
    },

    clearanceProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    approvalRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApprovalRequest",
      default: null,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    relievingLetterUrl: {
      type: String,
      default: null,
    },

    experienceLetterUrl: {
      type: String,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

exitSchema.pre("save", function () {
  const departments = ["it", "finance", "manager", "hr"];

  const completedCount = departments.filter(
    (department) =>
      this.clearance[department]?.status === "Completed"
  ).length;

  this.clearanceProgress = Math.round(
    (completedCount / departments.length) * 100
  );
});

module.exports = mongoose.model("Exit", exitSchema);
