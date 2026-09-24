const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getDispatcherDashboard,
  getDriverDashboard,
  getFleetAnalytics,
} = require('../controllers/dashboard.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

router.get('/admin', authenticateUser, getAdminDashboard);
router.get('/dispatcher', authenticateUser, getDispatcherDashboard);
router.get('/driver', authenticateUser, getDriverDashboard);
router.get('/analytics', authenticateUser, getFleetAnalytics);

module.exports = router;
