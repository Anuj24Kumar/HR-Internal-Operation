const mongoose = require("mongoose");
const { User, EmployeeHistory, Offer, Document, Letter, Application, Onboarding } = require("../../models");
const { notify } = require("../../utils/notificationHelper");
const { recordAuditLog } = require("../../utils/auditLogger");

// GET: Accepted offers ready for conversion
const getAcceptedOffers = async (req, res) => {
  try {
    const acceptedOffers = await Offer.find({ status: "accepted" })
      .populate("candidateId", "name email phone position role")
      .populate("applicationId", "position jobType")
      .sort({ acceptedAt: -1 });
    const offers = acceptedOffers.filter(
      (offer) => offer.candidateId?.role === "candidate"
    );

    return res.status(200).json({
      success: true,
      count: offers.length,
      data: offers,
    });
  } catch (e) {
    console.error("Get accepted offers error:", e.message);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// POST: Convert accepted candidate to intern or employee
const convertCandidate = async (req, res) => {
  try {
    const {
      offerId,
      targetRole,
      designation,
      department,
      joiningDate,
      salary,
      domain,
      track,
      stipend,
      mentorId,
      managerId,
      employmentType,
      location,
      startDate,
      endDate,
    } = req.body;

    if (!["intern", "employee"].includes(targetRole)) {
      return res.status(400).json({ success: false, message: "targetRole must be intern or employee" });
    }

    const offer = await Offer.findById(offerId);
    if (!offer || offer.status !== "accepted") {
      return res.status(400).json({ success: false, message: "Offer is not in accepted state" });
    }

    const user = await User.findById(offer.candidateId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.role !== "candidate") {
      return res.status(400).json({ success: false, message: "User is already converted" });
    }

    // Retain SAME _id, SAME email, SAME password hash!
    user.role = targetRole;
    user.selectedAs = targetRole;
    user.designation = designation || offer.designation;
    user.department = department || user.department || "";
    user.joiningDate = joiningDate ? new Date(joiningDate) : offer.joiningDate;
    user.employmentType = targetRole === "intern"
      ? "intern"
      : ["full_time", "part_time", "contract"].includes(employmentType)
        ? employmentType
        : "full_time";

    if (targetRole === "employee") {
      user.empId = `EMP-${Date.now().toString().slice(-6)}`;
      user.employeeCode = user.empId;
      user.salary = salary ? { ctc: Number(salary) } : (offer.salary ? { ctc: Number(offer.salary) } : undefined);
      if (managerId) user.managerId = managerId;
    } else {
      user.domain = domain || "";
      user.track = track || "";
      user.stipend = stipend !== undefined && stipend !== null && stipend !== "" ? Number(stipend) : undefined;
      if (mentorId) user.mentor = mentorId;
      user.startDate = startDate ? new Date(startDate) : user.joiningDate;
      if (endDate) user.endDate = new Date(endDate);
      user.onboardingStatus = "in_progress";
    }

    if (location) user.location = location;
    await user.save();

    // Update application
    const app = await Application.findById(offer.applicationId);
    if (app) {
      app.status = "converted";
      app.convertedTo = targetRole;
      const tl = app.timeline.find((t) => t.stage === "converted");
      if (tl) {
        tl.completed = true;
        tl.date = new Date();
      }
      await app.save();
    }

    // Notify the converted user
    await notify({
      userId: user._id,
      message: `Welcome aboard! Your account has been converted to ${targetRole}. Log in again with the same credentials to access your ${targetRole} portal.`,
      type: "success",
      link: targetRole === "intern" ? "/intern" : "/employee",
    });

    await recordAuditLog({
      userId: req.user.id || req.user._id,
      action: "role_change",
      module: "user",
      entityId: user._id,
      oldValue: { role: "candidate" },
      newValue: { role: targetRole, empId: user.empId },
    });

    return res.status(200).json({
      success: true,
      data: user,
      message: `Candidate successfully converted to ${targetRole}`,
    });
  } catch (e) {
    console.error("Convert candidate error:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// GET: List employees/interns with optional role filter
const getEmployees = async (req, res) => {
  try {
    const { role, department, designation, status, search, page = 1, limit = 50 } = req.query;

    const filter = { isActive: { $ne: false } };
    if (role === "intern") filter.role = "intern";
    else if (role === "employee") filter.role = "employee";
    else filter.role = { $in: ["employee", "intern"] };

    if (department) filter.department = department;
    if (designation) filter.designation = designation;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
        { empId: new RegExp(search, "i") },
      ];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 50));

    const users = await User.find(filter)
      .select("-password")
      .populate("managerId", "empId designation department name")
      .sort({ joiningDate: -1, createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await User.countDocuments(filter);

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
      users,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("Get employees error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch employees" });
  }
};

// GET: View single employee/intern with documents, letters, applications, offers
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid employee ID" });
    }

    const user = await User.findOne({ _id: id, role: { $in: ["employee", "intern"] } })
      .select("-password")
      .populate("managerId", "empId designation department name");

    if (!user) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const [documents, letters, applications, offers, onboarding] = await Promise.all([
      Document.find({ ownerId: user._id }).sort({ createdAt: -1 }),
      Letter.find({ employeeId: user._id }).sort({ createdAt: -1 }),
      Application.find({ candidateId: user._id }).sort({ createdAt: -1 }),
      Offer.find({ candidateId: user._id }).sort({ createdAt: -1 }),
      Onboarding.findOne({ employeeId: user._id }).lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        user,
        documents,
        letters,
        applications,
        offers,
        onboarding,
        ...user.toObject(),
      },
    });
  } catch (error) {
    console.error("Get employee by ID error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch employee" });
  }
};

