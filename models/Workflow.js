const mongoose = require("mongoose");

const workflowStepSchema = new mongoose.Schema(
  {
    order: {
      type: Number,
      required: true,
    },
    role: {
      type: String,
      required: [true, "Approver role is required"],
      enum: {
        values: ["admin", "hr", "hiring_manager"],
        message: "{VALUE} is not a valid approver role",
      },
    },
    stepName: {
      type: String,
      default: "",
    },
    isRequired: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const workflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Workflow name is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Workflow type is required"],
      unique: true,
      enum: {
        values: ["offer", "letter", "exit"],
        message: "{VALUE} is not a valid workflow type",
      },
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    steps: {
      type: [workflowStepSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: "Workflow must have at least one step",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Workflow = mongoose.model("Workflow", workflowSchema);

module.exports = Workflow;
