require("dotenv").config({ path: require("path").resolve(__dirname, "..", ".env") });

const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const mongoose = require("mongoose");

const uri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hr_platform";
const stages = ["applied", "interview", "selected", "offer_sent", "offer_received", "accepted", "converted", "rejected"];
const roleAliases = {
  candidate: "candidate",
  hr: "hr",
  interviewer: "interviewer",
  hiringmanager: "hiring_manager",
  intern: "intern",
  employee: "employee",
  admin: "admin",
};
const applicationStatusAliases = {
  applied: "applied",
  interview: "interview",
  selected: "selected",
  offer: "offer_sent",
  offersent: "offer_sent",
  offerreceived: "offer_received",
  accepted: "accepted",
  converted: "converted",
  rejected: "rejected",
};
const offerStatusAliases = {
  draft: "draft",
  pendingapproval: "pending_approval",
  approved: "approved",
  sent: "sent",
  offerreceived: "offer_received",
  accepted: "accepted",
  rejected: "rejected",
  expired: "expired",
  declined: "declined",
};

const normalize = (value) => String(value || "").toLowerCase().replace(/[\s_-]+/g, "");
const normalizeStatus = (value, aliases, fallback) => aliases[normalize(value)] || fallback;
const unsetFields = (fields) => Object.fromEntries(fields.map((field) => [field, ""]));

async function updateCollection(db, name, transform) {
  const collection = db.collection(name);
  const before = await collection.countDocuments();
  let updated = 0;
  for await (const document of collection.find({})) {
    const { set, unset } = await transform(document);
    const fieldsToUnset = Array.isArray(unset) ? unset : Object.keys(unset || {});
    if (Object.keys(set).length || fieldsToUnset.length) {
      await collection.updateOne(
        { _id: document._id },
        {
          ...(Object.keys(set).length ? { $set: set } : {}),
          ...(fieldsToUnset.length ? { $unset: unsetFields(fieldsToUnset) } : {}),
        }
      );
      updated += 1;
    }
  }
  const after = await collection.countDocuments();
  console.log(`${name}: before=${before}, updated=${updated}, after=${after}`);
}

async function findApplicationId(db, candidateId) {
  if (!candidateId) return undefined;
  const application = await db.collection("applications").findOne(
    { candidateId },
    { projection: { _id: 1 } }
  );
  return application?._id;
}

async function migrateUsers(db) {
  await updateCollection(db, "users", async (user) => {
    const set = {};
    const unset = ["passwordHash", "user", "userId", "candidateId", "employeeId", "isArchived", "archived", "source", "applicationSource", "interviews", "history"];
    const normalizedRole = normalize(user.role);
    if (roleAliases[normalizedRole]) set.role = roleAliases[normalizedRole];
    if (user.status) {
      const userStatus = normalize(user.status);
      set.status = ["active", "inactive", "suspended"].includes(userStatus)
        ? userStatus
        : userStatus === "exited" ? "inactive" : "active";
    }
    if (!user.name && (user.firstName || user.lastName)) {
      set.name = [user.firstName, user.lastName].filter(Boolean).join(" ");
    }
    if (!user.password && user.passwordHash) {
      set.password = user.passwordHash;
    } else if (!user.password && !user.passwordHash) {
      const generatedPassword = crypto.randomBytes(32).toString("hex");
      set.password = await bcrypt.hash(generatedPassword, 12);
      set.passwordResetRequired = true;
      console.warn(`User ${user._id} has no password; generated an inaccessible password and requires reset.`);
    }
    if (user.email) set.email = user.email.trim().toLowerCase();
    return { set, unset };
  });
}

async function migrateApplications(db) {
  await updateCollection(db, "applications", async (application) => {
    const set = {
      status: normalizeStatus(application.status, applicationStatusAliases, "applied"),
      jobType: normalize(application.jobType) === "internship" ? "internship" : "full_time",
    };
    const user = application.candidateId
      ? await db.collection("users").findOne({ _id: application.candidateId }, { projection: { name: 1, email: 1, phone: 1 } })
      : null;
    if (!application.candidateName && user?.name) set.candidateName = user.name;
    if (!application.email && user?.email) set.email = user.email;
    if (!application.phone && user?.phone) set.phone = user.phone;
    const currentIndex = stages.indexOf(set.status);
    const completedStages = set.status === "rejected"
      ? new Set(["applied", "rejected"])
      : new Set(stages.slice(0, currentIndex + 1));
    set.timeline = stages.map((stage) => {
      const oldStage = (application.timeline || []).find((item) => normalize(item.stage) === normalize(stage));
      const completed = completedStages.has(stage) || Boolean(oldStage?.completed);
      return {
        stage,
        title: oldStage?.title || stage.replace(/_/g, " "),
        description: oldStage?.description || "",
        completed,
        date: completed ? oldStage?.date || application.updatedAt || application.createdAt || new Date() : null,
      };
    });
    return { set, unset: [] };
  });
}

