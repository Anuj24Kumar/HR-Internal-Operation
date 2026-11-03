const path = require("path");
const fs = require("fs");

// Ensure node can resolve modules from backend/node_modules when executed from project root
const backendModules = path.join(__dirname, "backend/node_modules");
if (fs.existsSync(backendModules)) {
  module.paths.push(backendModules);
}
const localModules = path.join(__dirname, "node_modules");
if (fs.existsSync(localModules)) {
  module.paths.push(localModules);
}

// Support running from root directory or from inside backend folder
const envPath = fs.existsSync(path.join(__dirname, "backend/.env"))
  ? path.join(__dirname, "backend/.env")
  : fs.existsSync(path.join(__dirname, ".env"))
  ? path.join(__dirname, ".env")
  : null;

if (envPath) {
  require("dotenv").config({ path: envPath });
} else {
  require("dotenv").config();
}

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Models
const backendDir = fs.existsSync(path.join(__dirname, "backend/models"))
  ? path.join(__dirname, "backend")
  : __dirname;

const User = require(path.join(backendDir, "models/User"));
const Application = require(path.join(backendDir, "models/Application"));

const DEMO_ACCOUNTS = [
  {
    role: "admin",
    label: "Admin",
    email: "admin@company.com",
    password: "Admin@12345",
    name: "System Admin",
    firstName: "System",
    lastName: "Admin",
    department: "Administration",
    phone: "+1 555-0101",
    icon: "👑",
  },
  {
    role: "hr",
    label: "HR",
    email: "hr@company.com",
    password: "HR@12345",
    name: "HR Operations",
    firstName: "HR",
    lastName: "Operations",
    department: "Human Resources",
    phone: "+1 555-0102",
    icon: "💼",
  },
  {
    role: "hiring_manager",
    label: "Hiring Manager",
    email: "manager@company.com",
    password: "Manager@123",
    name: "Alex Rivera",
    firstName: "Alex",
    lastName: "Rivera",
    department: "Engineering",
    phone: "+1 555-0103",
    icon: "👔",
  },
  {
    role: "interviewer",
    label: "Interviewer",
    email: "interviewer@company.com",
    password: "Interviewer@123",
    name: "Sarah Chen",
    firstName: "Sarah",
    lastName: "Chen",
    department: "Engineering",
    phone: "+1 555-0104",
    icon: "📋",
  },
  {
    role: "employee",
    label: "Employee",
    email: "employee@company.com",
    password: "Employee@123",
    name: "David Miller",
    firstName: "David",
    lastName: "Miller",
    department: "Engineering",
    position: "Senior Full Stack Engineer",
    phone: "+1 555-0105",
    icon: "👤",
  },
  {
    role: "intern",
    label: "Intern",
    email: "intern@company.com",
    password: "Intern@123",
    name: "Emily Watson",
    firstName: "Emily",
    lastName: "Watson",
    department: "Engineering",
    position: "Software Engineer Intern",
    phone: "+1 555-0106",
    icon: "🎓",
  },
  {
    role: "candidate",
    label: "Candidate",
    email: "candidate@company.com",
    password: "Candidate@123",
    name: "John Doe",
    firstName: "John",
    lastName: "Doe",
    phone: "+1 555-0107",
    icon: "📄",
  },
];

async function createDemoAccounts() {
  const mongoURI =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/hr_platform";

  console.log("Connecting to MongoDB:", mongoURI);
  await mongoose.connect(mongoURI, { autoIndex: true });
  console.log("Connected successfully.\n");

  console.log("==========================================================================");
  console.log(" CREATING / UPDATING ONLY 7 DEMO ROLE ACCOUNTS (NO CANDIDATE AS APPLIED)");
  console.log("==========================================================================\n");

  const results = [];

  for (const account of DEMO_ACCOUNTS) {
    const hashedPassword = await bcrypt.hash(account.password, 10);
    const normalizedEmail = account.email.trim().toLowerCase();

    // 1. Create or update User document only
    let user = await User.findOne({ email: normalizedEmail });

    const userData = {
      name: account.name,
      firstName: account.firstName,
      lastName: account.lastName,
      email: normalizedEmail,
      password: hashedPassword,
      passwordHash: hashedPassword,
      role: account.role,
      department: account.department || "General",
      position: account.position || "",
      phone: account.phone || "",
      isActive: true,
      status: "active",
      isEmailVerified: true,
    };

    // For candidate: keep completely unapplied
    if (account.role === "candidate") {
      userData.position = "";
      userData.interviews = [];
      userData.hiringRecommendation = { status: null, comments: null };
      userData.selectedAs = null;
    }

    if (user) {
      Object.assign(user, userData);
      await user.save();
    } else {
      user = await User.create(userData);
    }

    // Clean up any old dummy applications so candidate is NOT pre-applied
    if (account.role === "candidate") {
      await Application.deleteMany({
        $or: [{ candidateId: user._id }, { email: normalizedEmail }],
      });
    }

    results.push({
      Role: `${account.icon} ${account.label}`,
      Email: account.email,
      Password: account.password,
      Status: "Active User Account Ready",
    });
  }

  console.table(results);

  console.log("\nAll 7 demo role accounts are now created as fresh active user accounts.");
  console.log("Candidate account has no pre-existing applied jobs, ready for application testing!");
  console.log("Quick Sign-In is ready at http://localhost:5173\n");

  await mongoose.disconnect();
  console.log("MongoDB connection closed.");
  process.exit(0);
}

createDemoAccounts().catch((err) => {
  console.error("Failed to create demo accounts:", err);
  process.exit(1);
});
