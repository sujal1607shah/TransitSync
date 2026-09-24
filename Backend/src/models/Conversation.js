const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    participantKey: {
      type: String,
      sparse: true, // Unique per org
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

ConversationSchema.index({ organizationId: 1, conversationId: 1 }, { unique: true });
ConversationSchema.index({ organizationId: 1, participantKey: 1 }, { unique: true, sparse: true });
ConversationSchema.index({ organizationId: 1, participants: 1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
