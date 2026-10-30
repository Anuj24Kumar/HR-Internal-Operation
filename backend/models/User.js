const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    firstName: { type: String, trim: true, default: "" },
    lastName: { type: String, trim: true, default: "" },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, minlength: 8, select: false },
    passwordHash: { type: String, select: false },
    phone: { type: String, trim: true, default: "" },
    role: {
      type: String,
      required: true,
      enum: [
        "admin",
        "hr",
        "hiring_manager",
        "interviewer",
        "candidate",
        "intern",
        "employee",
      ],
      default: "candidate",
      index: true,
    },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", default: null },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    hiringManagerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    department: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true, index: true },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    profileImage: { type: String, default: "" },
    isEmailVerified: { type: Boolean, default: false },
    lastLogin: { type: Date, default: null },
    resetToken: { type: String, default: null },
    resetExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.pre("validate", function () {
  if (!this.name && (this.firstName || this.lastName)) {
    this.name = [this.firstName, this.lastName].filter(Boolean).join(" ");
  }
  if (this.isNew && !this.password && !this.passwordHash) {
    this.invalidate("passwordHash", "A password is required");
  }
  if (!this.name) {
    this.invalidate("name", "A user name is required");
  }
  if (this.isModified("status") && !this.isModified("isActive")) {
    this.isActive = this.status === "active";
  } else if (this.isModified("isActive")) {
    this.status = this.isActive ? "active" : "inactive";
  }
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  const hash = this.passwordHash || this.password;
  return hash ? bcrypt.compare(enteredPassword, hash) : false;
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.passwordHash;
  delete user.resetToken;
  delete user.resetExpires;
  return user;
};

module.exports = mongoose.model("User", userSchema);
