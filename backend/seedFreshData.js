const createDemoAccounts = require("./createDemoAccounts");

createDemoAccounts().catch((error) => {
  console.error("Failed to seed fresh data:", error);
  process.exitCode = 1;
});
