const mongoose = require("mongoose");

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

const employeeSchema = new mongoose.Schema(
  {
    empId: { type: String, trim: true, unique: true, sparse: true, index: true },
    employeeCode: { type: String, trim: true, unique: true, sparse: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    type: { type: String, enum: ["intern", "employee"], default: "employee", index: true },
    employmentType: {
      type: String,
      enum: ["full_time", "part_time", "contract", "intern"],
      default: "full_time",
    },
    personalInfo: { type: mongoose.Schema.Types.Mixed, default: {} },
    department: { type: String, trim: true, default: "General" },
    designation: { type: String, trim: true, default: "" },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    location: { type: String, trim: true, default: "" },
    joiningDate: { type: Date, default: null },
    salary: { type: mongoose.Schema.Types.Mixed, default: null },
    status: {
      type: String,
      enum: ["active", "notice", "inactive", "exited", "Exited", "resigned", "terminated"],
      default: "active",
      index: true,
    },
    history: [historySubdocSchema],
  },
  { timestamps: true }
);

employeeSchema.pre("validate", function () {
  if (!this.user && this.userId) this.user = this.userId;
  if (!this.userId && this.user) this.userId = this.user;
  if (!this.empId && this.employeeCode) this.empId = this.employeeCode;
  if (!this.employeeCode && this.empId) this.employeeCode = this.empId;
  if (this.type === "intern") this.employmentType = "intern";
});

module.exports =
  mongoose.models.Employee ||
  mongoose.model("Employee", employeeSchema);
