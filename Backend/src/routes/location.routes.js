const express = require('express');
const router = express.Router();
const { updateLocation, getDriverLocation, getFleetLocations } = require('../controllers/location.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

router.post('/update', authenticateUser, updateLocation);
router.get('/driver/:driverId', authenticateUser, getDriverLocation);
router.get('/fleet', authenticateUser, getFleetLocations);

module.exports = router;
