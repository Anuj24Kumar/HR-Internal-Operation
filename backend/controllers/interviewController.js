
const mongoose = require("mongoose");
const Interview = require("../models/Interview");
const Candidate = require("../models/Candidate");
const User = require("../models/User");
const Application = require("../models/Application");

const getInterviewers = async (req, res) => {
  try {
    const interviewers = await User.find({
      role: "interviewer",
      isActive: { $ne: false },
    })
      .select("name firstName lastName email role")
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

async function updateCandidateApplicationStage(candidate, assignedAt, scheduledDate, meetingLink, roundName) {
  const candidateUserId = candidate.user || candidate.userId || candidate._id;
  let application = await Application.findOne({
    $or: [
      { candidateId: candidateUserId },
      { email: candidate.email ? candidate.email.toLowerCase() : null },
    ],
  }).sort({ appliedAt: -1 });

  if (!application) return;

  application.status = "Interview";
  const formattedDate = scheduledDate
    ? new Date(scheduledDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date(assignedAt).toLocaleDateString("en-IN");

  const desc = meetingLink
    ? `${roundName || "Interview"} scheduled on ${formattedDate}. Meeting Link: ${meetingLink}`
    : `${roundName || "Interview"} scheduled on ${formattedDate}.`;

  let hasInterviewStage = false;
  for (const event of application.timeline) {
    const stage = String(event.stage || "").trim().toLowerCase();
    if (stage === "applied") {
      event.completed = true;
    } else if (stage === "interview") {
      event.title = "Interview Scheduled";
      event.description = desc;
      event.completed = true;
      event.date = scheduledDate || assignedAt;
      hasInterviewStage = true;
    } else if (stage === "selected" || stage === "offer") {
      event.completed = false;
      event.date = null;
    }
  }

  if (!hasInterviewStage) {
    application.timeline.push({
      stage: "Interview",
      title: "Interview Scheduled",
      description: desc,
      completed: true,
      date: scheduledDate || assignedAt,
    });
  }
  await application.save();
}

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

    const candidate = await Candidate.findById(id);

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
    const {
      roundName,
      interviewType,
      interviewerId,
      scheduledAt,
      meetingLink,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid candidate ID",
      });
    }

    if (!roundName || !roundName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Round name is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(interviewerId)) {
      return res.status(400).json({
        success: false,
        message: "Select a valid interviewer",
      });
    }

    const scheduledDate = new Date(scheduledAt);
    if (!scheduledAt || Number.isNaN(scheduledDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "A valid interview date and time are required",
      });
    }

    const candidate = await Candidate.findById(id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    const interviewer = await User.findOne({
      _id: interviewerId,
      role: "interviewer",
      isActive: { $ne: false },
    }).select("_id name email");
    if (!interviewer) {
      return res.status(400).json({
        success: false,
        message: "The selected interviewer is unavailable",
      });
    }

    const interview = await Interview.create({
      candidateId: candidate._id,
      roundName: roundName.trim(),
      interviewType,
      interviewerId: interviewer._id,
      scheduledAt: scheduledDate,
      meetingLink: meetingLink || "",
    });

    const assignedAt = new Date();
    const previousCandidateStatus = candidate.status;
    candidate.status = "interview";
    candidate.interviews.push({
      round: candidate.interviews.length + 1,
      roundName: interview.roundName,
      interviewType: interview.interviewType,
      interviewRecordId: interview._id,
      scheduledAt: scheduledDate,
      meetingLink: interview.meetingLink,
      interviewerId: interviewer._id,
      status: "scheduled",
    });

    try {
      await candidate.save();
      await updateCandidateApplicationStage(candidate, assignedAt, scheduledDate, interview.meetingLink, interview.roundName);
    } catch (error) {
      candidate.status = previousCandidateStatus;
      candidate.interviews.pull({ interviewRecordId: interview._id });
      try {
        await candidate.save();
      } catch (rollbackError) {
        console.error("Candidate interview assignment rollback error:", rollbackError.message);
      }
      try {
        await Interview.findByIdAndDelete(interview._id);
      } catch (rollbackError) {
        console.error("Interview assignment rollback error:", rollbackError.message);
      }
      throw error;
    }

    return res.status(201).json({
      success: true,
      message: "Interview assigned successfully",
      data: interview,
    });
  } catch (error) {
    console.error("Create interview error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create interview",
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
    }).populate("interviewerId", "name firstName lastName email");

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
      "status",
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

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.interviewerId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(updates.interviewerId)) {
        return res.status(400).json({
          success: false,
          message: "Select a valid interviewer",
        });
      }

      const interviewer = await User.findOne({
        _id: updates.interviewerId,
        role: "interviewer",
        isActive: true,
      }).select("_id");
      if (!interviewer) {
        return res.status(400).json({
          success: false,
          message: "The selected interviewer is unavailable",
        });
      }
    }

    if (updates.scheduledAt !== undefined) {
      const scheduledDate = new Date(updates.scheduledAt);
      if (!updates.scheduledAt || Number.isNaN(scheduledDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "A valid interview date and time are required",
        });
      }
      updates.scheduledAt = scheduledDate;
    }

    if (updates.status !== undefined) {
      updates.status = String(updates.status).toLowerCase();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const interview = await Interview.findOneAndUpdate(
      { _id: roundId, candidateId: id },
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found for this candidate",
      });
    }

    const candidate = await Candidate.findById(id);
    const assignedRound = candidate?.interviews.find(
      (round) => String(round.interviewRecordId) === String(interview._id)
    );
    if (assignedRound) {
      if (updates.roundName !== undefined) {
        assignedRound.roundName = updates.roundName;
      }
      if (updates.interviewType !== undefined) {
        assignedRound.interviewType = updates.interviewType;
      }
      if (updates.interviewerId !== undefined) {
        assignedRound.interviewerId = updates.interviewerId;
      }
      if (updates.scheduledAt !== undefined) {
        assignedRound.scheduledAt = updates.scheduledAt;
      }
      if (updates.meetingLink !== undefined) {
        assignedRound.meetingLink = updates.meetingLink;
      }
      if (updates.status !== undefined) {
        assignedRound.status = String(updates.status).toLowerCase();
      }
      await candidate.save();
    } else if (interview.interviewerId && interview.scheduledAt && candidate) {
      candidate.status = "interview";
      candidate.interviews.push({
        round: candidate.interviews.length + 1,
        roundName: interview.roundName,
        interviewType: interview.interviewType,
        interviewRecordId: interview._id,
        scheduledAt: interview.scheduledAt,
        meetingLink: interview.meetingLink,
        interviewerId: interview.interviewerId,
        status: interview.status,
      });
      await candidate.save();
    }

    return res.status(200).json({
      success: true,
      message: "Interview updated successfully",
      data: interview,
    });
  } catch (error) {
    console.error("Update interview error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update interview",
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

    const interview = await Interview.findOneAndDelete({
      _id: roundId,
      candidateId: id,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found for this candidate",
      });
    }

    const candidate = await Candidate.findById(id);
    if (candidate) {
      candidate.interviews.pull({ interviewRecordId: interview._id });

      const remainingInterview = await Interview.exists({ candidateId: id });
      if (!remainingInterview && String(candidate.status).toLowerCase() === "interview") {
        candidate.status = "applied";
      }

      await candidate.save();

      if (!remainingInterview) {
        let application = await Application.findOne({
          candidateId: candidate._id,
          position: candidate.position,
        }).sort({ appliedAt: -1 });

        if (!application) {
          application = await Application.findOne({ candidateId: candidate._id })
            .sort({ appliedAt: -1 });
        }

        if (application && String(application.status).toLowerCase() === "interview") {
          application.status = "Applied";
          for (const event of application.timeline) {
            if (String(event.stage || "").trim().toLowerCase() === "interview") {
              event.completed = false;
              event.date = null;
            }
          }
          await application.save();
        }
      }
    }

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
    const { status } = req.query;
    const filter = {};
    if (status) {
      filter.status = new RegExp(`^${status}$`, "i");
    }

    const interviews = await Interview.find(filter)
      .populate(
        "candidateId",
        "name firstName lastName email phone position jobType status department source applicationSource resumeUrl resumeOriginalName"
      )
      .populate("interviewerId", "name firstName lastName email")
      .sort({ scheduledAt: 1, createdAt: -1 });

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
