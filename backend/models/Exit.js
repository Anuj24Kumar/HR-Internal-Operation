const mongoose = require("mongoose");

const departmentalClearanceSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: true,
      enum: {
        values: ["IT", "Finance", "Manager", "HR"],
        message: "{VALUE} is not a valid clearance department",
      },
    },
    status: {
      type: String,
      enum: ["pending", "cleared", "rejected"],
      default: "pending",
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
    comments: {
      type: String,
      default: "",
    },
  },
  { _id: true }
);

const exitSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee reference is required"],
      index: true,
    },
    resignationDate: {
      type: Date,
      required: [true, "Resignation date is required"],
    },
    lastWorkingDay: {
      type: Date,
      required: [true, "Last working day is required"],
    },
    reason: {
      type: String,
      default: "",
    },
    clearance: {
      type: [departmentalClearanceSchema],
      default: () => [
        { department: "IT", status: "pending" },
        { department: "Finance", status: "pending" },
        { department: "Manager", status: "pending" },
        { department: "HR", status: "pending" },
      ],
    },
    approvalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApprovalRequest",
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ["initiated", "in_clearance", "completed"],
        message: "{VALUE} is not a valid exit status",
      },
      default: "initiated",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Exit = mongoose.model("Exit", exitSchema);

module.exports = Exit;
