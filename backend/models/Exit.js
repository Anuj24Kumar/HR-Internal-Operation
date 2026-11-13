const mongoose = require("mongoose");

const clearanceSchema = new mongoose.Schema(
  {
    department: { type: String, enum: ["IT", "Finance", "Manager", "HR"], default: undefined },
    status: {
      type: String,
      enum: ["pending", "cleared", "rejected"],
      default: "pending",
    },
    clearedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    clearedAt: { type: Date, default: null },
    comments: { type: String, default: "" },
  },
  { _id: true }
);

const exitClearanceSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
    clearedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    clearedAt: { type: Date, default: null },
  },
  { _id: false }
);

const exitSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    resignationDate: { type: Date, required: true, default: Date.now },
    lastWorkingDay: { type: Date, required: true },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["initiated", "in_clearance", "completed", "pending_approval", "approved", "rejected"],
      default: "pending_approval",
      index: true,
    },
    clearance: {
      it: { type: exitClearanceSchema, default: () => ({}) },
      finance: { type: exitClearanceSchema, default: () => ({}) },
      manager: { type: exitClearanceSchema, default: () => ({}) },
      hr: { type: exitClearanceSchema, default: () => ({}) },
    },
    clearances: { type: [clearanceSchema], default: undefined },
    clearanceProgress: { type: Number, default: 0, min: 0, max: 100 },
    approvalId: { type: mongoose.Schema.Types.ObjectId, ref: "ApprovalRequest", default: null },
    approvalRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "ApprovalRequest", default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },
    relievingLetterUrl: { type: String, default: null },
    experienceLetterUrl: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

exitSchema.pre("save", function () {
  const departments = ["it", "finance", "manager", "hr"];
  const completed = departments.filter(
    (department) => this.clearance[department]?.status === "completed"
  ).length;
  this.clearanceProgress = Math.round((completed / departments.length) * 100);
});

module.exports = mongoose.model("Exit", exitSchema);
