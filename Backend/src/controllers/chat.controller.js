const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Get All Chat Conversations for User in Current Organization
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const orgId = req.user.organizationId;

    let conversations = await Conversation.find({
      organizationId: orgId,
      participants: currentUserId,
    })
      .populate('participants', 'name role avatar isOnline')
      .sort({ lastMessageAt: -1 });

    return successResponse(res, 200, 'Conversations retrieved', conversations);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get Available Chat Users (Scoped strictly to Organization, excluding self)
// @route   GET /api/chat/users
// @access  Private
const getChatUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const orgId = req.user.organizationId;
    const { search } = req.query;

    let query = {
      organizationId: orgId,
      _id: { $ne: currentUserId },
      isActive: true,
    };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const users = await User.find(query)
      .select('name email role avatar isOnline lastSeen driverID')
      .sort({ name: 1 });

    return successResponse(res, 200, 'Organization chat users retrieved', users);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Create or Get Direct Conversation (Scoped strictly to Organization)
// @route   POST /api/chat/conversations/direct
// @access  Private
const getDirectConversation = async (req, res) => {
  try {
    const currentUserId = String(req.user._id);
    const orgId = req.user.organizationId;
    const { userId } = req.body;

    if (!userId) return errorResponse(res, 400, 'User ID is required');
    if (currentUserId === String(userId)) return errorResponse(res, 400, 'Cannot create conversation with self');

    // Verify receiver exists in the SAME organization
    const receiver = await User.findOne({ _id: userId, organizationId: orgId });
    if (!receiver) return errorResponse(res, 404, 'Target user not found in your organization');

    const participantKey = [currentUserId, String(userId)].sort().join('_');

    let conversation = await Conversation.findOne({
      organizationId: orgId,
      participantKey,
    }).populate('participants', 'name role avatar isOnline');

    if (!conversation) {
      const conversationId = `conv_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      conversation = await Conversation.create({
        organizationId: orgId,
        conversationId,
        participantKey,
        type: 'DIRECT',
        participants: [currentUserId, userId],
        unreadCount: {
          [currentUserId]: 0,
          [userId]: 0,
        },
      });
      conversation = await conversation.populate('participants', 'name role avatar isOnline');
    }

    return successResponse(res, 200, 'Conversation fetched', conversation);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get Messages for a Conversation (Scoped strictly to Organization)
// @route   GET /api/chat/conversations/:id/messages
// @access  Private
const getMessages = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const currentUserId = String(req.user._id);
    const orgId = req.user.organizationId;

    // Verify conversation belongs to caller's org and user is a participant
    const conv = await Conversation.findOne({
      conversationId,
      organizationId: orgId,
    });
    if (!conv) return errorResponse(res, 404, 'Conversation not found in your organization');

    const isParticipant = conv.participants.some((p) => String(p) === currentUserId);
    if (!isParticipant) return errorResponse(res, 403, 'Not a participant of this conversation');

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      organizationId: orgId,
      conversationId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Reverse to get chronological order for frontend
    return successResponse(res, 200, 'Messages retrieved', messages.reverse());
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Send Message (Scoped strictly to Organization)
// @route   POST /api/chat/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const senderId = String(req.user._id);
    const orgId = req.user.organizationId;
    const {
      conversationId,
      content,
      receiverId,
      messageType,
      fileUrl,
      mediaUri,
      mediaType,
    } = req.body;

    if (!conversationId || (!content && !fileUrl && !mediaUri)) {
      return errorResponse(res, 400, 'Conversation ID and content/media are required');
    }

    // Verify conversation exists in same org and sender is participant
    const conv = await Conversation.findOne({
      conversationId,
      organizationId: orgId,
    });
    if (!conv) return errorResponse(res, 404, 'Conversation not found in your organization');

    const isParticipant = conv.participants.some((p) => String(p) === senderId);
    if (!isParticipant) return errorResponse(res, 403, 'Forbidden: You are not a participant in this conversation');

    const messageId = `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const message = await Message.create({
      organizationId: orgId,
      messageId,
      conversationId,
      senderId,
      senderName: req.user.name,
      receiverId: receiverId || '',
      messageType: messageType || (mediaType ? mediaType.toUpperCase() : 'TEXT'),
      content: content || (mediaType ? `[${mediaType.toUpperCase()}]` : 'Media attachment'),
      fileUrl: fileUrl || '',
      mediaUri: mediaUri || '',
      mediaType: mediaType || '',
      read: false,
    });

    // Update conversation lastMessage
    conv.lastMessage = content || `[${message.messageType}]`;
    conv.lastMessageAt = new Date();

    // Increment unread count for other participants
    conv.participants.forEach((p) => {
      const pid = String(p);
      if (pid !== senderId) {
        const currentCount = conv.unreadCount.get(pid) || 0;
        conv.unreadCount.set(pid, currentCount + 1);
      }
    });

    await conv.save();

    // Socket broadcast scoped to conversation room
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${conversationId}`).emit('message:new', message);
      if (receiverId) {
        io.to(`user:${receiverId}`).emit('message:new', message);
      }
    }

    return successResponse(res, 201, 'Message sent', message);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Mark Conversation as Read (Scoped strictly to Organization)
// @route   PATCH /api/chat/conversations/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const currentUserId = String(req.user._id);
    const orgId = req.user.organizationId;

    const conv = await Conversation.findOne({
      conversationId,
      organizationId: orgId,
    });
    if (!conv) return errorResponse(res, 404, 'Conversation not found in your organization');

    conv.unreadCount.set(currentUserId, 0);
    await conv.save();

    await Message.updateMany(
      {
        organizationId: orgId,
        conversationId,
        senderId: { $ne: currentUserId },
        read: false,
      },
      { read: true }
    );

    return successResponse(res, 200, 'Conversation marked as read');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getConversations,
  getChatUsers,
  getDirectConversation,
  getMessages,
  sendMessage,
  markAsRead,
};
