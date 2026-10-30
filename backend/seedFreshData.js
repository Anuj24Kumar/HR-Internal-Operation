require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = require("./config/db");

// Models
const User = require("./models/User");
const Candidate = require("./models/Candidate");
const Employee = require("./models/Employee");
const EmploymentHistory = require("./models/Employee/EmploymentHistory");
const Intern = require("./models/Intern/Intern");
const OnboardingTask = require("./models/Intern/OnboardingTask");
const Interview = require("./models/Interview");
const Offer = require("./models/Offer");
const Letter = require("./models/Letter");
const LetterTemplate = require("./models/LetterTemplate");
const Document = require("./models/Document");
const Onboarding = require("./models/Onboarding");
const Exit = require("./models/Exit");
const ApprovalRequest = require("./models/ApprovalRequest");
const Workflow = require("./models/Workflow");

async function seed() {
  await connectDB();
  console.log("Connected to MongoDB for Fresh Seeding...");

  // 1. Delete all current data EXCEPT audit logs
  console.log("Clearing all data except audits...");
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  for (const col of collections) {
    const name = col.name;
    // Skip audits
    if (name.toLowerCase().includes("audit")) {
      console.log(`Skipping audit collection: ${name}`);
      continue;
    }
    await db.collection(name).deleteMany({});
    console.log(`Cleared collection: ${name}`);
  }

  console.log("\n--- Creating Core Role Users ---");
  const defaultPasswordHash = await bcrypt.hash("Admin@12345", 10);
  const managerPasswordHash = await bcrypt.hash("Manager@123", 10);
  const interviewerPasswordHash = await bcrypt.hash("Interviewer@123", 10);
  const employeePasswordHash = await bcrypt.hash("Employee@123", 10);
  const internPasswordHash = await bcrypt.hash("Intern@123", 10);
  const candidatePasswordHash = await bcrypt.hash("Candidate@123", 10);
  const hrPasswordHash = await bcrypt.hash("HR@12345", 10);
  const adminPlatformHash = await bcrypt.hash("admin123", 10);

  // 1. System Admin
  const adminUser = await User.create({
    name: "System Admin",
    firstName: "System",
    lastName: "Admin",
    email: "admin@company.com",
    passwordHash: defaultPasswordHash,
    role: "admin",
    department: "Executive",
    phone: "+1 (555) 001-0001",
    isActive: true,
    status: "active",
  });

  // Secondary Admin
  await User.create({
    name: "Platform Admin",
    firstName: "Platform",
    lastName: "Admin",
    email: "admin@hrplatform.com",
    passwordHash: adminPlatformHash,
    role: "admin",
    department: "Executive",
    phone: "+1 (555) 001-0002",
    isActive: true,
    status: "active",
  });

  // 2. HR Manager
  const hrUser = await User.create({
    name: "Sarah Jenkins",
    firstName: "Sarah",
    lastName: "Jenkins",
    email: "hr@company.com",
    passwordHash: hrPasswordHash,
    role: "hr",
    department: "Human Resources",
    phone: "+1 (555) 002-0002",
    isActive: true,
    status: "active",
  });

  // 3. Hiring Manager
  const managerUser = await User.create({
    name: "Michael Scott",
    firstName: "Michael",
    lastName: "Scott",
    email: "manager@company.com",
    passwordHash: managerPasswordHash,
    role: "hiring_manager",
    department: "Engineering",
    phone: "+1 (555) 003-0003",
    isActive: true,
    status: "active",
  });

  // 4. Interviewer
  const interviewerUser = await User.create({
    name: "David Chen",
    firstName: "David",
    lastName: "Chen",
    email: "interviewer@company.com",
    passwordHash: interviewerPasswordHash,
    role: "interviewer",
    department: "Engineering",
    phone: "+1 (555) 004-0004",
    isActive: true,
    status: "active",
  });

  // 5. Employee User
  const employeeUser = await User.create({
    name: "Alex Morgan",
    firstName: "Alex",
    lastName: "Morgan",
    email: "employee@company.com",
    passwordHash: employeePasswordHash,
    role: "employee",
    department: "Engineering",
    phone: "+1 (555) 005-0005",
    isActive: true,
    status: "active",
  });

  // 6. Intern User
  const internUser = await User.create({
    name: "Emily Watson",
    firstName: "Emily",
    lastName: "Watson",
    email: "intern@company.com",
    passwordHash: internPasswordHash,
    role: "intern",
    department: "Engineering",
    phone: "+1 (555) 006-0006",
    isActive: true,
    status: "active",
  });

  // 7. Candidate User
  const candidateUser = await User.create({
    name: "James Wilson",
    firstName: "James",
    lastName: "Wilson",
    email: "candidate@company.com",
    passwordHash: candidatePasswordHash,
    role: "candidate",
    department: "Engineering",
    phone: "+1 (555) 007-0007",
    isActive: true,
    status: "active",
  });

  console.log("All 7 Core Role Users Created!");

  // --- Linked Candidate for James Wilson ---
  console.log("\n--- Creating Candidate Profile & Pipeline ---");
  const candidateDoc = await Candidate.create({
    user: candidateUser._id,
    userId: candidateUser._id,
    name: candidateUser.name,
    email: candidateUser.email,
    phone: candidateUser.phone,
    position: "Senior Full Stack Engineer",
    department: "Engineering",
    source: "LinkedIn",
    applicationSource: "LinkedIn",
    status: "selected",
    appliedDate: new Date(Date.now() - 14 * 86400000),
    hiringManagerId: managerUser._id,
    interviews: [
      {
        round: 1,
        scheduledAt: new Date(Date.now() - 7 * 86400000),
        interviewerId: interviewerUser._id,
        rating: 5,
        feedback: "Exceptional architecture skills, strong Node and React fundamentals.",
        feedbackSubmittedAt: new Date(Date.now() - 7 * 86400000),
        status: "completed",
      },
      {
        round: 2,
        scheduledAt: new Date(Date.now() - 4 * 86400000),
        interviewerId: managerUser._id,
        rating: 4,
        feedback: "Strong cultural fit, proven leadership in sprint execution.",
        feedbackSubmittedAt: new Date(Date.now() - 4 * 86400000),
        status: "completed",
      },
    ],
  });

  // Candidate Documents
  await Document.create([
    {
      ownerId: candidateDoc._id,
      ownerType: "Candidate",
      user: candidateUser._id,
      candidateId: candidateDoc._id,
      category: "Resume",
      documentType: "Resume",
      documentName: "James_Wilson_Resume_2026.pdf",
      originalName: "James_Wilson_Resume_2026.pdf",
      fileName: "James_Wilson_Resume_2026.pdf",
      filePath: "/uploads/candidate-documents/James_Wilson_Resume_2026.pdf",
      fileUrl: "/uploads/candidate-documents/James_Wilson_Resume_2026.pdf",
      status: "verified",
      verifiedBy: hrUser._id,
      verifiedAt: new Date(),
      uploadedBy: candidateUser._id,
    },
    {
      ownerId: candidateDoc._id,
      ownerType: "Candidate",
      user: candidateUser._id,
      candidateId: candidateDoc._id,
      category: "Government ID",
      documentType: "Passport",
      documentName: "Passport_Scan_Copy.pdf",
      originalName: "Passport_Scan_Copy.pdf",
      fileName: "Passport_Scan_Copy.pdf",
      filePath: "/uploads/candidate-documents/Passport_Scan_Copy.pdf",
      fileUrl: "/uploads/candidate-documents/Passport_Scan_Copy.pdf",
      status: "uploaded",
      uploadedBy: candidateUser._id,
    },
  ]);

  // Additional Pipeline Candidates
  const c1 = await Candidate.create({
    name: "Rohan Joshi",
    email: "rohan.joshi@example.com",
    phone: "+1 (555) 234-5678",
    position: "DevOps Engineer",
    department: "Engineering",
    source: "Referral",
    status: "applied",
    appliedDate: new Date(Date.now() - 2 * 86400000),
    hiringManagerId: managerUser._id,
  });

  const c2 = await Candidate.create({
    name: "Sneha Gupta",
    email: "sneha.gupta@example.com",
    phone: "+1 (555) 345-6789",
    position: "Product Manager",
    department: "Product",
    source: "LinkedIn",
    status: "screening",
    appliedDate: new Date(Date.now() - 5 * 86400000),
    hiringManagerId: managerUser._id,
  });

  const c3 = await Candidate.create({
    name: "Karan Patel",
    email: "karan.patel@example.com",
    phone: "+1 (555) 456-7890",
    position: "Senior React Developer",
    department: "Engineering",
    source: "Direct",
    status: "interview",
    appliedDate: new Date(Date.now() - 8 * 86400000),
    hiringManagerId: managerUser._id,
    interviews: [
      {
        round: 1,
        scheduledAt: new Date(Date.now() + 1 * 86400000), // Tomorrow!
        interviewerId: interviewerUser._id,
        rating: null,
        feedback: "",
        status: "scheduled",
      },
    ],
  });

  const c4 = await Candidate.create({
    name: "Meera Nair",
    email: "meera.nair@example.com",
    phone: "+1 (555) 567-8901",
    position: "Data Analyst",
    department: "Analytics",
    source: "Career Portal",
    status: "selected",
    appliedDate: new Date(Date.now() - 10 * 86400000),
    hiringManagerId: managerUser._id,
  });

  // Scheduled interview for Interviewer Dashboard
  await Interview.create({
    candidateId: c3._id,
    roundName: "Technical Round 1",
    interviewType: "technical",
    interviewerId: interviewerUser._id,
    scheduledAt: new Date(Date.now() + 1 * 86400000),
    status: "scheduled",
    meetingLink: "https://meet.google.com/xyz-interviews-eng",
  });

  // Completed interview
  await Interview.create({
    candidateId: candidateDoc._id,
    roundName: "Technical Deep-Dive",
    interviewType: "technical",
    interviewerId: interviewerUser._id,
    scheduledAt: new Date(Date.now() - 7 * 86400000),
    status: "completed",
    meetingLink: "https://meet.google.com/abc-interviews-eng",
  });

  console.log("Candidate Pipeline & Interviews Created!");

  // --- Linked Employee for Alex Morgan ---
  console.log("\n--- Creating Employee Profiles & Data ---");
  const employeeDoc = await Employee.create({
    empId: "EMP-1001",
    employeeCode: "EMP-1001",
    user: employeeUser._id,
    userId: employeeUser._id,
    type: "employee",
    employmentType: "full_time",
    department: "Engineering",
    designation: "Senior Software Engineer",
    managerId: null,
    manager: managerUser._id,
    location: "Bangalore, India",
    joiningDate: new Date("2024-03-01"),
    status: "active",
    personalInfo: {
      dob: "1994-06-15",
      gender: "Male",
      address: "124 Innovation Way, Tech Park, Bangalore",
    },
    salary: {
      basic: 65000,
      hra: 32500,
      allowances: 22500,
      pf: 7800,
      totalCTC: 1550000,
    },
    history: [
      {
        type: "promotion",
        date: new Date("2025-04-01"),
        reason: "Annual Performance Appraisal - Promoted to Senior Software Engineer",
        oldValue: "Software Engineer",
        newValue: "Senior Software Engineer",
      },
      {
        type: "increment",
        date: new Date("2025-04-01"),
        reason: "Merit Increment",
        oldValue: 1300000,
        newValue: 1550000,
      },
    ],
  });

  employeeUser.employeeId = employeeDoc._id;
  await employeeUser.save();

  // Employment History collection records for Employee Portal
  await EmploymentHistory.create([
    {
      employee: employeeDoc._id,
      changeType: "promotion",
      effectiveDate: new Date("2025-04-01"),
      reason: "Promoted to Senior Software Engineer based on exceptional project deliverables.",
      previousDesignation: "Software Engineer",
      newDesignation: "Senior Software Engineer",
      previousDepartment: "Engineering",
      newDepartment: "Engineering",
      updatedBy: hrUser._id,
    },
    {
      employee: employeeDoc._id,
      changeType: "salary_increment",
      effectiveDate: new Date("2025-04-01"),
      reason: "Annual compensation adjustment.",
      previousSalary: 1300000,
      newSalary: 1550000,
      updatedBy: hrUser._id,
    },
  ]);

  // Employee Documents
  await Document.create([
    {
      ownerId: employeeDoc._id,
      ownerType: "Employee",
      user: employeeUser._id,
      employeeId: employeeDoc._id,
      category: "Identity",
      documentType: "National ID Card",
      documentName: "National_ID_Card.pdf",
      originalName: "National_ID_Card.pdf",
      fileName: "National_ID_Card.pdf",
      filePath: "/uploads/National_ID_Card.pdf",
      fileUrl: "/uploads/National_ID_Card.pdf",
      status: "verified",
      verifiedBy: hrUser._id,
      verifiedAt: new Date("2024-03-05"),
      uploadedBy: employeeUser._id,
    },
    {
      ownerId: employeeDoc._id,
      ownerType: "Employee",
      user: employeeUser._id,
      employeeId: employeeDoc._id,
      category: "Education",
      documentType: "Master's Degree Certificate",
      documentName: "Masters_Degree_CS.pdf",
      originalName: "Masters_Degree_CS.pdf",
      fileName: "Masters_Degree_CS.pdf",
      filePath: "/uploads/Masters_Degree_CS.pdf",
      fileUrl: "/uploads/Masters_Degree_CS.pdf",
      status: "verified",
      verifiedBy: hrUser._id,
      verifiedAt: new Date("2024-03-05"),
      uploadedBy: employeeUser._id,
    },
  ]);

  // Employee Letters
  await Letter.create([
    {
      employeeId: employeeDoc._id,
      type: "appointment",
      letterType: "Appointment Letter",
      template: "Standard Appointment Letter",
      placeholders: {
        employeeName: employeeUser.name,
        designation: "Software Engineer",
        joiningDate: "01 March 2024",
        salary: "INR 13,00,000",
      },
      status: "signed",
      version: 1,
      pdfUrl: "/uploads/Appointment_Letter_Alex_Morgan.pdf",
      createdBy: hrUser._id,
      submittedAt: new Date("2024-03-01"),
    },
    {
      employeeId: employeeDoc._id,
      type: "promotion",
      letterType: "Promotion Letter",
      template: "Standard Promotion Letter",
      placeholders: {
        employeeName: employeeUser.name,
        newDesignation: "Senior Software Engineer",
        effectiveDate: "01 April 2025",
        newSalary: "INR 15,50,000",
      },
      status: "sent",
      version: 1,
      pdfUrl: "/uploads/Promotion_Letter_Alex_Morgan.pdf",
      createdBy: hrUser._id,
      submittedAt: new Date("2025-04-01"),
    },
  ]);

  // Additional Company Employees so HR & Admin Directory has rich records
  const emp2 = await Employee.create({
    empId: "EMP-1002",
    employeeCode: "EMP-1002",
    type: "employee",
    employmentType: "full_time",
    department: "Product",
    designation: "Lead Product Designer",
    managerId: null,
    manager: managerUser._id,
    location: "Bangalore, India",
    joiningDate: new Date("2023-08-15"),
    status: "active",
    personalInfo: {
      name: "Priya Sharma",
      email: "priya.sharma@company.com",
      phone: "+1 (555) 789-0123",
    },
    salary: { basic: 70000, hra: 35000, allowances: 25000, pf: 8400, totalCTC: 1700000 },
  });

  const emp3 = await Employee.create({
    empId: "EMP-1003",
    employeeCode: "EMP-1003",
    type: "employee",
    employmentType: "full_time",
    department: "Engineering",
    designation: "Cloud Systems Architect",
    managerId: null,
    manager: managerUser._id,
    location: "Remote - India",
    joiningDate: new Date("2022-11-01"),
    status: "active",
    personalInfo: {
      name: "Rahul Verma",
      email: "rahul.verma@company.com",
      phone: "+1 (555) 890-1234",
    },
    salary: { basic: 90000, hra: 45000, allowances: 35000, pf: 10800, totalCTC: 2200000 },
  });

  const emp4 = await Employee.create({
    empId: "EMP-1004",
    employeeCode: "EMP-1004",
    type: "employee",
    employmentType: "full_time",
    department: "Engineering",
    designation: "Quality Assurance Specialist",
    managerId: null,
    manager: managerUser._id,
    location: "Bangalore, India",
    joiningDate: new Date("2023-02-10"),
    status: "notice",
    personalInfo: {
      name: "Anita Roy",
      email: "anita.roy@company.com",
      phone: "+1 (555) 901-2345",
    },
    salary: { basic: 45000, hra: 22500, allowances: 15000, pf: 5400, totalCTC: 1050000 },
  });

  console.log("Employees Created and Configured!");

  // --- Linked Intern for Emily Watson ---
  console.log("\n--- Creating Intern Profile & Onboarding Tasks ---");
  const internDoc = await Intern.create({
    user: internUser._id,
    department: "Engineering",
    designation: "Frontend Engineering Intern",
    stipend: 35000,
    mentor: interviewerUser._id,
    joiningDate: new Date("2026-09-01"),
    location: "Remote - India",
    status: "active",
    notes: "Assigned to the Web Platform team under David Chen.",
  });

  // Onboarding Tasks for Emily Watson
  await OnboardingTask.create([
    {
      intern: internDoc._id,
      title: "Complete Company Security & Compliance Training",
      description: "Review security policies, 2FA setup, and complete the compliance quiz.",
      assignedTo: hrUser._id,
      dueDate: new Date(Date.now() - 5 * 86400000),
      status: "completed",
      completedAt: new Date(Date.now() - 5 * 86400000),
      order: 1,
    },
    {
      intern: internDoc._id,
      title: "Submit Identification and Bank Account Details",
      description: "Upload government ID and signed bank verification letter for stipend processing.",
      assignedTo: hrUser._id,
      dueDate: new Date(Date.now() - 3 * 86400000),
      status: "completed",
      completedAt: new Date(Date.now() - 3 * 86400000),
      order: 2,
    },
    {
      intern: internDoc._id,
      title: "Set up Local Development Environment & Repo Access",
      description: "Clone frontend repositories, verify node dependencies, and run test suites.",
      assignedTo: interviewerUser._id,
      dueDate: new Date(Date.now() + 2 * 86400000),
      status: "in_progress",
      order: 3,
    },
    {
      intern: internDoc._id,
      title: "1-on-1 Introduction & Goals Sync with Mentor",
      description: "Discuss 90-day internship roadmap and milestone deliveries.",
      assignedTo: interviewerUser._id,
      dueDate: new Date(Date.now() + 4 * 86400000),
      status: "pending",
      order: 4,
    },
    {
      intern: internDoc._id,
      title: "First Code Review & Production Pull Request",
      description: "Submit first feature implementation for component testing.",
      assignedTo: interviewerUser._id,
      dueDate: new Date(Date.now() + 10 * 86400000),
      status: "pending",
      order: 5,
    },
  ]);

  // Intern Document
  await Document.create({
    ownerId: internDoc._id,
    ownerType: "Intern",
    user: internUser._id,
    category: "Academic",
    documentType: "College NOC & Recommendation",
    documentName: "College_NOC_Emily_Watson.pdf",
    originalName: "College_NOC_Emily_Watson.pdf",
    fileName: "College_NOC_Emily_Watson.pdf",
    filePath: "/uploads/College_NOC_Emily_Watson.pdf",
    fileUrl: "/uploads/College_NOC_Emily_Watson.pdf",
    status: "verified",
    verifiedBy: hrUser._id,
    verifiedAt: new Date(),
    uploadedBy: internUser._id,
  });

  console.log("Intern Profile & Onboarding Tasks Created!");

  // --- Offers & Approvals ---
  console.log("\n--- Creating Offers & Approval Requests ---");
  const offerForJames = await Offer.create({
    candidateId: candidateDoc._id,
    candidate: candidateUser._id,
    offerType: "employee",
    designation: "Senior Full Stack Engineer",
    salary: 1600000,
    joiningDate: new Date("2026-12-01"),
    expiresAt: new Date(Date.now() + 14 * 86400000),
    status: "sent",
    approvalStatus: "Approved",
    approvalHistory: [
      {
        approverId: managerUser._id,
        approverRole: "hiring_manager",
        action: "approved",
        comments: "Candidate cleared all technical bars with flying colors.",
        decidedAt: new Date(Date.now() - 2 * 86400000),
      },
      {
        approverId: hrUser._id,
        approverRole: "hr",
        action: "approved",
        comments: "Compensation fits within Engineering Tier 2 bands.",
        decidedAt: new Date(Date.now() - 1 * 86400000),
      },
    ],
    pdfUrl: "/uploads/Offer_Letter_James_Wilson.pdf",
    sentAt: new Date(Date.now() - 1 * 86400000),
    createdBy: hrUser._id,
  });

  // Pending Offer for Meera Nair (Approval required by Admin/HR)
  const offerForMeera = await Offer.create({
    candidateId: c4._id,
    offerType: "employee",
    designation: "Data Analyst",
    salary: 1100000,
    joiningDate: new Date("2026-11-15"),
    expiresAt: new Date(Date.now() + 10 * 86400000),
    status: "pending_approval",
    approvalStatus: "Pending",
    createdBy: hrUser._id,
  });

  // Approval Request
  await ApprovalRequest.create({
    entityType: "offer",
    requestType: "Offer",
    entityId: offerForMeera._id,
    resourceId: offerForMeera._id,
    requestedBy: hrUser._id,
    currentStep: 1,
    status: "pending",
    steps: [
      { order: 1, approverRole: "admin", status: "pending" },
    ],
  });

  // Workflows
  await Workflow.create([
    {
      name: "Standard Offer Approval Workflow",
      type: "offer",
      description: "HM -> HR -> Admin executive approval chain",
      steps: [
        { order: 1, role: "hiring_manager", stepName: "Hiring Manager Review" },
        { order: 2, role: "hr", stepName: "HR Head Verification" },
        { order: 3, role: "admin", stepName: "Executive Sign-Off" },
      ],
      isActive: true,
      createdBy: adminUser._id,
    },
    {
      name: "Standard Letter Approval Workflow",
      type: "letter",
      description: "Department Manager -> HR Business Partner -> Admin Sign-off",
      steps: [
        { order: 1, role: "hiring_manager", stepName: "Manager Recommendation" },
        { order: 2, role: "hr", stepName: "HR Verification" },
        { order: 3, role: "admin", stepName: "Leadership Approval" },
      ],
      isActive: true,
      createdBy: adminUser._id,
    },
    {
      name: "Employee Exit Clearance Workflow",
      type: "exit",
      description: "Department Manager -> HR Clearance -> Admin Finalization",
      steps: [
        { order: 1, role: "hiring_manager", stepName: "Manager Handover" },
        { order: 2, role: "hr", stepName: "HR Clearance" },
        { order: 3, role: "admin", stepName: "Final Exit Sign-Off" },
      ],
      isActive: true,
      createdBy: adminUser._id,
    },
  ]);

  // Letter Templates
  await LetterTemplate.create([
    {
      name: "Standard Appointment Letter",
      type: "appointment",
      htmlContent: "<h1>Appointment Letter</h1><p>Dear {{employeeName}},</p><p>We are delighted to offer you the position of {{designation}} with a starting salary of {{salary}}.</p><p>Joining Date: {{joiningDate}}</p>",
      placeholders: ["employeeName", "designation", "salary", "joiningDate"],
      version: 1,
      isActive: true,
    },
    {
      name: "Standard Offer Letter",
      type: "offer",
      htmlContent: "<h1>Official Offer of Employment</h1><p>Dear {{candidateName}},</p><p>PeopleOps is pleased to offer you the position of {{designation}}.</p><p>Starting CTC: {{salary}} per annum.</p>",
      placeholders: ["candidateName", "designation", "salary", "joiningDate"],
      version: 1,
      isActive: true,
    },
    {
      name: "Internship Appointment Letter",
      type: "appointment",
      htmlContent: "<h1>Internship Confirmation</h1><p>Dear {{internName}},</p><p>Welcome to PeopleOps as {{designation}} under mentorship of {{mentorName}}.</p><p>Monthly Stipend: {{stipend}}.</p>",
      placeholders: ["internName", "designation", "mentorName", "stipend"],
      version: 1,
      isActive: true,
    },
  ]);

  // HR Onboarding record for EMP-1001
  await Onboarding.create({
    employeeId: employeeDoc._id,
    type: "employee",
    status: "In Progress",
    startDate: new Date("2024-03-01"),
    tasks: [
      { title: "Laptop and IT Equipment Allocation", owner: "IT", status: "Completed", completedAt: new Date("2024-03-01") },
      { title: "HR Benefits & Insurance Enrollment", owner: "HR", status: "Completed", completedAt: new Date("2024-03-02") },
      { title: "Team Architecture Walkthrough", owner: "Engineering", status: "In Progress" },
      { title: "Security Badge & Workplace Access", owner: "Facilities", status: "Pending" },
    ],
  });

  // HR Exit Case for EMP-1004 (Anita Roy)
  await Exit.create({
    employeeId: emp4._id,
    resignationDate: new Date(Date.now() - 10 * 86400000),
    lastWorkingDay: new Date(Date.now() + 20 * 86400000),
    reason: "Pursuing higher education abroad.",
    status: "in_clearance",
    clearanceProgress: 50,
    clearance: {
      it: { status: "Pending" },
      finance: { status: "Completed", clearedBy: adminUser._id, clearedAt: new Date() },
      manager: { status: "Completed", clearedBy: managerUser._id, clearedAt: new Date() },
      hr: { status: "Pending" },
    },
  });

  console.log("\n========================================================");
  console.log("FRESH SEEDING COMPLETED SUCCESSFULLY!");
  console.log("All roles have live, interconnected database records.");
  console.log("========================================================");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
