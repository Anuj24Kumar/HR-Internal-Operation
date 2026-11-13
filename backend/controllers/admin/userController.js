const {
  Application,
  ApprovalRequest,
  Document,
  EmployeeHistory,
  HiringRecommendation,
  Interview,
  Letter,
  Notification,
  Offer,
  Onboarding,
  User,
} = require("../../models");
const { recordAuditLog } = require("../../utils/auditLogger");
const { notify, notifyMany } = require("../../utils/notificationHelper");

const ROLES = ["admin", "hr", "interviewer", "hiring_manager", "candidate", "intern", "employee"];
const USER_STATUSES = ["active", "inactive", "suspended"];
const USER_FIELDS = [
  "name", "phone", "department", "designation", "managerId", "mentor", "location",
  "salary", "stipend", "domain", "track", "startDate", "endDate", "employmentType",
];
const safeUserSelection = "-password -resetToken -resetExpires";
const actorId = (req) => req.user?.id || req.user?._id || null;
const pageParams = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
};
const makeRegex = (value) => new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

const getAllUsers = async (req, res) => {
  try {
    const { role, status, isActive, hasOffer, search } = req.query;
    const { page, limit, skip } = pageParams(req.query);
    const query = {};

    if (role) {
      if (!ROLES.includes(role)) return res.status(400).json({ success: false, message: "Invalid role filter" });
      query.role = role;
    }
    if (status) {
      if (!USER_STATUSES.includes(status)) return res.status(400).json({ success: false, message: "Invalid status filter" });
      query.status = status;
    }
    if (isActive !== undefined) {
      if (!["true", "false"].includes(String(isActive))) {
        return res.status(400).json({ success: false, message: "isActive must be true or false" });
      }
      query.isActive = isActive === "true";
    }
    if (search?.trim()) {
      const regex = makeRegex(search.trim());
      query.$or = [{ name: regex }, { email: regex }, { empId: regex }, { designation: regex }];
    }
    if (hasOffer !== undefined) {
      if (!["true", "false"].includes(String(hasOffer))) {
        return res.status(400).json({ success: false, message: "hasOffer must be true or false" });
      }
      const offerUserIds = await Offer.distinct("candidateId");
      query._id = hasOffer === "true" ? { $in: offerUserIds } : { $nin: offerUserIds };
    }

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select(safeUserSelection)
        .populate("hiringManagerId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      totalPages: Math.ceil(total / limit),
      count: users.length,
      users,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to retrieve users", error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, department, designation } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: "name, email, password, role are required" });
    }
    if (!ROLES.includes(role)) return res.status(400).json({ success: false, message: "Invalid role" });
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }
    if (role === "employee" && !designation?.trim()) {
      return res.status(400).json({ success: false, message: "Employees require a designation" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail }).select("_id");
    if (exists) return res.status(409).json({ success: false, message: "Email already registered" });

    const userData = {
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      phone,
      department,
      designation,
      ...Object.fromEntries(USER_FIELDS
        .filter((field) => req.body[field] !== undefined)
        .map((field) => [field, req.body[field]])),
      isActive: true,
      status: "active",
      createdBy: actorId(req),
    };
    if (role === "employee") {
      userData.empId = `EMP-${Date.now().toString().slice(-6)}`;
      userData.employeeCode = userData.empId;
      userData.joiningDate = new Date();
      userData.employmentType = req.body.employmentType || "full_time";
      userData.selectedAs = "employee";
    } else if (role === "intern") {
      userData.joiningDate = new Date();
      userData.employmentType = "intern";
      userData.selectedAs = "intern";
      userData.onboardingStatus = "in_progress";
    }

    const user = await User.create(userData);
    await notify({
      userId: user._id,
      message: `Your account has been created by admin. Role: ${role}. Log in with your email and the password provided.`,
      type: "info",
      link: `/${role === "candidate" ? "candidate" : role === "intern" ? "intern" : role === "employee" ? "employee" : role === "hr" ? "hr" : role === "interviewer" ? "interviewer" : role === "hiring_manager" ? "hiring-manager" : "login"}`,
    });
    await recordAuditLog({
      userId: actorId(req),
      action: "create",
      module: "users",
      entityId: user._id,
      newValue: { role, email: normalizedEmail },
    });
    return res.status(201).json({ success: true, data: user, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create user", error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select(safeUserSelection)
      .populate("hiringManagerId", "name email");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const hasAcceptedOffer = user.role === "candidate"
      ? Boolean(await Offer.exists({ candidateId: user._id, status: "accepted" }))
      : false;
    return res.status(200).json({ success: true, user: { ...user.toJSON(), hasAcceptedOffer }, data: { ...user.toJSON(), hasAcceptedOffer } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to retrieve user", error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role: requestedRole, override, ...updates } = req.body;
    const newRole = requestedRole === "hiring-manager" ? "hiring_manager" : requestedRole;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (newRole && !ROLES.includes(newRole)) return res.status(400).json({ success: false, message: "Invalid role" });

    const oldRole = user.role;
    const oldValues = {
      role: oldRole,
      empId: user.empId,
      designation: user.designation,
      department: user.department,
    };
    const normalizedEmail = updates.email?.trim().toLowerCase();
    if (normalizedEmail && normalizedEmail !== user.email) {
      const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } }).select("_id");
      if (existing) return res.status(409).json({ success: false, message: "Email address is already in use" });
      user.email = normalizedEmail;
    }
    for (const field of USER_FIELDS) {
      if (updates[field] !== undefined) user[field] = updates[field];
    }
    if (updates.name !== undefined) user.name = updates.name.trim();
    if (updates.position !== undefined) user.position = updates.position.trim();

    let acceptedOffer = null;
    if (newRole && newRole !== oldRole) {
      if (oldRole === "admin" && newRole !== "admin" && user.isActive && user.status === "active") {
        const activeAdmins = await User.countDocuments({ role: "admin", isActive: true, status: "active" });
        if (activeAdmins <= 1) return res.status(400).json({ success: false, message: "Cannot change the last active admin's role" });
      }

      if (oldRole === "candidate" && ["intern", "employee"].includes(newRole)) {
        acceptedOffer = await Offer.findOne({ candidateId: user._id, status: "accepted" }).sort({ acceptedAt: -1 });
        if (!acceptedOffer && override !== true) {
          return res.status(400).json({
            success: false,
            message: "Candidate has no accepted offer. Pass override:true to force conversion (will be audit-logged).",
          });
        }
        user.role = newRole;
        user.selectedAs = newRole;
        user.designation = user.designation || acceptedOffer?.designation || user.position;
        user.joiningDate = user.joiningDate || acceptedOffer?.joiningDate || new Date();
        if (newRole === "employee") {
          if (!user.empId) {
            user.empId = `EMP-${Date.now().toString().slice(-6)}`;
            user.employeeCode = user.empId;
          }
          user.employmentType = "full_time";
        } else {
          user.employmentType = "intern";
          user.onboardingStatus = "in_progress";
        }
      } else if (["intern", "employee"].includes(oldRole) && newRole === "candidate") {
        user.role = "candidate";
        user.selectedAs = null;
      } else {
        user.role = newRole;
      }
    }

    await user.save();

    if (acceptedOffer?.applicationId) {
      const application = await Application.findById(acceptedOffer.applicationId);
      if (application) {
        application.status = "converted";
        application.convertedTo = newRole;
        await application.save();
      }
    }

    if (newRole && newRole !== oldRole) {
      await recordAuditLog({
        userId: actorId(req),
        action: "role_change",
        module: "users",
        entityId: user._id,
        oldValue: oldValues,
        newValue: { role: newRole, empId: user.empId, override: override === true },
      });
      await notify({
        userId: user._id,
        message: `Your account role has been changed to ${newRole} by admin. Log in again with the same credentials.`,
        type: override === true ? "warning" : "info",
        link: newRole === "intern" ? "/intern" : newRole === "employee" ? "/employee" : `/${newRole}`,
      });
      if (oldRole === "candidate" && ["intern", "employee"].includes(newRole)) {
        const hrs = await User.find({ role: "hr", isActive: true, status: "active" }).select("_id");
        await notifyMany({
          userIds: hrs.map((hr) => hr._id),
          message: `Admin ${override === true ? "force-" : ""}converted ${user.name} from candidate to ${newRole}.`,
          type: override === true ? "warning" : "info",
          link: "/hr/employees",
        });
      }
    } else {
      await recordAuditLog({
        userId: actorId(req),
        action: "update",
        module: "users",
        entityId: user._id,
        oldValue: oldValues,
        newValue: updates,
      });
    }

    return res.json({ success: true, data: user, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update user", error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "newPassword (min 8 chars) is required" });
    }
    const user = await User.findById(req.params.id).select("+password +resetToken +resetExpires");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    user.password = newPassword;
    user.resetToken = undefined;
    user.resetExpires = undefined;
    user.passwordResetRequired = false;
    await user.save();
    await notify({
      userId: user._id,
      message: "Your password has been reset by admin. Please log in with your new password.",
      type: "warning",
      link: "/login",
    });
    await recordAuditLog({
      userId: actorId(req),
      action: "update",
      module: "users",
      entityId: user._id,
      newValue: { passwordReset: true },
    });
    return res.json({ success: true, message: "Password reset" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to reset password", error: error.message });
  }
};

const setStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!USER_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "status must be active, inactive, or suspended" });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.role === "admin" && user.isActive && user.status === "active" && status !== "active") {
      const activeAdmins = await User.countDocuments({ role: "admin", isActive: true, status: "active" });
      if (activeAdmins <= 1) return res.status(400).json({ success: false, message: "Cannot suspend or deactivate the last active admin" });
    }

    const oldStatus = user.status;
    const oldIsActive = user.isActive;
    user.status = status;
    user.isActive = status !== "inactive";
    await user.save();
    await notify({
      userId: user._id,
      message: `Your account status is now: ${status}.`,
      type: status === "active" ? "success" : "warning",
    });
    await recordAuditLog({
      userId: actorId(req),
      action: "update",
      module: "users",
      entityId: user._id,
      oldValue: { status: oldStatus, isActive: oldIsActive },
      newValue: { status, isActive: user.isActive },
    });
    return res.json({ success: true, data: user, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update user status", error: error.message });
  }
};

const activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.status === "suspended") {
      return res.status(409).json({ success: false, message: "Use the status endpoint to explicitly unlock a suspended account" });
    }
    const oldStatus = user.status;
    const wasActive = user.isActive;
    user.isActive = true;
    user.status = "active";
    await user.save();
    if (!wasActive || oldStatus !== "active") {
      await recordAuditLog({
        userId: actorId(req), action: "update", module: "users", entityId: user._id,
        oldValue: { isActive: wasActive, status: oldStatus },
        newValue: { isActive: true, status: "active" },
      });
    }
    return res.status(200).json({ success: true, message: "User account activated successfully", user });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to activate user", error: error.message });
  }
};

