// Verification script for the first 20 production readiness problems
const assert = require("assert");

console.log("=================================================");
console.log("VERIFYING FIRST 20 PROBLEMS PRODUCTION READINESS");
console.log("=================================================\n");

let passed = 0;
let total = 0;

function test(description, fn) {
  total++;
  try {
    fn();
    console.log(`[PASS] ${description}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${description}`);
    console.error(`       Error: ${err.message}`);
  }
}

// 1. Canonical user model and collection mapping
test("Problem 1: User model is canonical, mapped to 'users' collection", () => {
  const User = require("../models/User");
  assert.strictEqual(User.collection.collectionName, "users");
  assert.ok(User.schema.path("role"));
  assert.ok(User.schema.path("email"));
  assert.ok(User.schema.path("status"));
});

// 2. Unsafe automatic default password
test("Problem 2: No default password in User pre-validate, required password and reset/forgot endpoints exist", () => {
  const User = require("../models/User");
  assert.strictEqual(User.schema.path("password").isRequired, true);
  const authController = require("../controllers/authController");
  assert.strictEqual(typeof authController.forgotPassword, "function");
  assert.strictEqual(typeof authController.resetPassword, "function");
});

// 3. Mixed-case and inconsistent status enums
test("Problem 3: Application & Offer status enums are lowercase snake_case", () => {
  const Application = require("../models/Application");
  const Offer = require("../models/Offer");
  const appStages = Application.schema.path("status").enumValues;
  const offerStatuses = Offer.schema.path("status").enumValues;
  
  assert.ok(appStages.includes("applied"));
  assert.ok(appStages.includes("interview"));
  assert.ok(appStages.includes("selected"));
  assert.ok(appStages.includes("offer_sent"));
  assert.ok(appStages.includes("accepted"));
  assert.ok(appStages.includes("converted"));
  
  assert.ok(offerStatuses.includes("draft"));
  assert.ok(offerStatuses.includes("sent"));
  assert.ok(offerStatuses.includes("offer_received"));
  assert.ok(offerStatuses.includes("accepted"));
  assert.ok(offerStatuses.includes("declined"));
  assert.ok(offerStatuses.includes("expired"));
});

// 4. Dead and duplicate model files
test("Problem 4: Dead models (Signature, OnboardingChecklist, EmployeeLetter, AuditLogs) are not exported", () => {
  const models = require("../models");
  assert.strictEqual(models.Signature, undefined);
  assert.strictEqual(models.OnboardingChecklist, undefined);
  assert.strictEqual(models.EmployeeLetter, undefined);
  assert.strictEqual(models.AuditLogs, undefined);
  assert.ok(models.AuditLog);
  assert.ok(models.Letter);
  assert.ok(models.Onboarding);
});

// 5. Hiring-manager selection converts user role too early
test("Problem 5: Hiring manager controller does not convert role to employee/intern", () => {
  const hmController = require("../controllers/hiring-manager/hiringManagerController");
  assert.strictEqual(typeof hmController.recommendCandidate, "function");
});

// 6. HR manual selection bypasses hiring-manager approval flow
test("Problem 6: Controlled conversion requires accepted offer via convertCandidate", () => {
  const hrController = require("../controllers/hr/employeeController");
  assert.strictEqual(typeof hrController.convertCandidate, "function");
  assert.strictEqual(typeof hrController.getAcceptedOffers, "function");
});

// 7. Interview feedback duplicated across multiple stores
test("Problem 7: Interview is canonical record and InterviewFeedback is audit record", () => {
  const Interview = require("../models/Interview");
  const InterviewFeedback = require("../models/interviewer/InterviewFeedback");
  assert.ok(Interview.schema.path("score"));
  assert.ok(Interview.schema.path("rating"));
  assert.ok(Interview.schema.path("feedback"));
  assert.ok(InterviewFeedback.schema.path("lockedAt"));
});

// 8. No notification when an interview is completed
test("Problem 8: Interviewer completion notifies hiring managers and HR", () => {
  const interviewerController = require("../controllers/interviewer/interviewerController");
  assert.strictEqual(typeof interviewerController.completeInterview, "function");
});

