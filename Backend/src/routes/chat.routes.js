const express = require('express');
const router = express.Router();
const {
  getConversations,
  getChatUsers,
  getDirectConversation,
  getMessages,
  sendMessage,
  markAsRead,
} = require('../controllers/chat.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

router.get('/conversations', authenticateUser, getConversations);
router.get('/users', authenticateUser, getChatUsers);
router.post('/conversations/direct', authenticateUser, getDirectConversation);
router.get('/conversations/:id/messages', authenticateUser, getMessages);
router.post('/messages', authenticateUser, sendMessage);
router.patch('/conversations/:id/read', authenticateUser, markAsRead);

module.exports = router;