const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.role === "admin" && user.isActive && user.status === "active") {
      const activeAdmins = await User.countDocuments({ role: "admin", isActive: true, status: "active" });
      if (activeAdmins <= 1) return res.status(400).json({ success: false, message: "Cannot deactivate the last active admin" });
    }
    const oldStatus = user.status;
    const wasActive = user.isActive;
    user.isActive = false;
    user.status = "inactive";
    await user.save();
    await recordAuditLog({
      userId: actorId(req), action: "update", module: "users", entityId: user._id,
      oldValue: { isActive: wasActive, status: oldStatus },
      newValue: { isActive: false, status: "inactive" },
    });
    return res.status(200).json({ success: true, message: "User account deactivated successfully", user });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to deactivate user", error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.role === "admin" && user.isActive && user.status === "active") {
      const activeAdmins = await User.countDocuments({ role: "admin", isActive: true, status: "active" });
      if (activeAdmins <= 1) return res.status(400).json({ success: false, message: "Cannot delete the last active admin" });
    }

    const id = user._id;
    const [
      applications, offers, interviews, documents, letters, recommendations,
      history, onboarding, approvals, managedUsers,
    ] = await Promise.all([
      Application.countDocuments({ candidateId: id }),
      Offer.countDocuments({ $or: [{ candidateId: id }, { createdBy: id }] }),
      Interview.countDocuments({ $or: [{ candidateId: id }, { interviewerId: id }, { assignedBy: id }] }),
      Document.countDocuments({ $or: [{ ownerId: id }, { uploadedBy: id }, { verifiedBy: id }] }),
      Letter.countDocuments({ $or: [{ employeeId: id }, { createdBy: id }] }),
      HiringRecommendation.countDocuments({ $or: [{ candidateId: id }, { hiringManagerId: id }] }),
      EmployeeHistory.countDocuments({ $or: [{ employeeId: id }, { changedBy: id }] }),
      Onboarding.countDocuments({ $or: [{ employeeId: id }, { createdBy: id }] }),
      ApprovalRequest.countDocuments({
        $or: [{ requestedBy: id }, { approverId: id }, { "steps.approverId": id }],
      }),
      User.countDocuments({ $or: [{ managerId: id }, { mentor: id }, { hiringManagerId: id }] }),
    ]);
    const dependencies = {
      applications, offers, interviews, documents, letters, recommendations,
      employeeHistory: history, onboarding, approvals, managedUsers,
    };
    const totalDependencies = Object.values(dependencies).reduce((sum, count) => sum + count, 0);
    if (totalDependencies > 0) {
      return res.status(409).json({
        success: false,
        message: "Cannot delete user while dependent records exist. Archive or reassign those records first.",
        data: dependencies,
      });
    }

    await Notification.deleteMany({ userId: id });
    await user.deleteOne();
    await recordAuditLog({
      userId: actorId(req),
      action: "delete",
      module: "users",
      entityId: id,
      oldValue: { email: user.email, role: user.role },
    });
    return res.json({ success: true, message: "User deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete user", error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUsers: getAllUsers,
  createUser,
  getUserById,
  updateUser,
  resetPassword,
  setStatus,
  activateUser,
  deactivateUser,
  deleteUser,
};
