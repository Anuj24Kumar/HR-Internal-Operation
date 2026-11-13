const createDemoAccounts = require("./backend/createDemoAccounts");

if (require.main === module) {
  createDemoAccounts().catch((error) => {
    console.error("Failed to create demo accounts:", error);
    process.exitCode = 1;
  });
}

module.exports = createDemoAccounts;
