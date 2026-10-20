
const mongoose = require("mongoose");

const onboardingTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    owner: {
      type: String,
      default: "HR",
      trim: true,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending",
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const onboardingSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      unique: true,
    },

    tasks: {
      type: [onboardingTaskSchema],
      default: [],
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Automatically calculate progress from completed tasks.
onboardingSchema.pre("save", function () {
  if (!this.tasks || this.tasks.length === 0) {
    this.progress = 0;
    return;
  }

  const completedTasks = this.tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  this.progress = Math.round(
    (completedTasks / this.tasks.length) * 100
  );
});


module.exports = mongoose.model("Onboarding", onboardingSchema);
