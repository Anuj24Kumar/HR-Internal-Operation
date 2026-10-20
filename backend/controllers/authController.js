const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Candidate, Workflow, LetterTemplate } = require("../models");

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return process.env.JWT_SECRET;
};

const registerUser = async (req, res) => {
  let createdUser;

  try {
    const { firstName, lastName, email, password, phone, position } = req.body;

    if (
      typeof firstName !== "string" ||
      !firstName.trim() ||
      typeof lastName !== "string" ||
      !lastName.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password ||
      typeof position !== "string" ||
      !position.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, email, password and position are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    createdUser = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: normalizedEmail,
      password: hashedPassword,
      phone: typeof phone === "string" ? phone.trim() : "",
      role: "candidate",
    });

    const candidate = await Candidate.create({
      user: createdUser._id,
      userId: createdUser._id,
      name: createdUser.name,
      email: createdUser.email,
      phone: createdUser.phone,
      position: position.trim(),
      applicationSource: "Direct",
      source: "Direct",
      status: "Applied",
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: createdUser._id,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        email: createdUser.email,
        phone: createdUser.phone,
        role: createdUser.role,
        status: createdUser.status,
        createdAt: createdUser.createdAt,
      },
      application: {
        id: candidate._id,
        position: candidate.position,
        applicationSource: candidate.applicationSource,
        appliedDate: candidate.appliedDate,
        status: candidate.status,
      },
    });
  } catch (error) {
    if (createdUser?._id) {
      try {
        await User.findByIdAndDelete(createdUser._id);
      } catch (cleanupError) {
        console.error("User cleanup error:", cleanupError.message);
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

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password +passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.status !== "active" || user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Your account is not active",
      });
    }

    const storedPassword = user.password || user.passwordHash;
    const isPasswordValid =
      storedPassword && (await bcrypt.compare(password, storedPassword));

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
      },
      getJwtSecret(),
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      }
    );

    user.lastLogin = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
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
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
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

const seedInitialData = async (req, res) => {
  try {
    let admin = await User.findOne({ role: "admin" });
    let created = false;

    if (!admin) {
      const passwordHash = await bcrypt.hash("admin123", 10);
      admin = await User.create({
        name: "Admin",
        firstName: "Admin",
        email: "admin@hrplatform.com",
        passwordHash,
        role: "admin",
        isActive: true,
        status: "active",
      });
      created = true;
    }

    const offerWorkflow = await Workflow.findOne({ type: "offer" });
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

    const letterTemplate = await LetterTemplate.findOne({
      type: "appointment",
    });
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

    return res.status(200).json({
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

module.exports = {
  registerUser,
  loginUser,
  login: loginUser,
  getMe,
  getAdminData,
  seedInitialData,
};