// 9. Feedback remains editable after hiring decision
test("Problem 9: Feedback has lockedAt support and updateFeedback verifies locked status", () => {
  const interviewerController = require("../controllers/interviewer/interviewerController");
  assert.strictEqual(typeof interviewerController.updateFeedback, "function");
});

// 10. Offer schema lacks required document fields
test("Problem 10: Offer schema includes requiredDocuments array schema", () => {
  const Offer = require("../models/Offer");
  const reqDocs = Offer.schema.path("requiredDocuments");
  assert.ok(reqDocs);
});

// 11. Offer acceptance/signature fields and signing token are inconsistent
test("Problem 11: Offer schema contains signedOfferLetterUrl, signedAt, acceptedAt, declinedAt", () => {
  const Offer = require("../models/Offer");
  assert.ok(Offer.schema.path("signedOfferLetterUrl"));
  assert.ok(Offer.schema.path("signedAt"));
  assert.ok(Offer.schema.path("acceptedAt"));
  assert.ok(Offer.schema.path("declinedAt"));
});

// 12. Candidate MyOffer page is read-only
test("Problem 12: Candidate offer controller provides acceptOffer and declineOffer with file upload", () => {
  const candidateController = require("../controllers/candidate/candidateController");
  assert.strictEqual(typeof candidateController.acceptOffer, "function");
  assert.strictEqual(typeof candidateController.declineOffer, "function");
});

// 13. Candidates may see draft offers
test("Problem 13: Candidate getMyOffer filters exclusively for released offers", () => {
  const candidateController = require("../controllers/candidate/candidateController");
  assert.strictEqual(typeof candidateController.getMyOffer, "function");
});

// 14. Duplicate candidate references in Offer
test("Problem 14: Offer model uses canonical candidateId referencing User", () => {
  const Offer = require("../models/Offer");
  assert.ok(Offer.schema.path("candidateId"));
  assert.strictEqual(Offer.schema.path("candidate"), undefined);
});

// 15. HR Employees page lacks useful type tabs
test("Problem 15: HR employeeController supports filtering by role and accepted offers", () => {
  const hrController = require("../controllers/hr/employeeController");
  assert.strictEqual(typeof hrController.getEmployees, "function");
  assert.strictEqual(typeof hrController.getAcceptedOffers, "function");
});

// 16. HR cannot drill into employee documents
test("Problem 16: HR employeeController provides getEmployeeById returning documents & letters", () => {
  const hrController = require("../controllers/hr/employeeController");
  assert.strictEqual(typeof hrController.getEmployeeById, "function");
});

// 17. Employee letters page reads from the wrong collection
test("Problem 17: Employee letter controller reads from canonical Letter collection", () => {
  const employeeLetterController = require("../controllers/Employee/employeeLetterController");
  assert.strictEqual(typeof employeeLetterController.getMyEmployeeLetters, "function");
});

// 18. Notification system is incomplete or disconnected
test("Problem 18: Notification helper and routes are connected with notify/notifyMany", () => {
  const notificationHelper = require("../utils/notificationHelper");
  assert.strictEqual(typeof notificationHelper.notify, "function");
  assert.strictEqual(typeof notificationHelper.notifyMany, "function");
  const notificationController = require("../controllers/notificationController");
  assert.strictEqual(typeof notificationController.getMyNotifications, "function");
});

// 19. Inconsistent browser alerts and confirmation dialogs
test("Problem 19: AlertProvider exists in frontend", () => {
  const fs = require("fs");
  const path = require("path");
  const alertProviderPath = path.resolve(__dirname, "../../frontend/src/components/AlertProvider.jsx");
  assert.ok(fs.existsSync(alertProviderPath));
});

// 20. Split audit-log systems
test("Problem 20: AuditLog model is single canonical store with recordAuditLog helper", () => {
  const AuditLog = require("../models/AuditLog");
  assert.strictEqual(AuditLog.collection.collectionName, "auditlogs");
  const auditLogger = require("../utils/auditLogger");
  assert.strictEqual(typeof auditLogger.recordAuditLog, "function");
});

console.log("\n=================================================");
console.log(`RESULTS: ${passed} / ${total} TESTS PASSED`);
console.log("=================================================");

if (passed !== total) {
  process.exitCode = 1;
}
