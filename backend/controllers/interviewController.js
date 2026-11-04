
const mongoose = require("mongoose");
const { Interview, User, Application } = require("../models");
const { notify } = require("../utils/notificationHelper");
const { recordAuditLog } = require("../utils/auditLogger");

const getInterviewers = async (req, res) => {
  try {
    const interviewers = await User.find({
      role: "interviewer",
      isActive: true,
    })
      .select("name email")
      .sort({ name: 1, email: 1 });

    return res.status(200).json({ success: true, data: interviewers });
  } catch (error) {
    console.error("Get interviewers error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch interviewers",
    });
  }
};

// GET all interviews for a candidate
const getCandidateInterviews = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid candidate ID",
      });
    }

    const candidate = await User.findOne({ _id: id, role: { $in: ["candidate", "intern", "employee"] } });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    const interviews = await Interview.find({
      candidateId: id,
    })
      .populate("interviewerId", "name firstName lastName email")
      .sort({ scheduledAt: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: interviews.length,
      data: interviews,
    });
  } catch (error) {
    console.error("Get candidate interviews error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch candidate interviews",
    });
  }
};


const createInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const { roundName, interviewType, interviewerId, scheduledAt, meetingLink } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid candidate ID" });
    }
    if (
      typeof roundName !== "string" ||
      !roundName.trim() ||
      !interviewerId ||
      !scheduledAt
    ) {
      return res.status(400).json({
        success: false,
        message: "roundName, interviewerId, scheduledAt are required",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(interviewerId)) {
      return res.status(400).json({ success: false, message: "Select a valid interviewer" });
    }
    const scheduledDate = new Date(scheduledAt);
    if (Number.isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ success: false, message: "A valid interview date and time are required" });
    }
    const candidate = await User.findOne({ _id: id, role: "candidate" });
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }
    const application = await Application.findOne({
      candidateId: candidate._id,
      status: { $in: ["applied", "interview"] },
    }).sort({ createdAt: -1 });
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "No active application for this candidate",
      });
    }
    const interviewer = await User.findOne({
      _id: interviewerId,
      role: "interviewer",
      isActive: true,
    }).select("_id name email");
    if (!interviewer) {
      return res.status(404).json({ success: false, message: "Interviewer not found" });
    }

    const interview = await Interview.create({
      candidateId: candidate._id,
      applicationId: application._id,
      roundName: roundName.trim(),
      interviewType: interviewType || "technical",
      interviewerId: interviewer._id,
      scheduledAt: scheduledDate,
      meetingLink: meetingLink || "",
      status: "scheduled",
      assignedBy: req.user.id,
    });

    try {
      application.currentInterviewId = interview._id;
      if (application.status === "applied") {
        application.status = "interview";
        const interviewStage = application.timeline.find((stage) => stage.stage === "interview");
        if (interviewStage) {
          interviewStage.completed = true;
          interviewStage.date = new Date();
          interviewStage.title = "Interview Scheduled";
          interviewStage.description = `${interview.roundName} scheduled for ${scheduledDate.toLocaleString()}.`;
        }
      }
      await application.save();
    } catch (error) {
      try {
        await Interview.findByIdAndDelete(interview._id);
      } catch (rollbackError) {
        console.error("Interview assignment rollback error:", rollbackError.message);
      }
      throw error;
    }

    const scheduledLabel = scheduledDate.toLocaleString();
    await Promise.all([
      notify({
        userId: interviewer._id,
        message: `New interview assigned: ${candidate.name} — ${interview.roundName} on ${scheduledLabel}`,
        type: "info",
        link: "/interviewer",
      }),
      notify({
        userId: candidate._id,
        message: `Your interview has been scheduled: ${interview.roundName} on ${scheduledLabel}`,
        type: "info",
        link: "/candidate",
      }),
    ]);
    await recordAuditLog({
      userId: req.user.id,
      action: "create",
      module: "interview",
      entityId: interview._id,
      newValue: {
        candidateId: candidate._id,
        interviewerId: interviewer._id,
        scheduledAt: scheduledDate,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Interview assigned successfully",
      data: interview,
    });
  } catch (error) {
    console.error("Create interview error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create interview",
    });
  }
};


const getInterviewById = async (req, res) => {
  try {
    const { id, roundId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(roundId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid candidate ID or interview ID",
      });
    }

    const interview = await Interview.findOne({
      _id: roundId,
      candidateId: id,
    })
      .populate("candidateId", "name email phone position")
      .populate("interviewerId", "name email");

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found for this candidate",
      });
    }

    return res.status(200).json({
      success: true,
      data: interview,
    });
  } catch (error) {
    console.error("Get interview by ID error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch interview",
    });
  }
};


