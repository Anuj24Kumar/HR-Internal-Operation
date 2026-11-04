require("./createDemoAccounts")().catch((error) => {
  console.error("Hiring module seeding failed:", error);
  process.exitCode = 1;
});
