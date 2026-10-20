
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const uploadDocument = require("../middleware/uploadDocument");

const {
  uploadDocument: createDocument,
  getDocuments,
  getDocumentById,
  downloadDocument,
  verifyDocument,
  rejectDocument,
  deleteDocument,
} = require("../controllers/documentController");

// POST /api/v1/documents
router.post(
  "/",
  protect,
  authorize("admin", "hr", "candidate", "intern", "employee"),
  uploadDocument.single("file"),
  createDocument
);

router.get(
  "/",
  protect,
  authorize("admin", "hr"),
  getDocuments
);

router.get(
  "/:id",
  protect,
  authorize("admin", "hr"),
  getDocumentById
);

router.get(
  "/:id/file",
  protect,
  authorize("admin", "hr"),
  downloadDocument
);

router.patch(
  "/:id/verify",
  protect,
  authorize("hr"),
  verifyDocument
);

router.patch(
  "/:id/reject",
  protect,
  authorize("hr"),
  rejectDocument
);

router.delete(
  "/:id",
  protect,
  authorize("admin", "hr"),
  deleteDocument
);
module.exports = router;
