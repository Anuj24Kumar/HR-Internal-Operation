const mongoose = require("mongoose");

const employeeHistorySchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    historyType: {
      type: String,
      enum: ["promotion", "transfer", "increment"],
      required: true,
    },

    oldValues: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    newValues: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmployeeHistory", employeeHistorySchema);