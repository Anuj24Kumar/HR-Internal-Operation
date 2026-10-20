const mongoose = require("mongoose");

const employmentHistorySchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    changeType: {
      type: String,
      enum: ["promotion", "transfer", "salary_increment", "designation_change"],
      required: true,
    },

    previousDepartment: {
      type: String,
      trim: true,
      default: "",
    },

    newDepartment: {
      type: String,
      trim: true,
      default: "",
    },

    previousDesignation: {
      type: String,
      trim: true,
      default: "",
    },

    newDesignation: {
      type: String,
      trim: true,
      default: "",
    },

    previousSalary: {
      type: Number,
      min: 0,
      default: 0,
    },

    newSalary: {
      type: Number,
      min: 0,
      default: 0,
    },

    effectiveDate: {
      type: Date,
      required: true,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "EmploymentHistory",
  employmentHistorySchema
);