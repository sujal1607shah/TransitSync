const Conversation = require('../models/Conversation');

module.exports = (io, socket) => {
  const currentUserId = String(socket.user.userId || socket.user._id);

  // Join personal user room on connect
  socket.join(`user:${currentUserId}`);
  console.log(`[Socket] User ${currentUserId} connected to their private room.`);

  // Join specific conversation room securely
  socket.on('chat:join', async (data) => {
    const room = data.conversationId;
    if (!room) return;

    try {
      const conv = await Conversation.findOne({ conversationId: room });
      if (!conv) return;

      const isParticipant = conv.participants.some(p => String(p) === currentUserId);
      if (isParticipant) {
        socket.join(`conversation:${room}`);
        console.log(`[Socket] User ${currentUserId} joined chat room: ${room}`);
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

  // Typing indicators
  socket.on('typing:start', async (data) => {
    const room = data.conversationId;
    if (!room) return;
    // Broadcast to everyone in the room except the sender
    socket.to(`conversation:${room}`).emit('typing:start', { conversationId: room, userId: currentUserId });
  });

  socket.on('typing:stop', (data) => {
    const room = data.conversationId;
    if (!room) return;
    socket.to(`conversation:${room}`).emit('typing:stop', { conversationId: room, userId: currentUserId });
  });

  // Note: message:send is primarily handled via REST API (/api/chat/messages).
  // When a message is successfully saved via the API, the API controller can emit to Socket.IO.
  // Alternatively, if the frontend emits 'message:send', we can route it here, but saving it to DB is preferred first.
  socket.on('message:new_local', (messageData) => {
    const room = messageData.conversationId;
    const receiverId = messageData.receiverId; // For private notification to receiver

    if (room) {
      // Send to the active conversation room
      socket.to(`conversation:${room}`).emit('message:new', messageData);
      
      // Also send to the receiver's private user room in case they are online but not in the conversation room!
      if (receiverId) {
        socket.to(`user:${receiverId}`).emit('message:new', messageData);
      }
    }
  });
};