async function migrateOffers(db) {
  await updateCollection(db, "offers", async (offer) => {
    const set = {
      status: normalizeStatus(offer.status, offerStatusAliases, "draft"),
      requiredDocuments: Array.isArray(offer.requiredDocuments)
        ? offer.requiredDocuments.map((document) => ({
            id: document.id || crypto.randomUUID(),
            label: document.label || document.documentType || "Required document",
            acceptedTypes: Array.isArray(document.acceptedTypes) ? document.acceptedTypes : [],
            required: document.required !== false,
            uploadedDocumentId: document.uploadedDocumentId || null,
            uploadedAt: document.uploadedAt || null,
          }))
        : [],
    };
    if (!offer.candidateId && offer.candidate) set.candidateId = offer.candidate;
    if (!offer.applicationId && (offer.candidateId || offer.candidate)) {
      const applicationId = await findApplicationId(db, offer.candidateId || offer.candidate);
      if (applicationId) set.applicationId = applicationId;
    }
    if (!offer.offerType) set.offerType = offer.type === "intern" || offer.type === "internship" ? "intern" : "employee";
    if (!offer.designation && offer.position) set.designation = offer.position;
    if (!offer.salary) set.salary = Number(offer.salaryAmount || 0);
    if (!offer.joiningDate) set.joiningDate = offer.startDate || new Date();
    return { set, unset: ["candidate", "template"] };
  });
}

async function migrateInterviews(db, collectionName = "interviews") {
  if (!(await db.listCollections({ name: collectionName }).hasNext())) return;
  await updateCollection(db, collectionName, async (interview) => {
    const set = { status: normalize(interview.status) || "scheduled" };
    if (!interview.applicationId) {
      const applicationId = await findApplicationId(db, interview.candidateId);
      if (applicationId) set.applicationId = applicationId;
    }
    if (!interview.roundName && interview.round) set.roundName = `Round ${interview.round}`;
    return { set, unset: [] };
  });
}

async function migrateInterviewFeedback(db) {
  await updateCollection(db, "interviewfeedbacks", async (feedback) => {
    const set = {};
    if (!feedback.applicationId) {
      const applicationId = await findApplicationId(db, feedback.candidateId);
      if (applicationId) set.applicationId = applicationId;
    }
    return { set, unset: [] };
  });
}

async function migrateWorkflowStatuses(db) {
  await updateCollection(db, "approvalrequests", async (request) => ({
    set: {
      status: normalize(request.status) === "approved" ? "approved"
        : normalize(request.status) === "rejected" ? "rejected" : "pending",
      ...(Array.isArray(request.steps) ? {
        steps: request.steps.map((step) => ({
          ...step,
          status: normalize(step.status) === "approved" ? "approved"
            : normalize(step.status) === "rejected" ? "rejected" : "pending",
        })),
      } : {}),
    },
    unset: [],
  }));
  await updateCollection(db, "onboardings", async (onboarding) => ({
    set: {
      tasks: (onboarding.tasks || []).map((task) => ({
        ...task,
        status: normalize(task.status) === "completed" ? "completed"
          : normalize(task.status) === "inprogress" ? "in_progress" : "pending",
      })),
    },
    unset: [],
  }));
  await updateCollection(db, "exits", async (exit) => {
    const status = normalize(exit.status);
    const set = {
      status: status === "pendingapproval" ? "pending_approval"
        : ["approved", "rejected", "completed", "inclearance", "initiated"].includes(status)
          ? status === "inclearance" ? "in_clearance" : status : "pending_approval",
    };
    if (exit.clearance) {
      set.clearance = Object.fromEntries(
        Object.entries(exit.clearance).map(([department, clearance]) => [
          department,
          clearance && typeof clearance === "object"
            ? {
                ...clearance,
                status: normalize(clearance.status) === "completed" || normalize(clearance.status) === "cleared"
                  ? "completed" : "pending",
              }
            : clearance,
        ])
      );
    }
    if (Array.isArray(exit.clearances)) {
      set.clearances = exit.clearances.map((clearance) => ({
        ...clearance,
        status: normalize(clearance.status) === "completed" || normalize(clearance.status) === "cleared"
          ? "cleared"
          : normalize(clearance.status) === "rejected" ? "rejected" : "pending",
      }));
    }
    return { set, unset: [] };
  });
  await updateCollection(db, "resignations", async (resignation) => ({
    set: {
      status: ["approved", "rejected", "withdrawn", "completed"].includes(normalize(resignation.status))
        ? normalize(resignation.status) : "pending",
      "clearance.status": ["inprogress", "completed"].includes(normalize(resignation.clearance?.status))
        ? normalize(resignation.clearance.status) === "inprogress" ? "in_progress" : "completed"
        : "not_started",
    },
    unset: [],
  }));
}

