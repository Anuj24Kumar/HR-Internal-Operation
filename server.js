
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const candidateRoutes = require("./routes/candidateRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const offerRoutes = require("./routes/offerRoutes");
const letterRoutes = require("./routes/letterRoutes");
const documentRoutes = require("./routes/documentRoutes");
const onboardingRoutes = require("./routes/onboardingRoutes");
const exitRoutes = require("./routes/exitRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/api/v1/candidates", candidateRoutes);
app.use("/api/v1/offers", offerRoutes);
app.use("/api/v1/employees", employeeRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/interviews", interviewRoutes);
app.use("/api/v1/letters", letterRoutes);
app.use("/api/v1/documents", documentRoutes);
app.use("/api/v1/onboarding", onboardingRoutes);
app.use("/api/v1/exits", exitRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "HR Internal Operations Backend is running",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
