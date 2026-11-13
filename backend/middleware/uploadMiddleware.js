const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Upload directory
const uploadDirectory = path.join(
  __dirname,
  "../uploads/candidate-documents"
);

// Create directory if it doesn't exist
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Configure file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    cb(null, `${uniqueSuffix}${extension}`);
  },
});

// Allowed file types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
  ];

  const allowedExtensions = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];

  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  if (
    allowedMimeTypes.includes(file.mimetype) ||
    allowedExtensions.includes(extension)
  ) {
    return cb(null, true);
  }

  cb(
    new Error("Only PDF, DOC, DOCX, JPG, JPEG and PNG files are allowed")
  );
};

// Configure Multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum
    files: 20,
  },
});

module.exports = upload;
