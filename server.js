const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const signRoutes = require("./routes/signRoutes");
const internRoutes = require("./routes/internRoutes");
const employeeRoutes = require("./routes/employeeRoutes");

const app = express();

app.use(cors());
app.use(express.json());


// Authentication routes
app.use("/api/auth", authRoutes);

app.use("/api/candidate", candidateRoutes);
app.use("/api/sign", signRoutes);
app.use("/api/intern", internRoutes);
app.use("/api/employee", employeeRoutes);

// Test route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "HR Internal Operations Platform API is running!",
  });
});

const startServer = async () => {
  await connectDB();

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

startServer();