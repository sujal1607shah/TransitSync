const express = require('express');
const router = express.Router();
const { getDrivers, getDriverById, createDriver, updateDriver, updateDriverStatus, deleteDriver } = require('../controllers/driver.controller');
const { authenticateUser } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.get('/', authenticateUser, getDrivers);
router.get('/:id', authenticateUser, getDriverById);
router.post('/', authenticateUser, authorizeRoles('ADMIN', 'DISPATCHER'), createDriver);
router.put('/:id', authenticateUser, updateDriver);
router.patch('/:id/status', authenticateUser, updateDriverStatus);
router.delete('/:id', authenticateUser, authorizeRoles('ADMIN'), deleteDriver);

module.exports = router;
