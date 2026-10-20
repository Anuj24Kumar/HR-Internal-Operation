
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const {
  getHRDashboard,
  getHRPipeline,
    exportHRData,
} = require("../controllers/dashboardController");

router.get(
  "/hr",
  protect,
  authorize("admin", "hr"),
  getHRDashboard
);

router.get(
  "/hr/pipeline",
  protect,
  authorize("admin", "hr"),
  getHRPipeline
);

router.get(
  "/hr/exports",
  protect,
  authorize("admin", "hr"),
  exportHRData
);
module.exports = router;
