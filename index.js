require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Global Middlewares
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// Import Routes
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const interviewerRoutes = require("./routes/interviewer/interviewerRoutes");
const hiringManagerRoutes = require("./routes/hiring-manager/hiringManagerRoutes");

// Mount Routes (supporting both /api and /api/v1 prefixes)
app.use("/api/auth", authRoutes);
app.use("/api/v1/auth", authRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/v1/admin", adminRoutes);

app.use("/api/v1", interviewerRoutes);
app.use("/api/v1", hiringManagerRoutes);

// Global 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route '${req.originalUrl}' not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "An internal server error occurred",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});