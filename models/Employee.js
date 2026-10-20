
const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    empId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: ["intern", "employee"],
      required: true,
    },
    personalInfo: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    department: {
      type: String,
      default: "",
      trim: true,
    },
    designation: {
      type: String,
      default: "",
      trim: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    joiningDate: {
      type: Date,
      default: null,
    },
    salary: {
      type: Number,
      default: null,
    },
   status: {
  type: String,
  enum: ["active", "notice", "inactive", "Exited"],
  default: "active"
},
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
