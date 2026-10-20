
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function resetAdminPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const passwordHash = await bcrypt.hash("Admin@12345", 10);

    const result = await mongoose.connection
      .collection("users")
      .updateOne(
        { email: "admin@company.com" },
        { $set: { passwordHash } }
      );

    console.log(
      result.matchedCount === 1
        ? "Admin password reset successfully"
        : "Admin user not found"
    );
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

resetAdminPassword();
