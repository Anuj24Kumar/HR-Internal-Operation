require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });

const mongoose = require("mongoose");
const {
  User,
  Application,
  Interview,
  Workflow,
  LetterTemplate,
} = require("./models");

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
  let application = await Application.findOne({
    candidateId: candidate._id,
  });

  const stages = [
    { stage: "applied", title: "Applied", description: "Application submitted via career portal", completed: true, date: new Date() },
    { stage: "interview", title: "Technical Interview", description: "Technical round scheduled with interviewer", completed: true, date: new Date() },
    { stage: "selected", title: "Selection Decision", description: "Pending interview completion", completed: false, date: null },
    { stage: "offer_sent", title: "Offer Extended", description: "Pending selection", completed: false, date: null },
    { stage: "accepted", title: "Offer Acceptance", description: "Pending offer", completed: false, date: null },
  ];

  if (application) {
    application.candidateName = candidate.name;
    application.email = candidate.email;
    application.phone = candidate.phone;
    application.position = candidate.position || "Software Engineer";
    application.jobType = "full_time";
    application.status = "interview";
    if (!application.timeline || application.timeline.length === 0) {
      application.timeline = stages;
    }
    await application.save();
    return application;
  }

  application = await Application.create({
    candidateId: candidate._id,
    candidateName: candidate.name,
    email: candidate.email,
    phone: candidate.phone,
    position: candidate.position || "Software Engineer",
    jobType: "full_time",
    resumeUrl: candidate.resumeUrl || "",
    status: "interview",
    source: "demo_seed",
    timeline: stages,
  });

  return application;
}

async function ensureDemoInterview(candidate, application, interviewer, admin) {
  let interview = await Interview.findOne({
    candidateId: candidate._id,
    interviewerId: interviewer._id,
  });

  const scheduledTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
  if (!interview) {
    interview = await Interview.create({
      candidateId: candidate._id,
      applicationId: application._id,
      roundName: "Technical Round 1",
      interviewType: "technical",
      interviewerId: interviewer._id,
      scheduledAt: scheduledTime,
      meetingLink: "https://meet.google.com/abc-demo-xyz",
      status: "scheduled",
      assignedBy: admin._id,
    });
  } else {
    interview.applicationId = application._id;
    interview.status = "scheduled";
    interview.scheduledAt = scheduledTime;
    await interview.save();
  }
  return interview;
}

async function ensureWorkflowsAndTemplates(admin) {
  // 1. Offer Approval Workflow
  let workflow = await Workflow.findOne({ type: "offer" });
  if (!workflow) {
    await Workflow.create({
      name: "Standard Offer Approval Workflow",
      type: "offer",
      description: "Hiring Manager -> HR Head -> Admin approval chain",
      steps: [
        { order: 1, role: "hiring_manager", stepName: "Hiring Manager Review" },
        { order: 2, role: "hr", stepName: "HR Head Verification" },
        { order: 3, role: "admin", stepName: "Executive Sign-Off" },
      ],
      isActive: true,
      createdBy: admin._id,
    });
  }

  // 2. Offer Letter Template
  let offerTemplate = await LetterTemplate.findOne({ type: "offer" });
  if (!offerTemplate) {
    await LetterTemplate.create({
      name: "Standard Offer Letter Template",
      type: "offer",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b;">
          <h2>Employment Offer Letter</h2>
          <p>Dear {{candidateName}},</p>
          <p>We are delighted to offer you the position of <strong>{{designation}}</strong> at our company.</p>
          <p>Your annual CTC will be <strong>{{salary}}</strong>. Your anticipated joining date is <strong>{{joiningDate}}</strong>.</p>
          <p>We look forward to welcoming you to the team!</p>
          <br/>
          <p>Sincerely,</p>
          <p><strong>HR Operations Team</strong></p>
        </div>
      `,
      placeholders: ["candidateName", "designation", "salary", "joiningDate"],
      version: 1,
      isActive: true,
    });
  }

  // 3. Appointment Letter Template
  let appointmentTemplate = await LetterTemplate.findOne({ type: "appointment" });
  if (!appointmentTemplate) {
    await LetterTemplate.create({
      name: "Standard Appointment Letter",
      type: "appointment",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b;">
          <h2>Appointment Letter</h2>
          <p>Dear {{employeeName}},</p>
          <p>This is to confirm your official appointment as <strong>{{designation}}</strong> effective from <strong>{{joiningDate}}</strong>.</p>
          <p>Salary Package: <strong>{{salary}}</strong> per annum.</p>
          <br/>
          <p>Best Regards,</p>
          <p><strong>Management Team</strong></p>
        </div>
      `,
      placeholders: ["employeeName", "designation", "salary", "joiningDate"],
      version: 1,
      isActive: true,
    });
  }
}

async function createDemoAccounts() {
  const mongoURI =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/hr_platform";

  try {
    await mongoose.connect(mongoURI, { autoIndex: true });

    // Seed/update the 7 demo accounts
    const users = [];
    for (const account of demoAccounts) {
      users.push(await saveSeedUser(account));
    }

    const admin = users.find((u) => u.role === "admin");
    const manager = users.find((u) => u.role === "hiring_manager");
    const interviewer = users.find((u) => u.role === "interviewer");
    const employee = users.find((u) => u.role === "employee");
    const intern = users.find((u) => u.role === "intern");
    const candidate = users.find((u) => u.role === "candidate");

    // Link relationships
    if (employee && manager) {
      employee.managerId = manager._id;
      await employee.save();
    }
    if (intern && manager) {
      intern.mentor = manager._id;
      await intern.save();
    }

    // Ensure candidate application & interview
    const application = await ensureCandidateApplication(candidate);
    await ensureDemoInterview(candidate, application, interviewer, admin);

    // Ensure workflow and templates
    await ensureWorkflowsAndTemplates(admin);

    // Clean up any remaining legacy passwordHash in the database
    await mongoose.connection.collection("users").updateMany(
      { passwordHash: { $exists: true } },
      { $unset: { passwordHash: "" } }
    );

    console.log("Successfully seeded demo data for all 7 platform roles:");
    console.table(
      users.map(({ role, name, email }) => ({ role, name, email }))
    );
    console.log("✓ All demo accounts seeded with active status and valid password hashes.");
    console.log("✓ Candidate application and technical interview seeded for interviewer workflow.");
    console.log("✓ Standard offer workflow and letter templates seeded.");
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
