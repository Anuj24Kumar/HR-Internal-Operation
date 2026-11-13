const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { User, Workflow, LetterTemplate } = require("../models");

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return process.env.JWT_SECRET;
};

const registerUser = async (req, res) => {
  let createdUser;
  try {
    const { name, firstName, lastName, email, password, phone } = req.body;
    const fullName = typeof name === "string" && name.trim()
      ? name.trim()
      : [firstName, lastName]
          .filter((part) => typeof part === "string" && part.trim())
          .map((part) => part.trim())
          .join(" ");
    if (
      !fullName ||
      typeof email !== "string" || !email.trim() ||
      typeof password !== "string" || !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Store ONLY once in the single users collection
    createdUser = await User.create({
      firstName: typeof firstName === "string" && firstName.trim()
        ? firstName.trim()
        : fullName.split(/\s+/)[0],
      lastName: typeof lastName === "string" && lastName.trim()
        ? lastName.trim()
        : fullName.split(/\s+/).slice(1).join(" "),
      name: fullName,
      email: normalizedEmail,
      password,
      phone: typeof phone === "string" ? phone.trim() : "",
      role: "candidate",
      isActive: true,
      status: "active",
    });

    const token = jwt.sign(
      { userId: createdUser._id.toString(), role: createdUser.role },
      getJwtSecret(),
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
    const userDetails = createdUser.toJSON();
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: userDetails,
      data: { user: userDetails, token },
    });
  } catch (error) {
    if (createdUser?._id) {
      try {
        await User.findByIdAndDelete(createdUser._id);
      } catch (cleanupError) {
        console.error("Registration cleanup error:", cleanupError.message);
      }
    }
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }
    console.error("Registration error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== "string" || !email.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query exclusively from the users collection
    let user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      user = await User.findOne({ email: normalizedEmail }).select("+password");
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.passwordResetRequired) {
      return res.status(403).json({
        success: false,
        message: "Password reset is required before this account can sign in",
      });
    }

    // Compare credentials
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check account status
    if (user.isActive === false || user.status === "inactive" || user.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active",
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      getJwtSecret(),
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
    user.lastLogin = new Date();
    await user.save();

    const userDetails = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
    };
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userDetails,
      data: { token, user: userDetails },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getMe = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = userId ? await User.findById(userId) : req.user;
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({
      success: true,
      user: {
        id: user._id || user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status || (user.isActive === false ? "inactive" : "active"),
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const logoutUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { $set: { lastLogout: new Date() } });
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const seedInitialData = async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production" && req.headers["x-seed-key"] !== process.env.ADMIN_SEED_SECRET) {
      return res.status(403).json({
        success: false,
        message: "Initial data seeding is disabled in production",
      });
    }

    let admin = await User.findOne({ role: "admin" });
    let created = false;
    if (!admin) {
      admin = await User.create({
        name: "Admin",
        firstName: "Admin",
        email: "admin@hrplatform.com",
        password: "admin123",
        role: "admin",
        isActive: true,
        status: "active",
      });
      created = true;
    }
    if (!(await Workflow.findOne({ type: "offer" }))) {
      await Workflow.create({
        name: "Standard Offer Approval Workflow",
        type: "offer",
        description: "HM -> HR -> Admin approval chain",
        steps: [
          { order: 1, role: "hiring_manager", stepName: "Hiring Manager Review" },
          { order: 2, role: "hr", stepName: "HR Head Verification" },
          { order: 3, role: "admin", stepName: "Executive Sign-Off" },
        ],
        isActive: true,
        createdBy: admin._id,
      });
    }
    if (!(await LetterTemplate.findOne({ type: "appointment" }))) {
      await LetterTemplate.create({
        name: "Standard Appointment Letter",
        type: "appointment",
        htmlContent:
          "<h1>Appointment Letter</h1><p>Dear {{employeeName}},</p><p>We are delighted to offer you the position of {{designation}} with a starting salary of {{salary}}.</p><p>Joining Date: {{joiningDate}}</p>",
        placeholders: ["employeeName", "designation", "salary", "joiningDate"],
        version: 1,
        isActive: true,
      });
    }
    return res.status(200).json({
      success: true,
      message: created
        ? "Initial Admin account and default data seeded successfully"
        : "Admin user already exists",
      credentials: { email: admin.email, password: "admin123" },
    });
  } catch (error) {
    console.error("Seeding error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Seeding failed",
      error: error.message,
    });
  }
};

const getAdminData = (req, res) =>
  res.status(200).json({
    success: true,
    message: "Authorization successful!",
    data: {
      userId: req.user.id || req.user._id,
      email: req.user.email,
      role: req.user.role,
    },
  });

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select("+resetToken +resetExpires");
    if (!user) {
      return res.status(404).json({ success: false, message: "No account found with this email" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset token generated successfully.",
      resetToken,
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, resetToken, password, newPassword } = req.body;
    const providedToken = token || resetToken;
    const chosenPassword = password || newPassword;

    if (!providedToken) {
      return res.status(400).json({ success: false, message: "Reset token is required" });
    }
    if (typeof chosenPassword !== "string" || chosenPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
    }

    const hashedToken = crypto.createHash("sha256").update(providedToken).digest("hex");
    const user = await User.findOne({
      resetToken: hashedToken,
      resetExpires: { $gt: new Date() },
    }).select("+password +resetToken +resetExpires");

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }

    user.password = chosenPassword;
    user.resetToken = undefined;
    user.resetExpires = undefined;
    user.passwordResetRequired = false;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password has been successfully updated. You can now log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  login: loginUser,
  getMe,
  logoutUser,
  getAdminData,
  seedInitialData,
  forgotPassword,
  resetPassword,
};
