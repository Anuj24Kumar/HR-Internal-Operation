const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    passwordHash: { type: String, select: false },
    passwordResetRequired: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ["candidate", "hr", "interviewer", "hiring_manager", "intern", "employee", "admin"],
      default: "candidate",
      index: true,
    },
    profileImage: String,
    isActive: { type: Boolean, default: true, index: true },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "notice", "exited", "completed", "terminated"],
      default: "active",
    },
    lastLogin: Date,
    lastLogout: Date,
    resetToken: { type: String, select: false },
    resetExpires: { type: Date, select: false },
    isEmailVerified: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    position: { type: String, trim: true },
    resumeUrl: String,
    appliedDate: Date,
    selectedAs: { type: String, enum: ["intern", "employee", null], default: null },
    hiringManagerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    hiringRecommendation: {
      status: { type: String, enum: ["select", "reject", "pending", null], default: null },
      comments: String,
      recommendedAt: Date,
      recommendedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },

    empId: { type: String, unique: true, sparse: true },
    employeeCode: { type: String, unique: true, sparse: true },
    designation: { type: String, trim: true },
    department: { type: String, trim: true },
    joiningDate: Date,
    employmentType: {
      type: String,
      enum: ["full_time", "part_time", "contract", "intern"],
      default: "full_time",
    },
    salary: mongoose.Schema.Types.Mixed,
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    location: { type: String, trim: true },

    domain: { type: String, trim: true },
    track: { type: String, trim: true },
    stipend: Number,
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    startDate: Date,
    endDate: Date,
    onboardingStatus: { type: String, default: "in_progress" },
  },
  { timestamps: true }
);

userSchema.pre("validate", function () {
  if (!this.name && (this.firstName || this.lastName)) {
    this.name = [this.firstName, this.lastName].filter(Boolean).join(" ");
  }
});

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  const hash = this.password || this.passwordHash;
  if (!hash || !enteredPassword) return false;
  return bcrypt.compare(enteredPassword, hash);
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.passwordHash;
  delete user.resetToken;
  delete user.resetExpires;
  return user;
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema, "users");
