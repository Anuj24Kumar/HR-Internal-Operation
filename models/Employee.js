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
      required: [true, "Employee ID is required"],
      unique: true,
      trim: true,
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
      required: [true, "User reference is required"],
      index: true,
    },
    type: {
      type: String,
      required: [true, "Employee type is required"],
      enum: {
        values: ["intern", "employee"],
        message: "{VALUE} is not a valid employee type",
      },
      index: true,
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
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    salary: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: {
        values: ["active", "notice", "exited"],
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
