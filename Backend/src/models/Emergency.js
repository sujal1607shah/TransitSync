const mongoose = require('mongoose');

const EmergencySchema = new mongoose.Schema(
  {
    emergencyId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    driverName: {
      type: String,
      required: true,
    },
    vehicleID: {
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
    location: {
      type: String,
      default: 'Highway Corridor',
    },
    message: {
      type: String,
      default: 'Emergency SOS Signal Triggered',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Emergency', EmergencySchema);
