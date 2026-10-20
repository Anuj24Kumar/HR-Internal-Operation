const express = require('express');
const controller = require('../../controllers/interviewer/interviewerController');
const requireInterviewer = require('../../middlewares/interviewer/requireInterviewer');
const { verifyToken } = require('../../middlewares/authMiddleware');
const { requireRole } = require('../../middlewares/roleMiddleware');

const router = express.Router();

router.get('/interviewer/interviews', verifyToken, requireInterviewer, controller.listMyInterviews);
router.get('/interviewer/interviews/:roundId', verifyToken, requireInterviewer, controller.getMyInterview);
router.post(
  '/candidates/:id/interviews/:roundId/feedback',
  verifyToken,
  requireInterviewer,
  controller.submitFeedback
);
router.patch(
  '/candidates/:id/interviews/:roundId/feedback',
  verifyToken,
  requireInterviewer,
  controller.updateFeedback
);
router.get(
  '/candidates/:id/interviews/:roundId/feedback',
  verifyToken,
  requireRole(['interviewer', 'hr', 'hiring_manager']),
  controller.getFeedback
);

module.exports = router;
