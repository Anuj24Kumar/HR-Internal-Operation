const mongoose = require("mongoose");

const employeeLetterSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    letterType: {
      type: String,
      enum: [
        "offer",
        "appointment",
        "promotion",
        "increment",
        "experience",
        "other",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    version: {
      type: Number,
      default: 1,
      min: 1,
    },

    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },

    issuedAt: {
      type: Date,
      default: Date.now,
    },

    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "superseded", "revoked"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Prevent duplicate versions of the same letter for one employee.
employeeLetterSchema.index(
  { employee: 1, letterType: 1, version: 1 },
  { unique: true }
);

module.exports = mongoose.model("EmployeeLetter", employeeLetterSchema);