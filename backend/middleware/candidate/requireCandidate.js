const { authorizeRoles } = require("../roleMiddleware");

module.exports = authorizeRoles("candidate");
