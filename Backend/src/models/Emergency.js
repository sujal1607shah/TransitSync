const mongoose = require('mongoose');

const EmergencySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    emergencyId: {
      type: String,
      required: true,
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

EmergencySchema.index({ organizationId: 1, emergencyId: 1 }, { unique: true });
EmergencySchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model('Emergency', EmergencySchema);
