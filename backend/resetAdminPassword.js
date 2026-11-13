require("dotenv").config();

const mongoose = require("mongoose");
const { User } = require("./models");

async function resetAdminPassword() {
  try {
    const mongoURI =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      "mongodb://127.0.0.1:27017/hr_platform";

    await mongoose.connect(mongoURI);

    const user = await User.findOne({ email: "admin@company.com" });
    if (user) {
      user.password = "Admin@12345";
      user.isActive = true;
      user.status = "active";
      user.passwordResetRequired = false;
      await user.save();
    }

    console.log(
      user
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
