
const mongoose = require("mongoose");
const Interview = require("../models/Interview");
const Candidate = require("../models/Candidate");

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
    }).sort({ scheduledAt: 1, createdAt: -1 });

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

    const candidate = await Candidate.findById(id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    const interview = await Interview.create({
      candidateId: candidate._id,
      roundName: roundName.trim(),
      interviewType,
      interviewerId: interviewerId || null,
      scheduledAt: scheduledAt || null,
      meetingLink: meetingLink || "",
    });

    return res.status(201).json({
      success: true,
      message: "Interview created successfully",
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
    });

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

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const interview = await Interview.findOneAndUpdate(
      { _id: roundId, candidateId: id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found for this candidate",
      });
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



module.exports = {
  getCandidateInterviews,
  createInterview,
  getInterviewById,
  updateInterview,
  deleteInterview,
};
