
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Safety check: use the intended database only.
    if (mongoose.connection.name !== "hr_internal_operations") {
      throw new Error(
        `Wrong database: ${mongoose.connection.name}`
      );
    }

    const email = "admin@company.com";
    const password = "Admin@12345";

    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log("Admin account already exists:", email);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await User.create({
      name: "System Admin",
      email,
      passwordHash,
      role: "admin",
      isActive: true,
    });

    console.log("Admin account created successfully!");
    console.log("Email:", email);
    console.log("Password:", password);
  } catch (error) {
    console.error("Admin creation failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();
