require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function resetAdminPassword() {
  try {
    const mongoURI =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      "mongodb://127.0.0.1:27017/hr_platform";

    await mongoose.connect(mongoURI);

    const passwordHash = await bcrypt.hash("Admin@12345", 10);

    const result = await User.updateOne(
      { email: "admin@company.com" },
      { $set: { passwordHash, isActive: true, status: "active" } }
    );

    console.log(
      result.matchedCount === 1
        ? "Admin password reset successfully to Admin@12345"
        : "Admin user not found"
    );
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  resetAdminPassword();
}

module.exports = resetAdminPassword;
