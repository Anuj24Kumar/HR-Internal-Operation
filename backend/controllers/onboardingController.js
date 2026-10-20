
const mongoose = require("mongoose");
const Onboarding = require("../models/Onboarding");
const Employee = require("../models/Employee");

// GET /api/v1/onboarding
// List all onboarding checklists with progress.
const getAllOnboarding = async (req, res) => {
  try {
    const onboarding = await Onboarding.find()
      .populate(
        "employeeId",
        "empId type personalInfo department designation joiningDate"
      )
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: onboarding.length,
      data: onboarding,
    });
  } catch (error) {
    console.error("Get onboarding error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch onboarding checklists",
    });
  }
};

// GET /api/v1/onboarding/:employeeId
// Get one employee's onboarding checklist.
const getOnboardingByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const onboarding = await Onboarding.findOne({ employeeId })
      .populate(
        "employeeId",
        "empId type personalInfo department designation joiningDate"
      )
      .populate("createdBy", "name email");

    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: "Onboarding checklist not found for this employee",
      });
    }

    return res.status(200).json({
      success: true,
      data: onboarding,
    });
  } catch (error) {
    console.error("Get employee onboarding error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee onboarding",
    });
  }
};

// POST /api/v1/onboarding
// Create a checklist for a new joiner.
const createOnboarding = async (req, res) => {
  try {
    const { employeeId, tasks } = req.body;

    if (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "A valid employeeId is required",
      });
    }

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const existing = await Onboarding.findOne({ employeeId });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An onboarding checklist already exists for this employee",
      });
    }

    const defaultTasks = [
      {
        title: "Document verification",
        owner: "HR",
      },
      {
        title: "Offer and joining documents",
        owner: "HR",
      },
      {
        title: "System and email access setup",
        owner: "IT",
      },
      {
        title: "Team introduction",
        owner: "Manager",
      },
    ];

    const checklistTasks =
      tasks === undefined ? defaultTasks : tasks;

    if (!Array.isArray(checklistTasks)) {
      return res.status(400).json({
        success: false,
        message: "tasks must be an array",
      });
    }

    for (const task of checklistTasks) {
      if (!task || typeof task.title !== "string" || !task.title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Every task must have a non-empty title",
        });
      }
    }

    const onboarding = await Onboarding.create({
      employeeId,
      tasks: checklistTasks,
      createdBy: req.user.id,
    });

    const populatedOnboarding = await Onboarding.findById(onboarding._id)
      .populate(
        "employeeId",
        "empId type personalInfo department designation joiningDate"
      )
      .populate("createdBy", "name email");

    return res.status(201).json({
      success: true,
      message: "Onboarding checklist created successfully",
      data: populatedOnboarding,
    });
  } catch (error) {
    console.error("Create onboarding error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An onboarding checklist already exists for this employee",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create onboarding checklist",
    });
  }
};


const updateOnboardingTask = async (req, res) => {
  try {
    const { id, taskId } = req.params;
    const { status, description, owner, dueDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) ||
        !mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid onboarding ID or task ID",
      });
    }

    const allowedStatuses = ["Pending", "In Progress", "Completed"];

    if (status !== undefined && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Pending, In Progress, or Completed",
      });
    }

    const onboarding = await Onboarding.findById(id);

    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: "Onboarding checklist not found",
      });
    }

    const task = onboarding.tasks.id(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (status !== undefined) {
      task.status = status;
      task.completedAt =
        status === "Completed" ? new Date() : null;
    }

    if (description !== undefined) {
      task.description = description;
    }

    if (owner !== undefined) {
      task.owner = owner;
    }

    if (dueDate !== undefined) {
      task.dueDate = dueDate === "" ? null : dueDate;
    }

    await onboarding.save();

    return res.status(200).json({
      success: true,
      message: "Onboarding task updated successfully",
      data: {
        onboardingId: onboarding._id,
        task,
        progress: onboarding.progress,
      },
    });
  } catch (error) {
    console.error("Update onboarding task error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update onboarding task",
    });
  }
};


const addOnboardingTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, owner, dueDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid onboarding ID",
      });
    }

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required",
      });
    }

    const onboarding = await Onboarding.findById(id);

    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: "Onboarding checklist not found",
      });
    }

    onboarding.tasks.push({
      title: title.trim(),
      description: description || "",
      owner: owner || "HR",
      dueDate: dueDate || null,
      status: "Pending",
      completedAt: null,
    });

    await onboarding.save();

    return res.status(201).json({
      success: true,
      message: "Onboarding task added successfully",
      data: {
        onboardingId: onboarding._id,
        task: onboarding.tasks[onboarding.tasks.length - 1],
        progress: onboarding.progress,
      },
    });
  } catch (error) {
    console.error("Add onboarding task error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to add onboarding task",
    });
  }
};


const deleteOnboardingTask = async (req, res) => {
  try {
    const { id, taskId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(taskId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid onboarding ID or task ID",
      });
    }

    const onboarding = await Onboarding.findById(id);

    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: "Onboarding checklist not found",
      });
    }

    const task = onboarding.tasks.id(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    onboarding.tasks.pull({ _id: taskId });

    await onboarding.save();

    return res.status(200).json({
      success: true,
      message: "Onboarding task deleted successfully",
      data: {
        onboardingId: onboarding._id,
        remainingTasks: onboarding.tasks.length,
        progress: onboarding.progress,
      },
    });
  } catch (error) {
    console.error("Delete onboarding task error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete onboarding task",
    });
  }
};



module.exports = {
  getAllOnboarding,
  getOnboardingByEmployee,
  createOnboarding,
  updateOnboardingTask,
  addOnboardingTask,
  deleteOnboardingTask,
};
