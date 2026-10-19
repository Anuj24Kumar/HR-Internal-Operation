const mongoose = require("mongoose");
const { User, Employee, Candidate, Offer, ApprovalRequest } = require("../../models");

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
      pendingApprovals,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Employee.countDocuments({ type: "employee", status: "active" }),
      Employee.countDocuments({ type: "intern", status: "active" }),
      Candidate.countDocuments({
        status: { $in: ["applied", "screening", "interview"] },
        isArchived: false,
      }),
      Offer.countDocuments({
        status: { $in: ["draft", "pending_approval", "sent"] },
      }),
      ApprovalRequest.countDocuments({ status: "pending" }),
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
        pendingApprovals,
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
    const pipelineCounts = await Candidate.aggregate([
      { $match: { isArchived: false } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Ensure all 5 stages exist in the response
    const distribution = {
      applied: 0,
      screening: 0,
      interview: 0,
      selected: 0,
      rejected: 0,
      total: 0,
    };

    pipelineCounts.forEach((stage) => {
      if (distribution[stage._id] !== undefined) {
        distribution[stage._id] = stage.count;
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

module.exports = {
  getAdminDashboard,
  getPipelineDistribution,
};
