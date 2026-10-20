const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  getOffers,
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

router.get("/", protect, authorize("admin", "hr"), getOffers);
router.post("/", protect, authorize("hr"), createOffer);
router.get(
  "/:id",
  protect,
  authorize("admin", "hr", "hiring_manager", "candidate"),
  getOfferById
);

router.patch(
  "/:id",
  protect,
  authorize("hr"),
  updateOffer
);

router.patch(
  "/:id/submit",
  protect,
  authorize("hr"),
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
  authorize("hr"),
  sendOffer
);
router.patch(
  "/:id/expire",
  protect,
  authorize("hr", "admin"),
  expireOffer
);

router.get(
  "/:id/pdf",
  protect,
  authorize("admin", "hr"),
  getOfferPdf
);

router.delete(
  "/:id",
  protect,
  authorize("hr"),
  deleteOffer
);
module.exports = router;