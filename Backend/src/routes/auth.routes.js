const express = require('express');
const router = express.Router();
const { login, getMe, requestResetPassword, resetPassword, logout } = require('../controllers/auth.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

router.post('/login', login);
router.get('/request-reset-password', requestResetPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticateUser, getMe);
router.post('/logout', authenticateUser, logout);

module.exports = router;
