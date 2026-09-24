const express = require('express');
const router = express.Router();
const { checkIn, checkOut, getMyAttendance, getAllAttendance } = require('../controllers/attendance.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

router.post('/check-in', authenticateUser, checkIn);
router.post('/check-out', authenticateUser, checkOut);
router.get('/my', authenticateUser, getMyAttendance);
router.get('/', authenticateUser, getAllAttendance);

module.exports = router;
