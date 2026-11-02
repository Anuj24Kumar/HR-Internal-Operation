const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const interviewRoundSchema = new mongoose.Schema(
  {
    round: { type: Number, required: true },
    scheduledAt: { type: Date, required: true },
    interviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, default: null },
    feedback: { type: String, default: "" },
    feedbackSubmittedAt: { type: Date, default: null },
    feedbackLocked: { type: Boolean, default: false },
    lockedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },
  },
  { timestamps: true }
);

const historySubdocSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["promotion", "transfer", "increment"], required: true },
    date: { type: Date, default: Date.now },
    reason: { type: String, default: "" },
    oldValue: { type: mongoose.Schema.Types.Mixed, default: null },
    newValue: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    // --- Core Identity & Authentication (All 7 Roles) ---
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
    department: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true, index: true },
    status: {
      type: String,
      default: "active",
      index: true,
    },
    profileImage: { type: String, default: "" },
    isEmailVerified: { type: Boolean, default: false },
    lastLogin: { type: Date, default: null },
    resetToken: { type: String, default: null },
    resetExpires: { type: Date, default: null },

    // --- Candidate Specific Fields ---
    position: { type: String, trim: true, default: "" },
    source: { type: String, trim: true, default: "Direct" },
    applicationSource: { type: String, trim: true, default: "Direct" },
    resumeUrl: { type: String, default: null },
    appliedDate: { type: Date, default: Date.now },
    selectedAs: { type: String, enum: ["intern", "employee", null], default: null },
    hiringManagerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    hiringRecommendation: {
      status: { type: String, enum: ["select", "reject", null], default: null },
      comments: { type: String, default: null },
      recommendedAt: { type: Date, default: null },
      recommendedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    },
    interviews: [interviewRoundSchema],
    isArchived: { type: Boolean, default: false, index: true },
    archived: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // --- Employee Specific Fields ---
    empId: { type: String, trim: true, sparse: true, index: true },
    employeeCode: { type: String, trim: true, sparse: true },
    designation: { type: String, trim: true, default: "" },
    joiningDate: { type: Date, default: null },
    employmentType: {
      type: String,
      enum: ["full_time", "part_time", "contract", "intern", "Full-time", "Part-time"],
      default: "full_time",
    },
    salary: { type: mongoose.Schema.Types.Mixed, default: null },
    personalInfo: { type: mongoose.Schema.Types.Mixed, default: {} },
    employmentDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    history: [historySubdocSchema],

    // --- Intern Specific Fields ---
    domain: { type: String, trim: true, default: "" },
    track: { type: String, trim: true, default: "" },
    stipend: { type: Number, min: 0, default: 0 },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    onboardingStatus: { type: String, default: "In Progress" },
    location: { type: String, trim: true, default: "" },

    // Self/cross-references for backward compatibility
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

userSchema.pre("validate", function () {
  if (!this.name && (this.firstName || this.lastName)) {
    this.name = [this.firstName, this.lastName].filter(Boolean).join(" ");
  }
  if (!this.firstName && !this.lastName && this.name) {
    const parts = this.name.split(" ");
    this.firstName = parts[0] || "";
    this.lastName = parts.slice(1).join(" ") || "";
  }
  if (this.isNew && !this.password && !this.passwordHash) {
    this.passwordHash = bcrypt.hashSync("User@12345", 10);
  }
  if (!this.name) {
    this.name = this.email ? this.email.split("@")[0] : "User";
  }

  // Account status vs application status
  if (this.isModified("status") && !this.isModified("isActive")) {
    if (this.status === "inactive" || this.status === "suspended") {
      this.isActive = false;
    } else {
      this.isActive = true;
    }
  } else if (this.isModified("isActive")) {
    this.status = this.isActive
      ? (this.status && this.status !== "inactive" && this.status !== "suspended" ? this.status : "active")
      : "inactive";
  }

  // Cross-reference auto-assignment to self
  if (!this.candidateId && this.role === "candidate") {
    this.candidateId = this._id;
  }
  if (!this.employeeId && this.role === "employee") {
    this.employeeId = this._id;
  }
  if (!this.user) {
    this.user = this._id;
  }
  if (!this.userId) {
    this.userId = this._id;
  }
  if (!this.empId && this.employeeCode) this.empId = this.employeeCode;
  if (!this.employeeCode && this.empId) this.employeeCode = this.empId;
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

module.exports = mongoose.model("User", userSchema, "users");