async function migrateDocuments(db) {
  await updateCollection(db, "documents", async (document) => {
    const ownerId = document.ownerId || document.user || document.candidateId || document.employeeId;
    const owner = ownerId ? await db.collection("users").findOne({ _id: ownerId }, { projection: { role: 1 } }) : null;
    const category = normalize(document.category);
    const mappedCategory = category === "resume" ? "resume"
      : category.includes("identity") || category.includes("id") ? "identity"
        : category.includes("education") ? "education"
          : category.includes("experience") ? "experience"
            : category.includes("offerlettersigned") || category.includes("signedofferletter") ? "offer_letter_signed"
              : "other";
    const originalName = document.originalName || document.documentName || document.fileName || "document";
    const fileName = document.fileName || originalName;
    const filePath = document.filePath || document.fileUrl || `/uploads/${fileName}`;
    const set = {
      ownerId,
      ownerRole: ["candidate", "intern", "employee"].includes(owner?.role) ? owner.role : "candidate",
      category: mappedCategory,
      documentType: document.documentType || mappedCategory,
      label: document.label || document.documentType || originalName,
      originalName,
      fileName,
      filePath,
      fileUrl: document.fileUrl || filePath,
      mimeType: document.mimeType || "application/octet-stream",
      fileSize: Number(document.fileSize || 0),
      status: normalize(document.status) === "verified" ? "verified"
        : normalize(document.status) === "rejected" ? "rejected" : "pending",
      uploadedBy: document.uploadedBy || ownerId,
    };
    return {
      set,
      unset: ["user", "candidateId", "employeeId", "ownerType", "version"],
    };
  });
}

async function migrateLetters(db) {
  await updateCollection(db, "letters", async (letter) => {
    const rawType = normalize(letter.type || letter.letterType);
    const type = rawType.includes("experience") ? "experience"
      : rawType.includes("relieving") ? "relieving"
        : rawType.includes("promotion") ? "promotion"
          : rawType.includes("increment") || rawType.includes("salary") ? "increment"
            : rawType.includes("warning") ? "warning"
              : rawType.includes("appointment") || rawType.includes("offer") || rawType.includes("internship") ? "appointment"
                : "other";
    const status = normalize(letter.status);
    const set = {
      type,
      title: letter.title || letter.letterType || "Employee Letter",
      status: ["pendingapproval", "pending_approval"].includes(status) ? "pending_approval"
        : ["approved", "generated", "sent"].includes(status) ? status : "draft",
    };
    if (!letter.templateId && mongoose.Types.ObjectId.isValid(letter.template)) {
      set.templateId = new mongoose.Types.ObjectId(letter.template);
    }
    return { set, unset: ["letterType", "template"] };
  });
}

async function migrateAuditLogs(db) {
  const oldCollection = db.collection("auditlogses");
  const count = await oldCollection.countDocuments();
  if (!count) {
    console.log("auditlogses: before=0, copied=0, after=0");
    return;
  }
  const target = db.collection("auditlogs");
  const before = await target.countDocuments();
  let copied = 0;
  for await (const log of oldCollection.find({})) {
    const action = ["create", "update", "delete", "approve", "role_change"].includes(log.action)
      ? log.action : "update";
    await target.updateOne(
      { _id: log._id },
      {
        $setOnInsert: {
          userId: log.userId || log.user || null,
          action,
          module: log.module || log.resourceType || "legacy",
          entityId: log.entityId || log.resourceId || null,
          oldValue: log.oldValue || log.oldData || null,
          newValue: log.newValue || log.newData || null,
          timestamp: log.timestamp || log.createdAt || new Date(),
        },
      },
      { upsert: true }
    );
    copied += 1;
  }
  await oldCollection.drop();
  const after = await target.countDocuments();
  console.log(`auditlogses: before=${count}, copied=${copied}; auditlogs: before=${before}, after=${after}`);
}

async function migrateSchema() {
  await mongoose.connect(uri);
  try {
    const db = mongoose.connection.db;
    await migrateUsers(db);
    await migrateApplications(db);
    await migrateOffers(db);
    await migrateInterviews(db);
    await migrateInterviewFeedback(db);
    await migrateDocuments(db);
    await migrateLetters(db);
    await migrateWorkflowStatuses(db);
    await migrateAuditLogs(db);
    console.log("Schema data normalization completed.");
  } finally {
    await mongoose.disconnect();
  }
}

migrateSchema().catch((error) => {
  console.error("Schema migration failed:", error);
  process.exitCode = 1;
});
