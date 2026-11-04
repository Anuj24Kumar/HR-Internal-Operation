const mongoose = require("mongoose");
const { User, Application, Interview, HiringRecommendation, InterviewFeedback } = require("../../models");
const { notify, notifyMany } = require("../../utils/notificationHelper");
const { recordAuditLog } = require("../../utils/auditLogger");

const userIdOf = (req) => req.user?.id || req.user?._id;

async function assignedToManagerQuery(hmId) {
  // Candidates whose interview is completed AND user is candidate
  const completedCandidateIds = await Interview.find({ status: "completed" }).distinct("candidateId");
  return {
    _id: { $in: completedCandidateIds },
    role: "candidate",
    isActive: true,
  };
}

exports.getDashboard = async (req, res) => {
  try {
    const applications = await Application.find({ status: { $in: ["interview", "selected"] } }).lean();
    const openRoles = new Set(applications.map((a) => a.position).filter(Boolean)).size;
    const pipelineCandidates = applications.length;

    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const interviewsThisWeek = await Interview.countDocuments({
      scheduledAt: { $gte: now, $lte: nextWeek },
    });

    return res.json({
      success: true,
      data: { openRoles, pipelineCandidates, interviewsThisWeek },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const rolesAgg = await Application.aggregate([
      { $match: { status: { $in: ["interview", "selected"] } } },
      {
        $group: {
          _id: "$position",
          candidateCount: { $sum: 1 },
          openCandidateCount: {
            $sum: { $cond: [{ $eq: ["$status", "interview"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          role: "$_id",
          candidateCount: 1,
          openCandidateCount: 1,
        },
      },
    ]);
    return res.json({ success: true, data: rolesAgg });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.listCandidates = async (req, res) => {
  try {
    const query = await assignedToManagerQuery(userIdOf(req));
    const candidates = await User.find(query)
      .select("name email position phone hiringRecommendation")
      .lean();

    // For each candidate, attach latest Application + completed Interview summary
    const enriched = await Promise.all(
      candidates.map(async (c) => {
        const app = await Application.findOne({ candidateId: c._id })
          .sort({ createdAt: -1 })
          .lean();
        const interviews = await Interview.find({ candidateId: c._id, status: "completed" })
          .populate("interviewerId", "name email")
          .lean();
        return { ...c, application: app, interviews };
      })
    );

    // Filter: show candidates awaiting decision ('interview') or already decided ('selected', 'rejected')
    const filtered = enriched.filter(
      (c) => c.application && ["interview", "selected", "rejected"].includes(c.application.status)
    );

    return res.json({ success: true, data: filtered });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.getCandidate = async (req, res) => {
  try {
    const candidate = await User.findById(req.params.id).select("-password").lean();
    if (!candidate || candidate.role !== "candidate") {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }
    const application = await Application.findOne({ candidateId: candidate._id })
      .sort({ createdAt: -1 })
      .lean();
    const interviews = await Interview.find({ candidateId: candidate._id })
      .populate("interviewerId", "name email")
      .sort({ scheduledAt: -1 })
      .lean();
    const recommendations = await HiringRecommendation.find({ candidateId: candidate._id })
      .populate("hiringManagerId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: {
        ...candidate,
        application,
        interviews,
        recommendations,
      },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.recommendCandidate = async (req, res) => {
  try {
    const { decision, comments } = req.body;
    if (!["select", "reject"].includes(decision)) {
      return res.status(400).json({ success: false, message: "decision must be select or reject" });
    }
    if (!comments || comments.trim().length === 0) {
      return res.status(400).json({ success: false, message: "comments are required" });
    }

    const candidate = await User.findById(req.params.id);
    if (!candidate || candidate.role !== "candidate") {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    const application = await Application.findOne({ candidateId: candidate._id, status: "interview" }).sort({
      createdAt: -1,
    });
    if (!application) {
      return res.status(400).json({ success: false, message: "Candidate has no application awaiting decision" });
    }

    const completedInterview = await Interview.findOne({
      candidateId: candidate._id,
      applicationId: application._id,
      status: "completed",
    });
    if (!completedInterview) {
      return res.status(400).json({ success: false, message: "No completed interview to evaluate" });
    }

    const uid = userIdOf(req);
    const rec = await HiringRecommendation.create({
      candidateId: candidate._id,
      applicationId: application._id,
      hiringManagerId: uid,
      decision,
      comments: comments.trim(),
      interviewId: completedInterview._id,
    });

    candidate.hiringRecommendation = {
      status: decision,
      comments: comments.trim(),
      recommendedAt: new Date(),
      recommendedBy: uid,
    };
    await candidate.save();

    if (decision === "select") {
      application.status = "selected";
      const tl = application.timeline.find((t) => t.stage === "selected");
      if (tl) {
        tl.completed = true;
        tl.date = new Date();
      }
    } else {
      application.status = "rejected";
      const tl = application.timeline.find((t) => t.stage === "rejected");
      if (tl) {
        tl.completed = true;
        tl.date = new Date();
      }
    }
    await application.save();

    // Lock the interview feedback
    await InterviewFeedback.updateMany(
      { roundId: completedInterview._id },
      { $set: { lockedAt: new Date() } }
    );

    // Notify HR (and candidate)
    const hrs = await User.find({ role: "hr", isActive: true }).select("_id");
    await notifyMany({
      userIds: hrs.map((h) => h._id),
      message: `HM ${decision === "select" ? "selected" : "rejected"} ${candidate.name}. ${
        decision === "select" ? "Ready for offer generation." : ""
      }`,
      type: decision === "select" ? "success" : "warning",
      link: decision === "select" ? "/hr/offers" : "/hr/candidates",
    });
    await notify({
      userId: candidate._id,
      message: `Your application status updated: ${decision === "select" ? "Selected" : "Rejected"}`,
      type: decision === "select" ? "success" : "warning",
      link: "/candidate",
    });

    await recordAuditLog({
      userId: uid,
      action: decision === "select" ? "approve" : "update",
      module: "hiring_recommendation",
      entityId: rec._id,
      newValue: { decision, comments },
    });

    return res.json({ success: true, data: rec });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};
