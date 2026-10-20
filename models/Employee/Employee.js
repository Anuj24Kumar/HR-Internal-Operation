const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    employeeCode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },

    department: {
      type: String,
      trim: true,
      default: "",
    },

    designation: {
      type: String,
      trim: true,
      default: "",
    },

    employmentType: {
      type: String,
      enum: ["full_time", "part_time", "contract", "intern"],
      default: "full_time",
    },

    joiningDate: {
      type: Date,
      default: null,
    },

    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    location: {
      type: String,
      trim: true,
      default: "",
    },

    salary: {
      basic: { type: Number, min: 0, default: 0 },
      hra: { type: Number, min: 0, default: 0 },
      allowances: { type: Number, min: 0, default: 0 },
      pf: { type: Number, min: 0, default: 0 },
      totalCTC: { type: Number, min: 0, default: 0 },
    },

    status: {
      type: String,
      enum: ["active", "resigned", "terminated"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);