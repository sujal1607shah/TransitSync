const express = require('express');
const router = express.Router();
const { getNotifications, markRead } = require('../controllers/notification.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

router.get('/', authenticateUser, getNotifications);
router.patch('/:id/read', authenticateUser, markRead);

module.exports = router;
