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
    role: { type: String, default: "employee", index: true },
    name: { type: String, trim: true, default: "" },
    email: { type: String, lowercase: true, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    empId: { type: String, trim: true, sparse: true, index: true },
    employeeCode: { type: String, trim: true, sparse: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    type: { type: String, enum: ["intern", "employee"], default: "employee", index: true },
    employmentType: {
      type: String,
      enum: ["full_time", "part_time", "contract", "intern", "Full-time", "Part-time"],
      default: "full_time",
    },
    personalInfo: { type: mongoose.Schema.Types.Mixed, default: {} },
    employmentDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
    department: { type: String, trim: true, default: "General" },
    designation: { type: String, trim: true, default: "" },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
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
  { timestamps: true, collection: "users" }
);

employeeSchema.pre("validate", function () {
  this.role = "employee";
  if (!this.user && this.userId) this.user = this.userId;
  if (!this.userId && this.user) this.userId = this.user;
  if (!this.user) this.user = this._id;
  if (!this.userId) this.userId = this._id;
  if (!this.empId && this.employeeCode) this.empId = this.employeeCode;
  if (!this.employeeCode && this.empId) this.employeeCode = this.empId;
  if (this.type === "intern") this.employmentType = "intern";
});

module.exports =
  mongoose.models.Employee ||
  mongoose.model("Employee", employeeSchema, "users");
