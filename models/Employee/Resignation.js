const mongoose = require("mongoose");

const resignationSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },

    requestedLastWorkingDay: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "withdrawn",
        "completed",
      ],
      default: "pending",
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    reviewRemarks: {
      type: String,
      trim: true,
      default: "",
    },

    clearance: {
      status: {
        type: String,
        enum: ["not_started", "in_progress", "completed"],
        default: "not_started",
      },

      tasks: [
        {
          title: {
            type: String,
            required: true,
            trim: true,
          },

          status: {
            type: String,
            enum: ["pending", "completed"],
            default: "pending",
          },

          completedAt: {
            type: Date,
            default: null,
          },
        },
      ],
    },
  },
  { timestamps: true }
);

// Prevent multiple simultaneously active resignation requests.
resignationSchema.index(
  { employee: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "approved"] },
    },
  }
);

module.exports = mongoose.model("Resignation", resignationSchema);