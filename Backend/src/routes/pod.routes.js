const express = require('express');
const router = express.Router();
const { submitPOD, getPOD, getPODPDF } = require('../controllers/pod.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

router.post('/', authenticateUser, submitPOD);
router.get('/:id', authenticateUser, getPOD);
router.get('/:id/pdf', getPODPDF);

module.exports = router;
