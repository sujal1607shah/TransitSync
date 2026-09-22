const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      default: '',
    },
    receiverId: {
      type: String,
      default: '',
    },
    messageType: {
      type: String,
      enum: ['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO', 'LOCATION', 'SYSTEM'],
      default: 'TEXT',
    },
    content: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      default: '',
    },
    mediaUri: {
      type: String,
      default: '',
    },
    mediaType: {
      type: String,
      default: '',
    },
    read: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', MessageSchema);
