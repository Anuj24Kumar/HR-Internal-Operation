require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Candidate = require("./models/Candidate");
const ApprovalRequest = require("./models/ApprovalRequest");
const connectDB = require("./config/db");

async function seed() {
  await connectDB();
  console.log("Connected to MongoDB");

  // 1. Create Hiring Manager
  let manager = await User.findOne({ email: "manager@company.com" });
  if (!manager) {
    const passwordHash = await bcrypt.hash("Manager@123", 10);
    manager = await User.create({
      name: "Sarah Jenkins",
      firstName: "Sarah",
      lastName: "Jenkins",
      email: "manager@company.com",
      passwordHash,
      role: "hiring_manager",
      department: "Engineering",
      phone: "+1 (555) 234-5678",
      isActive: true,
      status: "active",
    });
    console.log("Created Hiring Manager: manager@company.com");
  } else {
    manager.role = "hiring_manager";
    manager.department = "Engineering";
    await manager.save();
    console.log("Found existing Hiring Manager");
  }

  // 2. Create Interviewer
  let interviewer = await User.findOne({ email: "interviewer@company.com" });
  if (!interviewer) {
    const passwordHash = await bcrypt.hash("Interviewer@123", 10);
    interviewer = await User.create({
      name: "David Chen",
      firstName: "David",
      lastName: "Chen",
      email: "interviewer@company.com",
      passwordHash,
      role: "interviewer",
      department: "Engineering",
      phone: "+1 (555) 345-6789",
      isActive: true,
      status: "active",
    });
    console.log("Created Interviewer: interviewer@company.com");
  } else {
    interviewer.role = "interviewer";
    interviewer.department = "Engineering";
    await interviewer.save();
    console.log("Found existing Interviewer");
  }

  // 3. Create or update sample candidates assigned to this Hiring Manager
  const sampleCandidates = [
    {
      name: "Emma Wilson",
      email: "emma.wilson@example.com",
      phone: "+1 (555) 019-2834",
      position: "Senior Frontend Engineer",
      department: "Engineering",
      source: "LinkedIn",
      status: "interview",
      hiringManagerId: manager._id,
      interviews: [
        {
          round: 1,
          scheduledAt: new Date(Date.now() - 2 * 86400000),
          interviewerId: interviewer._id,
          rating: 4,
          feedback: "Strong React skills, deep understanding of state management and performance optimization. Great team communicator.",
          feedbackSubmittedAt: new Date(Date.now() - 2 * 86400000),
          status: "completed",
        },
        {
          round: 2,
          scheduledAt: new Date(Date.now() + 2 * 86400000),
          interviewerId: interviewer._id,
          rating: null,
          feedback: "",
          status: "scheduled",
        },
      ],
    },
    {
      name: "Arjun Mehta",
      email: "arjun.mehta@example.com",
      phone: "+1 (555) 829-4720",
      position: "Senior Backend Engineer",
      department: "Engineering",
      source: "Referral",
      status: "interview",
      hiringManagerId: manager._id,
      interviews: [
        {
          round: 1,
          scheduledAt: new Date(Date.now() + 86400000),
          interviewerId: interviewer._id,
          rating: null,
          feedback: "",
          status: "scheduled",
        },
      ],
    },
    {
      name: "Sofia Martinez",
      email: "sofia.martinez@example.com",
      phone: "+1 (555) 738-9201",
      position: "Full Stack Engineer",
      department: "Engineering",
      source: "Direct",
      status: "screening",
      hiringManagerId: manager._id,
      interviews: [],
    },
    {
      name: "Daniel Brooks",
      email: "daniel.brooks@example.com",
      phone: "+1 (555) 482-1950",
      position: "DevOps / Infrastructure Engineer",
      department: "Engineering",
      source: "Career Portal",
      status: "selected",
      selectedAs: "employee",
      hiringManagerId: manager._id,
      interviews: [
        {
          round: 1,
          scheduledAt: new Date(Date.now() - 5 * 86400000),
          interviewerId: interviewer._id,
          rating: 5,
          feedback: "Outstanding systems architecture knowledge and Kubernetes troubleshooting expertise.",
          feedbackSubmittedAt: new Date(Date.now() - 5 * 86400000),
          status: "completed",
        },
      ],
    },
  ];

  for (const c of sampleCandidates) {
    const existing = await Candidate.findOne({ email: c.email });
    if (!existing) {
      await Candidate.create(c);
      console.log(`Created candidate: ${c.name}`);
    } else {
      existing.hiringManagerId = manager._id;
      existing.interviews = c.interviews;
      existing.status = c.status;
      await existing.save();
      console.log(`Updated candidate: ${c.name}`);
    }
  }

  // 4. Create sample approval request for manager
  const emma = await Candidate.findOne({ email: "emma.wilson@example.com" });
  if (emma) {
    const existingReq = await ApprovalRequest.findOne({
      entityId: emma._id,
      status: "pending",
    });
    if (!existingReq) {
      await ApprovalRequest.create({
        entityType: "offer",
        entityId: emma._id,
        currentStep: 1,
        status: "pending",
        requestedBy: manager._id,
        steps: [
          {
            order: 1,
            approverRole: "hiring_manager",
            approverId: manager._id,
            status: "pending",
            comment: "",
          },
          {
            order: 2,
            approverRole: "hr",
            status: "pending",
            comment: "",
          },
        ],
      });
      console.log("Created sample approval request for Emma Wilson");
    }
  }

  console.log("Seeding completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
