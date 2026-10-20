const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoURI =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/hr_platform";

  try {
    const connection = await mongoose.connect(mongoURI, {
      autoIndex: true,
    });
    console.log(
      `MongoDB connected: ${connection.connection.host}/${connection.connection.name}`
    );
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exitCode = 1;
    throw error;
  }
};

module.exports = connectDB;
