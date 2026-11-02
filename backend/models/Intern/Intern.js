const mongoose = require("mongoose");

const internSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      default: "intern",
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      sparse: true,
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    department: {
      type: String,
      trim: true,
      default: "",
    },
    designation: {
      type: String,
      trim: true,
      default: "Intern",
    },
    domain: {
      type: String,
      trim: true,
      default: "",
    },
    track: {
      type: String,
      trim: true,
      default: "",
    },
    stipend: {
      type: Number,
      min: 0,
      default: 0,
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    joiningDate: {
      type: Date,
      default: null,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    onboardingStatus: {
      type: String,
      default: "In Progress",
    },
    status: {
      type: String,
      enum: ["active", "completed", "terminated"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

internSchema.pre("validate", function () {
  this.role = "intern";
  if (!this.user) {
    this.user = this._id;
  }
});

module.exports =
  mongoose.models.Intern ||
  mongoose.model("Intern", internSchema, "users");
