const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema(
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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: '',
    },
    licenseNumber: {
      type: String,
      default: '',
    },
    licenseExpiry: {
      type: Date,
    },
    profileImage: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'ON_TRIP', 'IDLE', 'OFF_DUTY', 'SUSPENDED'],
      default: 'AVAILABLE',
    },
    safetyScore: {
      type: Number,
      default: 95,
    },
    assignedVehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    currentLocation: {
      latitude: { type: Number, default: 23.0225 },
      longitude: { type: Number, default: 72.5714 },
      address: { type: String, default: 'Ahmedabad Depot' },
      updatedAt: { type: Date, default: Date.now },
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    attendanceStatus: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'ON_LEAVE'],
      default: 'PRESENT',
    },
  },
  { timestamps: true }
);

DriverSchema.index({ organizationId: 1, driverId: 1 }, { unique: true });
DriverSchema.index({ organizationId: 1, status: 1 });
DriverSchema.index({ organizationId: 1, isAvailable: 1 });

module.exports = mongoose.model('Driver', DriverSchema);
