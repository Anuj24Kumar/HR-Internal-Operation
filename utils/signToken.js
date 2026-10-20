const crypto = require("crypto");

// Generate a secure random signing token
const generateSignToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Hash the token before storing it in the database
const hashSignToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

module.exports = {
  generateSignToken,
  hashSignToken,
};