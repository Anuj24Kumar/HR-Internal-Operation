const express = require('express');
const controller = require('../../controllers/hiring-manager/hiringManagerController');
const requireHiringManager = require('../../middleware/hiring-manager/requireHiringManager');
const { verifyToken } = require('../../middleware/authMiddleware');

const router = express.Router();

router.get('/dashboard/hiring-manager', verifyToken, requireHiringManager, controller.getDashboard);
router.get('/dashboard/hiring-manager/roles', verifyToken, requireHiringManager, controller.getRoles);
router.get('/hiring-manager/candidates', verifyToken, requireHiringManager, controller.listCandidates);
router.get('/hiring-manager/candidates/:id', verifyToken, requireHiringManager, controller.getCandidate);
router.post(
  '/hiring-manager/candidates/:id/recommend',
  verifyToken,
  requireHiringManager,
  controller.recommendCandidate
);
router.get('/hiring-manager/approvals', verifyToken, requireHiringManager, controller.listApprovals);
router.get('/hiring-manager/approvals/:id', verifyToken, requireHiringManager, controller.getApproval);
router.patch(
  '/hiring-manager/approvals/:id/approve',
  verifyToken,
  requireHiringManager,
  controller.approveRequest
);
router.patch(
  '/hiring-manager/approvals/:id/reject',
  verifyToken,
  requireHiringManager,
  controller.rejectRequest
);

module.exports = router;