// PATCH: Update employee/intern fields
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid employee ID" });
    }

    const user = await User.findOne({ _id: id, role: { $in: ["employee", "intern"] } });
    if (!user) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const allowedFields = [
      "designation",
      "department",
      "managerId",
      "mentorId",
      "salary",
      "stipend",
      "location",
      "status",
      "domain",
      "track",
      "joiningDate",
      "startDate",
      "endDate",
      "role",
      "type",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === "type" || field === "role") {
          const newRole = req.body.role || (req.body.type === "intern" ? "intern" : "employee");
          user.role = newRole;
          user.selectedAs = newRole;
          user.employmentType = newRole === "intern" ? "intern" : "full_time";
        } else if (field === "mentorId") {
          user.mentor = req.body.mentorId;
        } else if (field === "salary" && typeof req.body.salary === "number") {
          user.salary = { ctc: req.body.salary };
        } else {
          user[field] = req.body[field];
        }
      }
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Update employee error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update employee" });
  }
};

// PATCH: Update employee/intern status
const updateEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid employee ID" });
    }

    const allowedStatuses = [
      "active",
      "inactive",
      "suspended",
      "notice",
      "exited",
      "completed",
      "terminated",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const user = await User.findOneAndUpdate(
      { _id: id, role: { $in: ["employee", "intern"] } },
      { $set: { status } },
      { returnDocument: "after", runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Employee status updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Update employee status error:", error);
    return res.status(500).json({ success: false, message: "Failed to update employee status" });
  }
};

// POST: Add employee history
const addEmployeeHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { historyType, oldValues, newValues, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid employee ID" });
    }

    const allowedTypes = ["promotion", "transfer", "increment"];
    if (!allowedTypes.includes(historyType)) {
      return res.status(400).json({
        success: false,
        message: "historyType must be promotion, transfer or increment",
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: "Reason is required" });
    }

    const employee = await User.findOne({ _id: id, role: { $in: ["employee", "intern"] } });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const history = await EmployeeHistory.create({
      employeeId: employee._id,
      historyType,
      oldValues: oldValues || {},
      newValues: newValues || {},
      reason: reason.trim(),
      changedBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Employee history added successfully",
      data: history,
    });
  } catch (error) {
    console.error("Add employee history error:", error);
    return res.status(500).json({ success: false, message: "Failed to add employee history" });
  }
};

// GET: Employee history timeline
const getEmployeeHistory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid employee ID" });
    }

    const employee = await User.findOne({ _id: id, role: { $in: ["employee", "intern"] } });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const history = await EmployeeHistory.find({ employeeId: employee._id })
      .populate("changedBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error("Get employee history error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch employee history" });
  }
};

module.exports = {
  getAcceptedOffers,
  convertCandidate,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  updateEmployeeStatus,
  addEmployeeHistory,
  getEmployeeHistory,
};
