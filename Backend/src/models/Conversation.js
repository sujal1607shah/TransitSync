const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    participantKey: {
      type: String,
      unique: true,
      sparse: true, // Only for direct chats
      index: true,
    },
    type: {
      type: String,
      enum: ['DIRECT', 'GROUP', 'TEAM'],
      default: 'DIRECT',
    },
    name: {
      type: String,
      default: '',
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
    lastMessage: {
      type: String,
      default: '',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', ConversationSchema);
