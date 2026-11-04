require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });

const mongoose = require("mongoose");
const { User, Application } = require("./models");

const demoAccounts = [
  {
    role: "admin",
    name: "System Admin",
    email: "admin@company.com",
    password: "Admin@12345",
    department: "Administration",
    phone: "+1 555-0101",
  },
  {
    role: "hr",
    name: "HR Operations",
    email: "hr@company.com",
    password: "HR@12345",
    department: "Human Resources",
    phone: "+1 555-0102",
  },
  {
    role: "hiring_manager",
    name: "Alex Rivera",
    email: "manager@company.com",
    password: "Manager@123",
    department: "Engineering",
    phone: "+1 555-0103",
  },
  {
    role: "interviewer",
    name: "Sarah Chen",
    email: "interviewer@company.com",
    password: "Interviewer@123",
    department: "Engineering",
    phone: "+1 555-0104",
  },
  {
    role: "employee",
    name: "David Miller",
    email: "employee@company.com",
    password: "Employee@123",
    department: "Engineering",
    designation: "Senior Full Stack Engineer",
    phone: "+1 555-0105",
    employmentType: "full_time",
    salary: { ctc: 120000 },
    joiningDate: new Date("2023-06-01T00:00:00.000Z"),
    location: "Bengaluru",
    empId: "DEMO-EMP-001",
    employeeCode: "DEMO-EMP-001",
  },
  {
    role: "intern",
    name: "Emily Watson",
    email: "intern@company.com",
    password: "Intern@123",
    department: "Engineering",
    designation: "Software Engineer Intern",
    phone: "+1 555-0106",
    employmentType: "intern",
    domain: "Software Engineering",
    track: "Backend",
    stipend: 25000,
    startDate: new Date("2026-06-01T00:00:00.000Z"),
    endDate: new Date("2026-12-01T00:00:00.000Z"),
    joiningDate: new Date("2026-06-01T00:00:00.000Z"),
    location: "Bengaluru",
  },
  {
    role: "candidate",
    name: "John Doe",
    email: "candidate@company.com",
    password: "Candidate@123",
    department: "Engineering",
    position: "Software Engineer",
    phone: "+1 555-0107",
  },
];

function splitName(name) {
  const [firstName, ...lastNameParts] = name.trim().split(/\s+/);
  return { firstName, lastName: lastNameParts.join(" ") };
}

async function saveSeedUser(account) {
  const email = account.email.trim().toLowerCase();
  const user = (await User.findOne({ email })) || new User();
  const { firstName, lastName } = splitName(account.name);

  Object.assign(user, {
    ...account,
    ...{ password: account.password },
    email,
    firstName,
    lastName,
    isActive: true,
    status: "active",
    isEmailVerified: true,
    passwordResetRequired: false,
  });

  await user.save();
  return user;
}

async function ensureCandidateApplication(candidate) {
  const application = await Application.findOne({
    candidateId: candidate._id,
    position: candidate.position,
  });
  if (application) return application;

  return Application.create({
    candidateId: candidate._id,
    candidateName: candidate.name,
    email: candidate.email,
    phone: candidate.phone,
    position: candidate.position,
    jobType: "full_time",
    resumeUrl: candidate.resumeUrl,
    status: "applied",
    source: "demo_seed",
  });
}

async function createDemoAccounts() {
  const mongoURI =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/hr_platform";

  try {
    await mongoose.connect(mongoURI, { autoIndex: true });

    const users = [];
    for (const account of demoAccounts) {
      users.push(await saveSeedUser(account));
    }

    const candidate = users.find((user) => user.role === "candidate");
    await ensureCandidateApplication(candidate);

    console.log("Created or updated the seven demo role accounts:");
    console.table(
      users.map(({ role, name, email }) => ({ role, name, email }))
    );
    console.log(
      "The candidate has an applied full-time application for HR workflow testing."
    );
    console.log("Demo passwords are defined in backend/createDemoAccounts.js.");
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

if (require.main === module) {
  createDemoAccounts().catch((error) => {
    console.error("Failed to create demo accounts:", error);
    process.exitCode = 1;
  });
}

module.exports = createDemoAccounts;
