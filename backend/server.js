const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/admin/adminRoutes");
const interviewerRoutes = require("./routes/interviewer/interviewerRoutes");
const hiringManagerRoutes = require("./routes/hiring-manager/hiringManagerRoutes");
const candidateRoutes = require("./routes/candidate/candidateRoutes");
const signRoutes = require("./routes/signRoutes");
const internRoutes = require("./routes/intern/internRoutes");
const employeeRoutes = require("./routes/employee/employeeRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const offerRoutes = require("./routes/offerRoutes");
const letterRoutes = require("./routes/letterRoutes");
const documentRoutes = require("./routes/documentRoutes");
const onboardingRoutes = require("./routes/onboardingRoutes");
const exitRoutes = require("./routes/exitRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

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
app.use("/api/v1/candidates", candidateRoutes);
app.use("/api/sign", signRoutes);
app.use("/api/intern", internRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/v1/employees", employeeRoutes);
app.use("/api/v1/offers", offerRoutes);
app.use("/api/v1/interviews", interviewRoutes);
app.use("/api/v1/letters", letterRoutes);
app.use("/api/v1/documents", documentRoutes);
app.use("/api/v1/onboarding", onboardingRoutes);
app.use("/api/v1/exits", exitRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

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
  const port = process.env.PORT || 5000;
  return app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Server startup failed:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };
