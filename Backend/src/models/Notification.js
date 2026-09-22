const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'TRIP_ASSIGNED',
        'TRIP_UPDATED',
        'TRIP_DELAYED',
        'MESSAGE',
        'ISSUE_CREATED',
        'ISSUE_UPDATED',
        'POD_SUBMITTED',
        'SOS',
        'MAINTENANCE',
        'ATTENDANCE',
      ],
      default: 'TRIP_ASSIGNED',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: Object,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', NotificationSchema);
