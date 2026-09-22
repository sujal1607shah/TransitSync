const express = require('express');
const router = express.Router();
const { triggerSOS, getEmergencies, acknowledgeSOS, resolveSOS } = require('../controllers/emergency.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

router.post('/sos', authenticateUser, triggerSOS);
router.get('/', authenticateUser, getEmergencies);
router.patch('/:id/acknowledge', authenticateUser, acknowledgeSOS);
router.patch('/:id/resolve', authenticateUser, resolveSOS);

module.exports = router;
