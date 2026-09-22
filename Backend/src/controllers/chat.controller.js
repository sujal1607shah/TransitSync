const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Get All Chat Conversations for User
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    let conversations = await Conversation.find({ participants: currentUserId })
      .populate('participants', 'name role avatar isOnline')
      .sort({ lastMessageAt: -1 });

    return successResponse(res, 200, 'Conversations retrieved', conversations);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Create or Get Direct Conversation
// @route   POST /api/chat/conversations/direct
// @access  Private
const getDirectConversation = async (req, res) => {
  try {
    const currentUserId = String(req.user._id);
    const { userId } = req.body;

    if (!userId) return errorResponse(res, 400, 'User ID is required');
    if (currentUserId === String(userId)) return errorResponse(res, 400, 'Cannot create conversation with self');

    // Verify receiver exists
    const receiver = await User.findById(userId);
    if (!receiver) return errorResponse(res, 404, 'Target user not found');

    const participantKey = [currentUserId, String(userId)].sort().join('_');

    let conversation = await Conversation.findOne({ participantKey })
      .populate('participants', 'name role avatar isOnline');

    if (!conversation) {
      const conversationId = `conv_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      conversation = await Conversation.create({
        conversationId,
        participantKey,
        type: 'DIRECT',
        participants: [currentUserId, userId],
        unreadCount: {
          [currentUserId]: 0,
          [userId]: 0
        }
      });
      conversation = await conversation.populate('participants', 'name role avatar isOnline');
    }

    return successResponse(res, 200, 'Conversation fetched', conversation);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get Messages for a Conversation
// @route   GET /api/chat/conversations/:id/messages
// @access  Private
const getMessages = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const currentUserId = String(req.user._id);

    // Verify user is part of this conversation
    const conv = await Conversation.findOne({ conversationId });
    if (!conv) return errorResponse(res, 404, 'Conversation not found');
    
    const isParticipant = conv.participants.some(p => String(p) === currentUserId);
    if (!isParticipant) return errorResponse(res, 403, 'Not a participant of this conversation');

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversationId, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Reverse to get chronological order for frontend
    return successResponse(res, 200, 'Messages retrieved', messages.reverse());
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Send Message
// @route   POST /api/chat/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, mediaUri, mediaType } = req.body;
    const senderId = String(req.user._id);

    // Verify conversation
    const conv = await Conversation.findOne({ conversationId });
    if (!conv) return errorResponse(res, 404, 'Conversation not found');

    const isParticipant = conv.participants.some(p => String(p) === senderId);
    if (!isParticipant) return errorResponse(res, 403, 'Not a participant of this conversation');

    const msgId = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const message = await Message.create({
      messageId: msgId,
      conversationId: conversationId,
      senderId: senderId,
      senderName: req.user.name,
      content,
      mediaUri: mediaUri || '',
      mediaType: mediaType || 'TEXT',
      read: false,
    });

    // Update conversation lastMessage & unread count
    const unreadCount = conv.unreadCount || new Map();
    conv.participants.forEach(p => {
      const pid = String(p);
      if (pid !== senderId) {
        unreadCount.set(pid, (unreadCount.get(pid) || 0) + 1);
      }
    });

    conv.unreadCount = unreadCount;
    conv.lastMessage = content || (mediaUri ? 'Sent an attachment' : 'New message');
    conv.lastMessageAt = new Date();
    await conv.save();

    // Emit via Socket.IO
    const io = req.app.get('io');
    if (io) {
      // Send to the active conversation room (for those currently viewing the chat)
      io.to(`conversation:${conversationId}`).emit('message:new', message);
      
      // Also notify all participants in their private rooms (for chat list updates and notifications)
      conv.participants.forEach(p => {
        const pid = String(p);
        if (pid !== senderId) {
          io.to(`user:${pid}`).emit('message:new', message);
        }
      });
    }

    return successResponse(res, 201, 'Message sent successfully', message);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Mark Messages as Read
// @route   PATCH /api/chat/conversations/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const currentUserId = String(req.user._id);

    const conv = await Conversation.findOne({ conversationId });
    if (!conv) return errorResponse(res, 404, 'Conversation not found');

    const isParticipant = conv.participants.some(p => String(p) === currentUserId);
    if (!isParticipant) return errorResponse(res, 403, 'Not a participant of this conversation');

    // Mark messages as read
    await Message.updateMany(
      { conversationId, senderId: { $ne: currentUserId }, read: false },
      { read: true }
    );

    // Reset unread count
    if (conv.unreadCount && conv.unreadCount.has(currentUserId)) {
      conv.unreadCount.set(currentUserId, 0);
      await conv.save();
    }

    return successResponse(res, 200, 'Messages marked as read');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getConversations,
  getDirectConversation,
  getMessages,
  sendMessage,
  markAsRead,
};
