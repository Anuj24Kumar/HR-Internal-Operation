const mongoose = require("mongoose");
const { User, Application, Offer, AuditLog, Interview } = require("../../models");

const APPLICATION_STATUSES = [
  "applied", "interview", "selected", "offer_sent",
  "offer_received", "accepted", "converted", "rejected",
];
const pageParams = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
};
const makeRegex = (value) => new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

/**
 * 1. Return headcount, open candidates, offers in flight, active users, system health stats
 * GET /api/admin/dashboard
 */
const getAdminDashboard = async (req, res) => {
  try {
    const [
      activeUsers,
      totalEmployees,
      totalInterns,
      openCandidates,
      offersInFlight,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: "employee", status: "active" }),
      User.countDocuments({ role: "intern", status: "active" }),
      Application.countDocuments({ status: { $in: ["applied", "interview", "selected"] } }),
      Offer.countDocuments({
        status: { $in: ["draft", "pending_approval", "sent"] },
      }),
    ]);

    const uptimeSeconds = Math.floor(process.uptime());
    const memoryUsage = process.memoryUsage();

    res.status(200).json({
      success: true,
      stats: {
        activeUsers,
        totalHeadcount: totalEmployees + totalInterns,
        totalEmployees,
        totalInterns,
        openCandidates,
        offersInFlight,
        systemHealth: {
          databaseStatus:
            mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
          uptime: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`,
          memoryUsedMB: Math.round(memoryUsage.rss / (1024 * 1024)),
          serverTimestamp: new Date(),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate admin dashboard metrics",
      error: error.message,
    });
  }
};

/**
 * 2. Return hiring pipeline stage distribution
 * GET /api/admin/dashboard/pipeline
 */
const getPipelineDistribution = async (req, res) => {
  try {
    const pipelineCounts = await Application.aggregate([
      {
        $group: {
          _id: { $toLower: "$status" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Keep every application stage present, including stages with no records.
    const distribution = {
      applied: 0,
      interview: 0,
      selected: 0,
      offer_sent: 0,
      offer_received: 0,
      accepted: 0,
      converted: 0,
      rejected: 0,
      total: 0,
    };

    pipelineCounts.forEach((stage) => {
      const key = stage._id;
      if (distribution[key] !== undefined) {
        distribution[key] = stage.count;
      }
      distribution.total += stage.count;
    });

    res.status(200).json({
      success: true,
      pipeline: distribution,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve pipeline stage distribution",
      error: error.message,
    });
  }
};

const getOverview = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [
      usersByRole,
      appsByStatus,
      offersByStatus,
      interviewsByStatus,
      conversionsLast30d,
      interviewsThisWeek,
      timeToHire,
    ] = await Promise.all([
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Application.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Offer.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Interview.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      AuditLog.countDocuments({ action: "role_change", timestamp: { $gte: thirtyDaysAgo } }),
      Interview.countDocuments({
        scheduledAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), $lte: new Date() },
      }),
      Application.aggregate([
        { $match: { status: "converted" } },
        { $unwind: "$timeline" },
        { $match: { "timeline.stage": "converted", "timeline.completed": true, "timeline.date": { $ne: null } } },
        {
          $group: {
            _id: null,
            averageDays: {
              $avg: { $divide: [{ $subtract: ["$timeline.date", "$createdAt"] }, 86400000] },
            },
          },
        },
      ]),
    ]);

    return res.json({
      success: true,
      data: {
        usersByRole,
        appsByStatus,
        offersByStatus,
        interviewsByStatus,
        conversionsLast30d,
        interviewsThisWeek,
        averageTimeToHireDays: timeToHire[0]?.averageDays == null
          ? null
          : Math.round(timeToHire[0].averageDays * 100) / 100,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to generate admin overview", error: error.message });
  }
};

const getPipeline = async (req, res) => {
  try {
    const { status, search } = req.query;
    const { page, limit, skip } = pageParams(req.query);
    const filter = {};
    if (status) {
      if (!APPLICATION_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid application status filter" });
      }
      filter.status = status;
    }
    if (search?.trim()) {
      const regex = makeRegex(search.trim());
      filter.$or = [{ candidateName: regex }, { email: regex }, { position: regex }];
    }
    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate("candidateId", "name email phone role")
        .populate("currentInterviewId")
        .populate("currentOfferId", "status designation salary joiningDate")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Application.countDocuments(filter),
    ]);
    return res.json({
      success: true,
      data: { applications, total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to retrieve application pipeline", error: error.message });
  }
};

const getConversions = async (req, res) => {
  try {
    const { page, limit, skip } = pageParams(req.query);
    const filter = { action: "role_change" };
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("userId", "name email role")
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);
    const targetIds = logs.map((log) => log.entityId).filter(Boolean);
    const targetUsers = await User.find({ _id: { $in: targetIds } }).select("name email role empId").lean();
    const usersById = new Map(targetUsers.map((user) => [user._id.toString(), user]));
    const conversions = logs.map((log) => ({
      ...log,
      targetUser: log.entityId ? usersById.get(log.entityId.toString()) || null : null,
    }));
    return res.json({
      success: true,
      data: { conversions, total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to retrieve conversions", error: error.message });
  }
};

module.exports = {
  getAdminDashboard,
  getPipelineDistribution,
  getOverview,
  getPipeline,
  getConversions,
};
