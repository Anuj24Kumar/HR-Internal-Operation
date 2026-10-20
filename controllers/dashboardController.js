
const Candidate = require("../models/Candidate");
const Employee = require("../models/Employee");
const Offer = require("../models/Offer");
const ApprovalRequest = require("../models/ApprovalRequest");
const Onboarding = require("../models/Onboarding");

const ExcelJS = require("exceljs");

const getHRDashboard = async (req, res) => {
  try {
    const now = new Date();
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + 30);

    const [
      totalCandidates,
      totalEmployees,
      pendingApprovals,
      openOnboardings,
      expiringOffers,
      candidateStages,
      offerCounts,
    ] = await Promise.all([
      Candidate.countDocuments(),
      Employee.countDocuments(),
      ApprovalRequest.countDocuments({ status: "Pending" }),
      Onboarding.countDocuments({
        "tasks.0": { $exists: true },
        $expr: {
          $lt: [
            {
              $size: {
                $filter: {
                  input: "$tasks",
                  as: "task",
                  cond: { $ne: ["$$task.status", "Completed"] },
                },
              },
            },
            { $size: "$tasks" },
          ],
        },
      }),
      Offer.countDocuments({
        expiryDate: { $gte: now, $lte: upcomingDate },
        status: { $nin: ["Accepted", "Rejected", "Expired"] },
      }),
      Candidate.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Offer.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalCandidates,
        totalEmployees,
        pendingApprovals,
        openOnboardings,
        expiringOffers,
        pipeline: candidateStages.map((item) => ({
          stage: item._id || "Unspecified",
          count: item.count,
        })),
        offers: offerCounts.map((item) => ({
          status: item._id || "Unspecified",
          count: item.count,
        })),
      },
    });
  } catch (error) {
    console.error("HR dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch HR dashboard",
    });
  }
};


const getHRPipeline = async (req, res) => {
  try {
    const pipeline = await Candidate.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const totalCandidates = pipeline.reduce(
      (total, stage) => total + stage.count,
      0
    );

    return res.status(200).json({
      success: true,
      data: {
        totalCandidates,
        pipeline: pipeline.map((stage) => ({
          stage: stage._id || "Unspecified",
          count: stage.count,
        })),
      },
    });
  } catch (error) {
    console.error("HR pipeline error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch candidate pipeline",
    });
  }
};


const exportHRData = async (req, res) => {
  try {
    const type = String(req.query.type || "candidates").toLowerCase();
    const format = String(req.query.format || "csv").toLowerCase();

    const allowedTypes = ["candidates", "employees", "offers"];
    const allowedFormats = ["csv", "xlsx"];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "type must be candidates, employees, or offers",
      });
    }

    if (!allowedFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        message: "format must be csv or xlsx",
      });
    }

    let Model;

    if (type === "candidates") {
      Model = Candidate;
    } else if (type === "employees") {
      Model = Employee;
    } else {
      Model = Offer;
    }

    const records = await Model.find().lean();

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No ${type} data available to export`,
      });
    }

    // Convert MongoDB records into spreadsheet-friendly values.
    const rows = records.map((record) => {
      const row = {};

      for (const [key, value] of Object.entries(record)) {
        if (key === "__v") continue;

        row[key] =
          value instanceof Date
            ? value.toISOString()
            : value !== null && typeof value === "object"
              ? JSON.stringify(value)
              : value;
      }

      return row;
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(type);

    worksheet.columns = Object.keys(rows[0]).map((key) => ({
      header: key,
      key,
      width: Math.min(Math.max(key.length + 5, 15), 35),
    }));

    rows.forEach((row) => worksheet.addRow(row));

    worksheet.getRow(1).font = { bold: true };
    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    const filename = `${type}-export.${format}`;

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    if (format === "csv") {
      res.type("text/csv");
      await workbook.csv.write(res);
      return res.end();
    }

    res.type(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    console.error("HR export error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to export HR data",
      });
    }
  }
};

module.exports = {
  getHRDashboard,
  getHRPipeline,
  exportHRData,
};
