const mongoose = require("mongoose");

const historySubdocSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["promotion", "transfer", "increment"],
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
      default: "",
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { _id: true }
);

const employeeSchema = new mongoose.Schema(
  {
    empId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
    employeeCode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      sparse: true,
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ["intern", "employee"],
        message: "{VALUE} is not a valid employee type",
      },
      default: "employee",
      index: true,
    },
    employmentType: {
      type: String,
      enum: ["full_time", "part_time", "contract", "intern"],
      default: "full_time",
    },
    personalInfo: {
      dob: { type: Date, default: null },
      address: { type: String, default: null },
      emergencyContact: {
        name: { type: String, default: null },
        relation: { type: String, default: null },
        phone: { type: String, default: null },
      },
      idNumbers: {
        pan: { type: String, default: null },
        aadhaar: { type: String, default: null },
        passport: { type: String, default: null },
      },
    },
    department: {
      type: String,
      trim: true,
      default: "General",
    },
    designation: {
      type: String,
      trim: true,
      default: "",
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
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
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    salary: {
      type: mongoose.Schema.Types.Mixed,
      default: () => 0,
    },
    status: {
      type: String,
      enum: {
        values: [
          "active",
          "notice",
          "exited",
          "resigned",
          "terminated",
        ],
        message: "{VALUE} is not a valid employment status",
      },
      default: "active",
      index: true,
    },
    history: [historySubdocSchema],
  },
  {
    timestamps: true,
  }
);

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;
