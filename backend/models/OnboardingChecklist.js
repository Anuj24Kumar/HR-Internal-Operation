const mongoose = require("mongoose");

const onboardingTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    ownerRole: {
      type: String,
      enum: ["employee", "it", "manager", "hr"],
      default: "employee",
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
    documentCategory: {
      type: String,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: true, timestamps: true }
);

const onboardingChecklistSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee reference is required"],
      index: true,
    },
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
      default: null,
    },
    tasks: [onboardingTaskSchema],
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to recalculate progress percentage
onboardingChecklistSchema.pre("save", function (next) {
  if (this.tasks && this.tasks.length > 0) {
    const completedTasks = this.tasks.filter(
      (task) => task.status === "completed"
    ).length;
    this.progress = Math.round((completedTasks / this.tasks.length) * 100);
  } else {
    this.progress = 0;
  }
  next();
});

const OnboardingChecklist = mongoose.model(
  "OnboardingChecklist",
  onboardingChecklistSchema
);

module.exports = OnboardingChecklist;
