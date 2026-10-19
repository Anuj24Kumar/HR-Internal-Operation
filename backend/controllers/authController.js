const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { User, Workflow, LetterTemplate } = require("../models");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret_jwt_key_hr_platform_dev";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Public Login
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email ",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact an administrator.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid  password",
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login error",
      error: error.message,
    });
  }
};

/**
 * Return current logged-in user profile
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
      error: error.message,
    });
  }
};

/**
 * Seed initial Admin user and default workflows if database is fresh
 * POST /api/auth/seed
 */
const seedInitialData = async (req, res) => {
  try {
    let admin = await User.findOne({ role: "admin" });
    let created = false;

    if (!admin) {
      const passwordHash = await bcrypt.hash("admin123", 10);
      admin = await User.create({
        name: "Admin",
        email: "admin@hrplatform.com",
        passwordHash,
        role: "admin",
        isActive: true,
      });
      created = true;
    }

    // Seed default offer workflow if missing
    let offerWorkflow = await Workflow.findOne({ type: "offer" });
    if (!offerWorkflow) {
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

    // Seed default letter template if missing
    let letterTemplate = await LetterTemplate.findOne({ type: "appointment" });
    if (!letterTemplate) {
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

    res.status(200).json({
      success: true,
      message: created
        ? "Initial Admin account and default data seeded successfully"
        : "Admin user already exists",
      credentials: {
        email: admin.email,
        password: "admin123",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Seeding failed",
      error: error.message,
    });
  }
};

module.exports = {
  login,
  getMe,
  seedInitialData,
};
