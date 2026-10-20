const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const interviewerRoutes = require("./routes/interviewer/interviewerRoutes");
const hiringManagerRoutes = require("./routes/hiring-manager/hiringManagerRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const signRoutes = require("./routes/signRoutes");
const internRoutes = require("./routes/internRoutes");
const employeeRoutes = require("./routes/employeeRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1", interviewerRoutes);
app.use("/api/v1", hiringManagerRoutes);

app.use("/api/candidate", candidateRoutes);
app.use("/api/sign", signRoutes);
app.use("/api/intern", internRoutes);
app.use("/api/employee", employeeRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "HR Internal Operations Platform API is running!",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route '${req.originalUrl}' not found`,
  });
});

app.use((error, req, res, next) => {
  console.error("Server Error:", error.stack || error.message);
  res.status(error.status || 500).json({
    success: false,
    message: "An internal server error occurred",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

const startServer = async () => {
  await connectDB();

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };