const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  getOffers,
  getOfferTemplates,
  createOffer,
  getOfferById,
  updateOffer,
  submitOffer,
  decideOfferApproval,
  sendOffer,
  expireOffer,
  getOfferPdf,
  deleteOffer,
} = require("../controllers/offerController");

router.get("/", protect, authorize("admin", "hr", "hiring_manager"), getOffers);
router.post("/", protect, authorize("admin", "hr"), createOffer);
router.get("/templates", protect, authorize("admin", "hr"), getOfferTemplates);
router.get(
  "/:id",
  protect,
  authorize("admin", "hr", "hiring_manager", "candidate", "intern", "employee"),
  getOfferById
);

router.patch(
  "/:id",
  protect,
  authorize("admin", "hr"),
  updateOffer
);

router.patch(
  "/:id/submit",
  protect,
  authorize("admin", "hr"),
  submitOffer
);

router.patch(
  "/:id/approval",
  protect,
  authorize("admin", "hr", "hiring_manager"),
  decideOfferApproval
);

router.patch(
  "/:id/send",
  protect,
  authorize("admin", "hr"),
  sendOffer
);
router.patch(
  "/:id/expire",
  protect,
  authorize("admin", "hr"),
  expireOffer
);

router.get(
  "/:id/pdf",
  protect,
  authorize("admin", "hr", "hiring_manager", "candidate", "intern", "employee"),
  getOfferPdf
);

router.delete(
  "/:id",
  protect,
  authorize("admin", "hr"),
  deleteOffer
);
module.exports = router;
