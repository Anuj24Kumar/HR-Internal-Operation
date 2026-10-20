const fs = require("fs");
const path = require("path");

const Employee = require("../../models/Employee/Employee");
const EmployeeLetter = require("../../models/Employee/EmployeeLetter");

// GET /api/employee/letters
const getMyEmployeeLetters = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const letters = await EmployeeLetter.find({
      employee: employee._id,
      status: "active",
    })
      .populate("issuedBy", "firstName lastName email")
      .sort({ issuedAt: -1, version: -1 });

    return res.status(200).json({
      success: true,
      message: "Employee letters fetched successfully",
      count: letters.length,
      letters,
    });
  } catch (error) {
    console.error("Get Employee Letters Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee letters",
    });
  }
};

// GET /api/employee/letters/:id/pdf
const downloadEmployeeLetterPdf = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid letter ID",
      });
    }

    const employee = await Employee.findOne({ user: req.user.id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const letter = await EmployeeLetter.findOne({
      _id: id,
      employee: employee._id,
      status: "active",
    });

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: "Employee letter not found",
      });
    }

    // This implementation expects a local PDF path or a local uploads URL.
    const filename = path.basename(letter.fileUrl);

    if (!filename.toLowerCase().endsWith(".pdf")) {
      return res.status(400).json({
        success: false,
        message: "The requested letter is not a PDF",
      });
    }

    const uploadDirectory = path.resolve(
      process.cwd(),
      "uploads"
    );

    const filePath = path.resolve(
      uploadDirectory,
      filename
    );

    if (!filePath.startsWith(uploadDirectory + path.sep)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file path",
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Letter PDF file not found",
      });
    }

    return res.download(filePath, filename);
  } catch (error) {
    console.error("Download Employee Letter Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to download employee letter",
    });
  }
};

module.exports = {
  getMyEmployeeLetters,
  downloadEmployeeLetterPdf,
};