const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    messageId: {
      type: String,
      required: true,
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

MessageSchema.index({ organizationId: 1, messageId: 1 }, { unique: true });
MessageSchema.index({ organizationId: 1, conversationId: 1 });
MessageSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);
