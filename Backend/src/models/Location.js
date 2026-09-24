const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    driverId: {
      type: String,
      required: true,
      index: true,
    },
    driverName: {
      type: String,
      default: '',
    },
    tripID: {
      type: String,
      default: '',
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    accuracy: {
      type: Number,
      default: 5,
    },
    speed: {
      type: Number,
      default: 0,
    },
    heading: {
      type: Number,
      default: 0,
    },
    address: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

LocationSchema.index({ organizationId: 1, driverId: 1, createdAt: -1 });
LocationSchema.index({ organizationId: 1, tripID: 1 });

module.exports = mongoose.model('Location', LocationSchema);
