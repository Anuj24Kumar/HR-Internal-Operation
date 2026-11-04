const mongoose = require("mongoose");
const { Interview, InterviewFeedback, User, HiringRecommendation } = require("../../models");
const { notifyMany } = require("../../utils/notificationHelper");
const { recordAuditLog } = require("../../utils/auditLogger");

const userIdOf = (req) => req.user?.id || req.user?._id;

async function findAssignedInterview(req, includeApplication = false) {
  if (!mongoose.Types.ObjectId.isValid(req.params.roundId) ||
      (req.params.id && !mongoose.Types.ObjectId.isValid(req.params.id))) return null;
  const filter = { _id: req.params.roundId, interviewerId: userIdOf(req) };
  if (req.params.id) filter.candidateId = req.params.id;
  const query = Interview.findOne(filter)
    .populate("candidateId", "name email phone position resumeUrl");
  if (includeApplication) query.populate("applicationId", "position jobType status");
  return query;
}

exports.listMyInterviews = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const filter = { interviewerId: userIdOf(req) };
    if (req.query.status) filter.status = req.query.status;
    const [interviews, total] = await Promise.all([
      Interview.find(filter)
        .populate("candidateId", "name email position")
        .populate("applicationId", "position jobType status")
        .sort({ scheduledAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Interview.countDocuments(filter),
    ]);
    return res.json({
      success: true,
      data: { interviews, total, page, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return next(err);
  }
};

exports.getMyInterview = async (req, res, next) => {
  try {
    const interview = await findAssignedInterview(req, true);
    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found or not assigned to you" });
    }
    return res.json({ success: true, data: interview });
  } catch (err) {
    return next(err);
  }
};

exports.submitFeedback = async (req, res) => {
  try {
    if (String(req.body.status || "").toLowerCase() === "completed") {
      return exports.completeInterview(req, res);
    }

    const { score, rating, feedback } = req.body;
    // Allow saving DRAFT feedback (partial) without completing — but validate rating if provided
    if (rating !== undefined && rating !== null && rating !== "" && (Number(rating) < 1 || Number(rating) > 5)) {
      return res.status(400).json({ success: false, message: "rating must be 1-5" });
    }
    if (score !== undefined && score !== null && score !== "" && (Number(score) < 0 || Number(score) > 100)) {
      return res.status(400).json({ success: false, message: "score must be 0-100" });
    }
    if (feedback !== undefined && feedback !== null && String(feedback).length > 5000) {
      return res.status(400).json({ success: false, message: "feedback too long" });
    }

    const uid = userIdOf(req);
    const filter = { _id: req.params.roundId, interviewerId: uid };
    if (req.params.id && mongoose.Types.ObjectId.isValid(req.params.id)) {
      filter.candidateId = req.params.id;
    }
    const interview = await Interview.findOne(filter);
    if (!interview) return res.status(404).json({ success: false, message: "Interview not found" });
    if (interview.status === "completed") {
      return res.status(400).json({ success: false, message: "Interview already completed. Use update endpoint." });
    }

    if (score !== undefined && score !== null && score !== "") interview.score = Number(score);
    if (rating !== undefined && rating !== null && rating !== "") interview.rating = Number(rating);
    if (feedback !== undefined && feedback !== null) interview.feedback = String(feedback);
    interview.feedbackSubmittedAt = new Date();
    await interview.save();

    // Audit copy
    await InterviewFeedback.findOneAndUpdate(
      { candidateId: interview.candidateId, roundId: interview._id, interviewerId: uid },
      {
        candidateId: interview.candidateId,
        applicationId: interview.applicationId,
        interviewId: interview._id,
        roundId: interview._id,
        interviewerId: uid,
        score: interview.score,
        rating: interview.rating,
        feedback: interview.feedback,
        submittedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    await recordAuditLog({
      userId: uid,
      action: "update",
      module: "interview_feedback",
      entityId: interview._id,
      newValue: { score: interview.score, rating: interview.rating },
    });
    return res.json({ success: true, data: interview });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.completeInterview = async (req, res) => {
  try {
    const { score, rating, feedback } = req.body;
    if (score === undefined || score === null || score === "" ||
        rating === undefined || rating === null || rating === "" ||
        !feedback || !String(feedback).trim()) {
      return res.status(400).json({ success: false, message: "score, rating, feedback are all required to complete" });
    }
    const numRating = Number(rating);
    const numScore = Number(score);
    if (numRating < 1 || numRating > 5) return res.status(400).json({ success: false, message: "rating must be 1-5" });
    if (numScore < 0 || numScore > 100) return res.status(400).json({ success: false, message: "score must be 0-100" });
    if (String(feedback).trim().length > 5000) return res.status(400).json({ success: false, message: "feedback too long" });

    const uid = userIdOf(req);
    const filter = { _id: req.params.roundId, interviewerId: uid };
    if (req.params.id && mongoose.Types.ObjectId.isValid(req.params.id)) {
      filter.candidateId = req.params.id;
    }
    const interview = await Interview.findOne(filter);
    if (!interview) return res.status(404).json({ success: false, message: "Interview not found" });
    if (interview.status === "completed") return res.status(400).json({ success: false, message: "Already completed" });

    interview.score = numScore;
    interview.rating = numRating;
    interview.feedback = String(feedback).trim();
    interview.feedbackSubmittedAt = new Date();
    interview.status = "completed";
    await interview.save();

    await InterviewFeedback.findOneAndUpdate(
      { candidateId: interview.candidateId, roundId: interview._id, interviewerId: uid },
      {
        candidateId: interview.candidateId,
        applicationId: interview.applicationId,
        interviewId: interview._id,
        roundId: interview._id,
        interviewerId: uid,
        score: numScore,
        rating: numRating,
        feedback: String(feedback).trim(),
        submittedAt: new Date(),
        lockedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Notify all hiring managers + HR
    const hms = await User.find({ role: "hiring_manager", isActive: true }).select("_id");
    const hrs = await User.find({ role: "hr", isActive: true }).select("_id");
    const candidate = await User.findById(interview.candidateId).select("name");
    const candidateName = candidate?.name || "Candidate";
    await notifyMany({
      userIds: hms.map((h) => h._id),
      message: `Interview completed: ${candidateName} — score ${numScore}/100, rating ${numRating}/5. Awaiting your decision.`,
      type: "info",
      link: "/hiring-manager",
    });
    await notifyMany({
      userIds: hrs.map((h) => h._id),
      message: `Interview completed for ${candidateName} — awaiting HM decision.`,
      type: "info",
      link: "/hr/interviews",
    });

    await recordAuditLog({
      userId: uid,
      action: "update",
      module: "interview",
      entityId: interview._id,
      newValue: { status: "completed", score: numScore, rating: numRating },
    });
    return res.json({ success: true, data: interview });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.updateFeedback = async (req, res) => {
  try {
    const { score, rating, feedback } = req.body;
    if (rating !== undefined && rating !== null && rating !== "" && (Number(rating) < 1 || Number(rating) > 5)) {
      return res.status(400).json({ success: false, message: "rating must be 1-5" });
    }
    if (score !== undefined && score !== null && score !== "" && (Number(score) < 0 || Number(score) > 100)) {
      return res.status(400).json({ success: false, message: "score must be 0-100" });
    }
    if (feedback !== undefined && feedback !== null && String(feedback).length > 5000) {
      return res.status(400).json({ success: false, message: "feedback too long" });
    }

    const uid = userIdOf(req);
    const filter = { _id: req.params.roundId, interviewerId: uid };
    if (req.params.id && mongoose.Types.ObjectId.isValid(req.params.id)) {
      filter.candidateId = req.params.id;
    }
    const interview = await Interview.findOne(filter);
    if (!interview) return res.status(404).json({ success: false, message: "Interview not found" });
    if (interview.status !== "completed") {
      return res.status(400).json({ success: false, message: "Interview is not completed yet. Use submit feedback endpoint." });
    }

    // Check if HM decision already exists for this application
    const rec = await HiringRecommendation.findOne({ applicationId: interview.applicationId });
    if (rec) {
      return res.status(400).json({ success: false, message: "Feedback is locked because hiring manager has already made a decision." });
    }

    if (score !== undefined && score !== null && score !== "") interview.score = Number(score);
    if (rating !== undefined && rating !== null && rating !== "") interview.rating = Number(rating);
    if (feedback !== undefined && feedback !== null) interview.feedback = String(feedback);
    interview.feedbackSubmittedAt = new Date();
    await interview.save();

    await InterviewFeedback.findOneAndUpdate(
      { candidateId: interview.candidateId, roundId: interview._id, interviewerId: uid },
      {
        candidateId: interview.candidateId,
        applicationId: interview.applicationId,
        interviewId: interview._id,
        roundId: interview._id,
        interviewerId: uid,
        score: interview.score,
        rating: interview.rating,
        feedback: interview.feedback,
        submittedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    await recordAuditLog({
      userId: uid,
      action: "update",
      module: "interview_feedback",
      entityId: interview._id,
      newValue: { score: interview.score, rating: interview.rating },
    });
    return res.json({ success: true, data: interview });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.getFeedback = async (req, res) => {
  try {
    const role = String(req.user?.role || "").toLowerCase();
    const filter = { _id: req.params.roundId };
    if (req.params.id && mongoose.Types.ObjectId.isValid(req.params.id)) {
      filter.candidateId = req.params.id;
    }
    if (role === "interviewer") {
      filter.interviewerId = userIdOf(req);
    }

    const interview = await Interview.findOne(filter)
      .populate("candidateId", "name email phone position resumeUrl")
      .populate("interviewerId", "name email");

    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found or not visible to you" });
    }

    return res.json({
      success: true,
      data: {
        candidateId: interview.candidateId?._id || interview.candidateId,
        candidateName: interview.candidateId?.name,
        roundId: interview._id,
        interviewer: interview.interviewerId,
        score: interview.score ?? null,
        rating: interview.rating ?? null,
        feedback: interview.feedback ?? "",
        feedbackSubmittedAt: interview.feedbackSubmittedAt ?? null,
        status: interview.status,
      },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};
