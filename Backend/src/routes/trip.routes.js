const express = require('express');
const router = express.Router();
const {
  createTrip,
  getTrips,
  getTripById,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  reassignTrip,
} = require('../controllers/trip.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

router.post('/create', authenticateUser, createTrip);
router.post('/', authenticateUser, createTrip);
router.get('/', authenticateUser, getTrips);

router.put('/dispatch/:tripID', authenticateUser, dispatchTrip);
router.put('/complete/:tripID', authenticateUser, completeTrip);
router.put('/cancel/:tripID', authenticateUser, cancelTrip);

router.get('/:id', authenticateUser, getTripById);
router.post('/:id/reassign', authenticateUser, reassignTrip);

module.exports = router;
