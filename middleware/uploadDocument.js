
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDir = path.resolve(
  __dirname,
  "..",
  "uploads",
  "documents"
);

fs.mkdirSync(uploadDir, { recursive: true });

const allowedMimeTypes = {
  ".pdf": ["application/pdf"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png": ["image/png"],
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeName = `${crypto.randomUUID()}${extension}`;
    cb(null, safeName);
  },
});

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const validMimeTypes = allowedMimeTypes[extension];

  if (!validMimeTypes || !validMimeTypes.includes(file.mimetype)) {
    return cb(
      new Error("Only PDF, JPG, JPEG and PNG files are allowed")
    );
  }

  cb(null, true);
};

const uploadDocument = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

module.exports = uploadDocument;
