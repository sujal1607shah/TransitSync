const express = require('express');
const router = express.Router();
const { getMaintenance, createMaintenance } = require('../controllers/maintenance.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

router.get('/', authenticateUser, getMaintenance);
router.post('/', authenticateUser, createMaintenance);

module.exports = router;
