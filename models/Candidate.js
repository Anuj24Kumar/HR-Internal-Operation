
const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
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
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      trim: true,
      default: "Other",
    },
    resumeUrl: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "applied",
        "screening",
        "interview",
        "selected",
        "rejected",
      ],
      default: "applied",
    },
    selectedAs: {
      type: String,
      enum: ["intern", "employee", null],
      default: null,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Candidate", candidateSchema);
