const { protect } = require("../middleware/authMiddleware");

module.exports = { verifyToken: protect, protect };
