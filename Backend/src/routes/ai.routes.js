const express = require('express');
const router = express.Router();
const { processAIChat } = require('../controllers/ai.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

router.post('/chat', authenticateUser, processAIChat);

module.exports = router;