const updateInterview = async (req, res) => {
  try {
    const { id, roundId } = req.params;
    const allowedFields = [
      "roundName",
      "interviewType",
      "interviewerId",
      "scheduledAt",
      "meetingLink",
    ];

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(roundId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid candidate ID or interview ID",
      });
    }

    const interview = await Interview.findOne({ _id: roundId, candidateId: id });
    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found for this candidate" });
    }

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields provided for update" });
    }
    if (updates.roundName !== undefined) {
      if (typeof updates.roundName !== "string" || !updates.roundName.trim()) {
        return res.status(400).json({ success: false, message: "Round name is required" });
      }
      interview.roundName = updates.roundName.trim();
    }
    if (updates.interviewType !== undefined) interview.interviewType = updates.interviewType;
    if (updates.meetingLink !== undefined) interview.meetingLink = updates.meetingLink;

    let updatedInterviewer;
    if (updates.interviewerId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(updates.interviewerId)) {
        return res.status(400).json({ success: false, message: "Select a valid interviewer" });
      }
      updatedInterviewer = await User.findOne({
        _id: updates.interviewerId,
        role: "interviewer",
        isActive: true,
      }).select("_id name email");
      if (!updatedInterviewer) {
        return res.status(404).json({ success: false, message: "Interviewer not found" });
      }
      interview.interviewerId = updatedInterviewer._id;
    }

    let scheduleChanged = false;
    if (updates.scheduledAt !== undefined) {
      const scheduledDate = new Date(updates.scheduledAt);
      if (!updates.scheduledAt || Number.isNaN(scheduledDate.getTime())) {
        return res.status(400).json({ success: false, message: "A valid interview date and time are required" });
      }
      scheduleChanged = scheduledDate.getTime() !== new Date(interview.scheduledAt).getTime();
      interview.scheduledAt = scheduledDate;
      if (scheduleChanged) interview.status = "rescheduled";
    }
    await interview.save();

    if (scheduleChanged || updatedInterviewer) {
      const candidate = await User.findById(interview.candidateId).select("name");
      const notificationMessage = `Interview updated: ${interview.roundName} on ${interview.scheduledAt.toLocaleString()}`;
      await Promise.all([
        notify({
          userId: interview.interviewerId,
          message: `Interview assigned to you: ${candidate?.name || "Candidate"} — ${notificationMessage}`,
          type: "info",
          link: "/interviewer",
        }),
        notify({
          userId: interview.candidateId,
          message: `Your interview was updated: ${notificationMessage}`,
          type: "info",
          link: "/candidate",
        }),
      ]);
    }
    await recordAuditLog({
      userId: req.user.id,
      action: "update",
      module: "interview",
      entityId: interview._id,
      newValue: updates,
    });

    return res.status(200).json({
      success: true,
      message: "Interview updated successfully",
      data: interview,
    });
  } catch (error) {
    console.error("Update interview error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update interview",
    });
  }
};


const deleteInterview = async (req, res) => {
  try {
    const { id, roundId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(roundId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid candidate ID or interview ID",
      });
    }

    const interview = await Interview.findOne({
      _id: roundId,
      candidateId: id,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found for this candidate",
      });
    }
    if (interview.status !== "scheduled") {
      return res.status(409).json({
        success: false,
        message: "Only scheduled interviews can be deleted",
      });
    }

    await interview.deleteOne();

    const remainingInterview = await Interview.findOne({
      candidateId: id,
      applicationId: interview.applicationId,
      status: { $in: ["scheduled", "completed"] },
    }).sort({ scheduledAt: -1 });
    const application = await Application.findById(interview.applicationId);
    if (application) {
      if (String(application.currentInterviewId || "") === String(interview._id)) {
        application.currentInterviewId = remainingInterview?._id || null;
      }
      if (!remainingInterview && application.status === "interview") {
        application.status = "applied";
        const stage = application.timeline.find((entry) => entry.stage === "interview");
        if (stage) {
          stage.completed = false;
          stage.date = null;
          stage.description = "";
        }
      }
      await application.save();
    }
    await Promise.all([
      notify({
        userId: interview.interviewerId,
        message: `Interview assignment removed: ${interview.roundName}.`,
        type: "info",
        link: "/interviewer",
      }),
      notify({
        userId: interview.candidateId,
        message: `Your interview has been cancelled: ${interview.roundName}.`,
        type: "info",
        link: "/candidate",
      }),
    ]);
    await recordAuditLog({
      userId: req.user.id,
      action: "delete",
      module: "interview",
      entityId: interview._id,
      oldValue: {
        candidateId: interview.candidateId,
        interviewerId: interview.interviewerId,
        scheduledAt: interview.scheduledAt,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Interview deleted successfully",
    });
  } catch (error) {
    console.error("Delete interview error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete interview",
    });
  }
};




// GET all interviews
const getAllInterviews = async (req, res) => {
  try {
    const { status, interviewerId } = req.query;
    const filter = {};
    if (status) {
      const normalizedStatus = String(status).toLowerCase();
      if (!["scheduled", "completed", "cancelled", "rescheduled"].includes(normalizedStatus)) {
        return res.status(400).json({ success: false, message: "Invalid interview status" });
      }
      filter.status = normalizedStatus;
    }
    if (interviewerId) {
      if (!mongoose.Types.ObjectId.isValid(interviewerId)) {
        return res.status(400).json({ success: false, message: "Invalid interviewer ID" });
      }
      filter.interviewerId = interviewerId;
    }

    const interviews = await Interview.find(filter)
      .populate("candidateId interviewerId", "name email")
      .sort({ scheduledAt: -1 });

    return res.status(200).json({
      success: true,
      count: interviews.length,
      data: interviews,
    });
  } catch (error) {
    console.error("Get all interviews error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch interviews",
    });
  }
};

module.exports = {
  getInterviewers,
  getAllInterviews,
  getCandidateInterviews,
  createInterview,
  getInterviewById,
  updateInterview,
  deleteInterview,
};
