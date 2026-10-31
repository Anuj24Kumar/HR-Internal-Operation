require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const createAdmin = async () => {
  try {
    const mongoURI =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      "mongodb://127.0.0.1:27017/hr_platform";

    await mongoose.connect(mongoURI);

    const email = "admin@company.com";
    const password = "Admin@12345";

    let existingAdmin = await User.findOne({ email });

    const passwordHash = await bcrypt.hash(password, 12);

    if (existingAdmin) {
      existingAdmin.role = "admin";
      existingAdmin.passwordHash = passwordHash;
      existingAdmin.isActive = true;
      existingAdmin.status = "active";
      await existingAdmin.save();
      console.log("Admin account updated successfully:", email);
    } else {
      await User.create({
        name: "System Admin",
        firstName: "System",
        lastName: "Admin",
        email,
        passwordHash,
        role: "admin",
        isActive: true,
        status: "active",
      });
      console.log("Admin account created successfully!");
    }

    console.log("Email:", email);
    console.log("Password:", password);
  } catch (error) {
    console.error("Admin creation failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  createAdmin();
}

module.exports = createAdmin;
