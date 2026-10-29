
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function createHR() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Database:", mongoose.connection.name);

    if (mongoose.connection.name !== "hr_internal_operations") {
      throw new Error("Wrong database! HR account not created.");
    }

    const email = "hr@company.com";
    const existing = await User.findOne({ email });

    if (existing) {
      console.log("HR account already exists:", email);
      return;
    }

    const passwordHash = await bcrypt.hash("HR@12345", 10);

    await User.create({
      name: "HR Manager",
      email,
      passwordHash,
      role: "hr",
      isActive: true,
    });

    console.log("HR account created successfully.");
    console.log("Email:", email);
    console.log("Password: HR@12345");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createHR();
