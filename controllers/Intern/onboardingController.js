const OnboardingTask = require("../../models/Intern/OnboardingTask");
const Intern = require("../../models/Intern/Intern");

// GET: Logged-in intern ki onboarding checklist
const getMyOnboarding = async (req, res) => {
  try {
    const intern = await Intern.findOne({
      user: req.user.id,
    });

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: "Intern profile not found",
      });
    }

    const tasks = await OnboardingTask.find({
      intern: intern._id,
    })
      .populate("assignedTo", "firstName lastName email")
      .sort({ order: 1, createdAt: 1 });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (task) => task.status === "completed"
    ).length;

    const progress =
      totalTasks === 0
        ? 0
        : Math.round((completedTasks / totalTasks) * 100);

    return res.status(200).json({
      success: true,
      message: "Onboarding checklist fetched successfully",
      progress,
      totalTasks,
      completedTasks,
      tasks,
    });
  } catch (error) {
    console.error("Get Onboarding Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch onboarding checklist",
    });
  }
};

// PATCH: Logged-in intern ka assigned onboarding task complete karna
const completeOnboardingTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const intern = await Intern.findOne({
      user: req.user.id,
    });

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: "Intern profile not found",
      });
    }

    const task = await OnboardingTask.findOne({
      _id: taskId,
      intern: intern._id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Onboarding task not found",
      });
    }

    if (task.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Task is already completed",
      });
    }

    task.status = "completed";
    task.completedAt = new Date();

    await task.save();

    return res.status(200).json({
      success: true,
      message: "Onboarding task completed successfully",
      task,
    });
  } catch (error) {
    console.error("Complete Onboarding Task Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to complete onboarding task",
    });
  }
};

module.exports = {
  getMyOnboarding,
  completeOnboardingTask,
};