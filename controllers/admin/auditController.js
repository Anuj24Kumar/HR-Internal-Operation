const { AuditLog } = require("../../models");

/**
 * 1. List audit log entries with filters (module, action, actor, date range)
 * GET /api/admin/audit
 */
const getAuditLogs = async (req, res) => {
  try {
    const {
      module: mod,
      action,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 25,
    } = req.query;

    const query = {};

    if (mod) query.module = mod;
    if (action) query.action = action;
    if (userId) query.userId = userId;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const totalLogs = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate("userId", "name email role")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      total: totalLogs,
      page: parseInt(page, 10),
      totalPages: Math.ceil(totalLogs / parseInt(limit, 10)),
      count: logs.length,
      logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve audit logs",
      error: error.message,
    });
  }
};

/**
 * 2. Get full details of a single audit log entry including old/new values
 * GET /api/admin/audit/:id
 */
const getAuditLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id).populate(
      "userId",
      "name email role"
    );

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Audit log entry not found",
      });
    }

    res.status(200).json({
      success: true,
      log,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve audit log entry",
      error: error.message,
    });
  }
};

/**
 * 3. Export audit log as CSV or JSON (query param: ?format=csv|json)
 * GET /api/admin/audit/export
 */
const exportAuditLogs = async (req, res) => {
  try {
    const { module: mod, action, format = "csv", startDate, endDate } = req.query;

    const query = {};
    if (mod) query.module = mod;
    if (action) query.action = action;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate("userId", "name email role")
      .sort({ timestamp: -1 })
      .limit(5000); // Guard limit to prevent memory exhaustion

    if (format.toLowerCase() === "json") {
      res.setHeader("Content-Disposition", 'attachment; filename="audit-log.json"');
      res.setHeader("Content-Type", "application/json");
      return res.status(200).send(JSON.stringify(logs, null, 2));
    }

    // Default to CSV
    const csvHeaders = ["ID,Timestamp,Actor Name,Actor Email,Action,Module,Entity ID\n"];
    const csvRows = logs.map((log) => {
      const actorName = log.userId ? `"${log.userId.name.replace(/"/g, '""')}"` : '"System"';
      const actorEmail = log.userId ? `"${log.userId.email.replace(/"/g, '""')}"` : '""';
      const timestamp = new Date(log.timestamp).toISOString();
      const entityId = log.entityId ? log.entityId.toString() : "";
      return `"${log._id}","${timestamp}",${actorName},${actorEmail},"${log.action}","${log.module}","${entityId}"`;
    });

    const csvOutput = csvHeaders.concat(csvRows.join("\n")).join("");

    res.setHeader("Content-Disposition", 'attachment; filename="audit-log.csv"');
    res.setHeader("Content-Type", "text/csv");
    return res.status(200).send(csvOutput);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to export audit logs",
      error: error.message,
    });
  }
};

module.exports = {
  getAuditLogs,
  getAuditLogById,
  exportAuditLogs,
};
