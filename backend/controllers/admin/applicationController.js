const { Application, Interview, User } = require("../../models");
const { recordAuditLog } = require("../../utils/auditLogger");
const { notify, notifyMany } = require("../../utils/notificationHelper");

const VALID_STATUSES = [
  "applied", "interview", "selected", "offer_sent",
  "offer_received", "accepted", "converted", "rejected",
];

const overrideStatus = async (req, res) => {
  try {
    const { newStatus, reason } = req.body;
    if (!VALID_STATUSES.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `newStatus must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }
    if (typeof reason !== "string" || reason.trim().length < 10) {
      return res.status(400).json({ success: false, message: "reason (min 10 chars) is required for audit" });
    }

    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ success: false, message: "Application not found" });
    const oldStatus = application.status;
    if (oldStatus === newStatus) {
      return res.status(400).json({ success: false, message: "Application already in this status" });
    }

    application.status = newStatus;
    if (newStatus !== "converted") application.convertedTo = null;
    await application.save();

    const [candidate, interviews, hrs] = await Promise.all([
      User.findById(application.candidateId).select("_id name hiringManagerId"),
      Interview.find({ applicationId: application._id }).select("interviewerId"),
      User.find({ role: "hr", isActive: true, status: "active" }).select("_id"),
    ]);
    const stakeholderIds = [
      ...interviews.map((interview) => interview.interviewerId),
      ...hrs.map((hr) => hr._id),
      candidate?.hiringManagerId,
    ].filter(Boolean);
    const uniqueStakeholderIds = [...new Set(stakeholderIds.map((id) => id.toString()))]
      .filter((id) => id !== application.candidateId.toString());

    const message = `Admin overrode application ${application._id} status: ${oldStatus} → ${newStatus}. Reason: ${reason.trim()}`;
    await Promise.all([
      notify({
        userId: application.candidateId,
        message: `Your application status has been updated to "${newStatus}" by admin. Reason: ${reason.trim()}`,
        type: "warning",
        link: "/candidate",
      }),
      notifyMany({
        userIds: uniqueStakeholderIds,
        message,
        type: "warning",
        link: "/hr/candidates",
      }),
      recordAuditLog({
        userId: req.user?.id || req.user?._id,
        action: "update",
        module: "application",
        entityId: application._id,
        oldValue: { status: oldStatus },
        newValue: { status: newStatus, reason: reason.trim() },
      }),
    ]);

    return res.json({ success: true, data: application });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to override application status", error: error.message });
  }
};

module.exports = { overrideStatus };
