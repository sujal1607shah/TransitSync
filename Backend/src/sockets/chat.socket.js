const Conversation = require('../models/Conversation');

module.exports = (io, socket) => {
  const currentUserId = String(socket.userId);
  const currentOrgId = String(socket.organizationId);

  // Join specific conversation room securely (verify same organization + participant)
  socket.on('chat:join', async (data) => {
    const room = data.conversationId;
    if (!room) return;

    try {
      const conv = await Conversation.findOne({
        conversationId: room,
        organizationId: currentOrgId,
      });

      if (!conv) {
        console.warn(`[Socket Security] Denied join to non-org conversation ${room} for user ${currentUserId}`);
        return;
      }

      const isParticipant = conv.participants.some((p) => String(p) === currentUserId);
      if (isParticipant) {
        socket.join(`conversation:${room}`);
        console.log(`[Socket] User ${currentUserId} joined chat room: ${room} (Org: ${currentOrgId})`);
      }
    } catch (err) {
      console.error('Error joining chat room:', err);
    }
  });

  socket.on('chat:leave', (data) => {
    const room = data.conversationId;
    if (room) {
      socket.leave(`conversation:${room}`);
      console.log(`[Socket] User ${currentUserId} left chat room: ${room}`);
    }
  });

  // Typing indicators scoped strictly to conversation room
  socket.on('typing:start', async (data) => {
    const room = data.conversationId;
    if (!room) return;
    socket.to(`conversation:${room}`).emit('typing:start', { conversationId: room, userId: currentUserId });
  });

  socket.on('typing:stop', (data) => {
    const room = data.conversationId;
    if (!room) return;
    socket.to(`conversation:${room}`).emit('typing:stop', { conversationId: room, userId: currentUserId });
  });

  // Local message pass-through (if used instead of REST API)
  socket.on('message:new_local', (messageData) => {
    const room = messageData.conversationId;
    const receiverId = messageData.receiverId;

    if (room) {
      socket.to(`conversation:${room}`).emit('message:new', messageData);
      if (receiverId) {
        socket.to(`user:${receiverId}`).emit('message:new', messageData);
      }
    }
  });
};
