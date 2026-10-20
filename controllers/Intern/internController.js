const Intern = require("../../models/Intern/Intern");

// GET LOGGED-IN INTERN PROFILE
const getMyInternProfile = async (req, res) => {
  try {
    const intern = await Intern.findOne({
      user: req.user.id,
    })
      .populate("user", "firstName lastName email phone profileImage")
      .populate("mentor", "firstName lastName email");

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: "Intern profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Intern profile fetched successfully",
      intern,
    });
  } catch (error) {
    console.error("Get Intern Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch intern profile",
    });
  }
};

module.exports = {
  getMyInternProfile,
};