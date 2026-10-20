const express = require("express");
const router = express.Router();

const {
  getOfferForSigning,
  acceptOffer,
  declineOffer,
} = require("../controllers/signController");

router.get("/:token", getOfferForSigning);

router.post("/:token/accept", acceptOffer);

router.post("/:token/decline", declineOffer);

module.exports = router;