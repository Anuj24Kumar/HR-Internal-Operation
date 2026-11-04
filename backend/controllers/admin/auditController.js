const { AuditLog, User } = require("../../models");

const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const buildAuditFilter = async (queryParams) => {
  const { module: mod, action, userId, startDate, endDate, from, to, search } = queryParams;
  const query = {};
  if (mod) query.module = mod;
  if (action) query.action = action;
  if (userId) query.userId = userId;

  const lowerDate = from || startDate;
  const upperDate = to || endDate;
  if (lowerDate || upperDate) {
    query.timestamp = {};
    if (lowerDate) {
      const date = new Date(lowerDate);
      if (Number.isNaN(date.getTime())) throw new Error("Invalid from/startDate value");
      query.timestamp.$gte = date;
    }
    if (upperDate) {
      const date = new Date(upperDate);
      if (Number.isNaN(date.getTime())) throw new Error("Invalid to/endDate value");
      if (/^\d{4}-\d{2}-\d{2}$/.test(upperDate)) date.setHours(23, 59, 59, 999);
      query.timestamp.$lte = date;
    }
  }

  if (search?.trim()) {
    const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const users = await User.find({ $or: [{ name: regex }, { email: regex }] }).select("_id").lean();
    const matchingIds = users.map((user) => user._id);
    query.userId = query.userId
      ? matchingIds.some((id) => id.toString() === query.userId.toString()) ? query.userId : { $in: [] }
      : { $in: matchingIds };
  }
  return query;
};

const pagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 25));
  return { page, limit, skip: (page - 1) * limit };
};

/**
 * 1. List audit log entries with filters (module, action, actor, date range)
 * GET /api/admin/audit
 */
const getAuditLogs = async (req, res) => {
  try {
    const query = await buildAuditFilter(req.query);
    const { page, limit, skip } = pagination(req.query);
    const totalLogs = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate("userId", "name email role")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      total: totalLogs,
      page,
      totalPages: Math.ceil(totalLogs / limit),
      pages: Math.ceil(totalLogs / limit),
      count: logs.length,
      logs,
    });
  } catch (error) {
    if (error.message.startsWith("Invalid ")) {
      return res.status(400).json({ success: false, message: error.message });
    }
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
    const { format = "csv" } = req.query;
    const query = await buildAuditFilter(req.query);

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
      const actorName = log.userId ? escapeCsv(log.userId.name || "") : '"System"';
      const actorEmail = log.userId ? escapeCsv(log.userId.email || "") : '""';
      const timestamp = new Date(log.timestamp).toISOString();
      const entityId = log.entityId ? log.entityId.toString() : "";
      return [
        log._id, timestamp, actorName, actorEmail, log.action, log.module, entityId,
      ].map((value, index) => index === 2 || index === 3 ? value : escapeCsv(value)).join(",");
    });

    const csvOutput = csvHeaders.concat(csvRows.join("\n")).join("");

    res.setHeader("Content-Disposition", 'attachment; filename="audit-log.csv"');
    res.setHeader("Content-Type", "text/csv");
    return res.status(200).send(csvOutput);
  } catch (error) {
    if (error.message.startsWith("Invalid ")) {
      return res.status(400).json({ success: false, message: error.message });
    }
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
