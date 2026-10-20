const Offer = require("../models/Offer");
const { hashSignToken } = require("../utils/signToken");

// GET /sign/:token
const getOfferForSigning = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        success: false,
        message: "Invalid signing token",
      });
    }

    const hashedToken = hashSignToken(token);

    const offer = await Offer.findOne({
      signToken: hashedToken,
      signTokenExpiresAt: { $gt: new Date() },
      status: "sent",
    }).select(
      "offerType designation salary joiningDate status pdfUrl signTokenExpiresAt"
    );

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Signing link is invalid, expired, or unavailable",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Offer retrieved successfully",
      offer,
    });
  } catch (error) {
    console.error("Get Offer For Signing Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve offer",
    });
  }
};


// POST /api/sign/:token/accept
const acceptOffer = async (req, res) => {
  try {
    const { token } = req.params;
    const { signature } = req.body;

    // Validate token format
    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        success: false,
        message: "Invalid signing token",
      });
    }

    // Validate signature
    if (
      typeof signature !== "string" ||
      signature.trim().length === 0 ||
      signature.length > 10000
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid signature is required",
      });
    }

    const hashedToken = hashSignToken(token);

    // Find valid offer
    const offer = await Offer.findOne({
      signToken: hashedToken,
      signTokenExpiresAt: { $gt: new Date() },
      status: "sent",
    });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Signing link is invalid, expired, or unavailable",
      });
    }

    // Accept the offer
    offer.status = "accepted";
    offer.signature = signature.trim();
    offer.signedAt = new Date();

    // Invalidate the signing token after acceptance
    offer.signToken = null;
    offer.signTokenExpiresAt = null;

    await offer.save();

    return res.status(200).json({
      success: true,
      message: "Offer accepted successfully",
      offer: {
        id: offer._id,
        status: offer.status,
        signedAt: offer.signedAt,
      },
    });
  } catch (error) {
    console.error("Accept Offer Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to accept offer",
    });
  }
};


// POST /api/sign/:token/decline
const declineOffer = async (req, res) => {
  try {
    const { token } = req.params;

    // Validate signing token format
    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        success: false,
        message: "Invalid signing token",
      });
    }

    // Hash the incoming token
    const hashedToken = hashSignToken(token);

    // Find a valid offer that has been sent
    const offer = await Offer.findOne({
      signToken: hashedToken,
      signTokenExpiresAt: { $gt: new Date() },
      status: "sent",
    });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Signing link is invalid, expired, or unavailable",
      });
    }

    // Reject the offer
    offer.status = "rejected";

    // Invalidate signing token after rejection
    offer.signToken = null;
    offer.signTokenExpiresAt = null;

    await offer.save();

    return res.status(200).json({
      success: true,
      message: "Offer declined successfully",
      offer: {
        id: offer._id,
        status: offer.status,
      },
    });
  } catch (error) {
    console.error("Decline Offer Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to decline offer",
    });
  }
};

module.exports = {
  getOfferForSigning,
  acceptOffer,
  declineOffer,
};