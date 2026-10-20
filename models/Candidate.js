const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    // Link to the existing User account
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    position: {
      type: String,
      required: [true, "Applied position is required"],
      trim: true,
    },

    applicationSource: {
      type: String,
      trim: true,
      default: "Direct",
    },

    appliedDate: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: [
        "Applied",
        "Screening",
        "Interview",
        "Selected",
        "Rejected",
      ],
      default: "Applied",
    },

    selectedAs: {
      type: String,
      enum: ["intern", "employee", null],
      default: null,
    },

    archived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Candidate", candidateSchema);