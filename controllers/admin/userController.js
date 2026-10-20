const bcrypt = require("bcryptjs");
const { User } = require("../../models");
const { recordAuditLog } = require("../../utils/auditLogger");

/**
 * 1. List all users with filtering, search, and pagination
 * GET /api/admin/users
 */
const getAllUsers = async (req, res) => {
  try {
    const { role, isActive, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (role) {
      query.role = role;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    if (search) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ name: regex }, { email: regex }];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .populate("candidateId", "position status")
      .populate("employeeId", "empId type department designation")
      .populate("hiringManagerId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      total: totalUsers,
      page: parseInt(page, 10),
      totalPages: Math.ceil(totalUsers / parseInt(limit, 10)),
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve users",
      error: error.message,
    });
  }
};

/**
 * 2. Create a new user account with bcrypt-hashed password and assigned role
 * POST /api/admin/users
 */
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, hiringManagerId, candidateId, employeeId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, and role are required fields",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "A user with this email address already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      hiringManagerId: hiringManagerId || null,
      candidateId: candidateId || null,
      employeeId: employeeId || null,
      isActive: true,
    });

    // Record immutable audit log
    await recordAuditLog({
      userId: req.user ? req.user._id : null,
      action: "create",
      module: "users",
      entityId: newUser._id,
      newValue: {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
      },
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: newUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error.message,
    });
  }
};

/**
 * 3. Get single user details
 * GET /api/admin/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("candidateId")
      .populate("employeeId")
      .populate("hiringManagerId", "name email");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user",
      error: error.message,
    });
  }
};

/**
 * 4. Update user profile or role assignment
 * PATCH /api/admin/users/:id
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, hiringManagerId, password } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if demoting the last active admin
    if (role && role !== "admin" && user.role === "admin") {
      const activeAdminCount = await User.countDocuments({ role: "admin", isActive: true });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Action rejected. Cannot change the role of the last active Admin account.",
        });
      }
    }

    // Check if new email is taken by someone else
    if (email && email.toLowerCase().trim() !== user.email) {
      const emailTaken = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: id },
      });
      if (emailTaken) {
        return res.status(400).json({
          success: false,
          message: "Email address is already in use by another account",
        });
      }
      user.email = email.toLowerCase().trim();
    }

    const oldValue = {
      name: user.name,
      email: user.email,
      role: user.role,
      hiringManagerId: user.hiringManagerId,
    };

    let roleChanged = false;
    if (role && role !== user.role) {
      user.role = role;
      roleChanged = true;
    }

    if (name) user.name = name.trim();
    if (hiringManagerId !== undefined) user.hiringManagerId = hiringManagerId || null;
    if (password) {
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    await user.save();

    await recordAuditLog({
      userId: req.user ? req.user._id : null,
      action: roleChanged ? "role_change" : "update",
      module: "users",
      entityId: user._id,
      oldValue,
      newValue: {
        name: user.name,
        email: user.email,
        role: user.role,
        hiringManagerId: user.hiringManagerId,
      },
    });

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    });
  }
};

/**
 * 5. Re-activate a deactivated user account
 * PATCH /api/admin/users/:id/activate
 */
const activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isActive) {
      return res.status(200).json({
        success: true,
        message: "User account is already active",
        user,
      });
    }

    user.isActive = true;
    await user.save();

    await recordAuditLog({
      userId: req.user ? req.user._id : null,
      action: "update",
      module: "users",
      entityId: user._id,
      oldValue: { isActive: false },
      newValue: { isActive: true },
    });

    res.status(200).json({
      success: true,
      message: "User account activated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to activate user",
      error: error.message,
    });
  }
};

/**
 * 6. Soft-deactivate a user account (blocks login, retains data)
 * Critical Guard: Prevents deactivating the last active Admin account.
 * PATCH /api/admin/users/:id/deactivate
 */
const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(200).json({
        success: true,
        message: "User account is already deactivated",
        user,
      });
    }

    // Critical Security Guard: Prevent locking out the system
    if (user.role === "admin") {
      const activeAdminCount = await User.countDocuments({ role: "admin", isActive: true });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Operation blocked. Cannot deactivate the last active Admin account.",
        });
      }
    }

    user.isActive = false;
    await user.save();

    await recordAuditLog({
      userId: req.user ? req.user._id : null,
      action: "update",
      module: "users",
      entityId: user._id,
      oldValue: { isActive: true },
      newValue: { isActive: false },
    });

    res.status(200).json({
      success: true,
      message: "User account deactivated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to deactivate user",
      error: error.message,
    });
  }
};

/**
 * 7. Hard-delete user (only for test/orphaned accounts; audit-logged)
 * Critical Guard: Prevents deleting the last active Admin account.
 * DELETE /api/admin/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "admin") {
      const activeAdminCount = await User.countDocuments({ role: "admin", isActive: true });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Operation blocked. Cannot delete the last active Admin account.",
        });
      }
    }

    const deletedUserData = {
      name: user.name,
      email: user.email,
      role: user.role,
    };

    await User.findByIdAndDelete(req.params.id);

    await recordAuditLog({
      userId: req.user ? req.user._id : null,
      action: "delete",
      module: "users",
      entityId: req.params.id,
      oldValue: deletedUserData,
      newValue: null,
    });

    res.status(200).json({
      success: true,
      message: "User permanently deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  activateUser,
  deactivateUser,
  deleteUser,
};
