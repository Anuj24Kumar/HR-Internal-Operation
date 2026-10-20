
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      required: true,
      enum: [
        "admin",
        "hr",
        "hiring_manager",
        "interviewer",
        "candidate",
      ],
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    department: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    resetToken: {
      type: String,
      default: null,
    },
    resetExpires: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model("User", userSchema);
