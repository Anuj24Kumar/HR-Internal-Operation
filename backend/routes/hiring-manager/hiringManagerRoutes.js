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
module.exports = router;
