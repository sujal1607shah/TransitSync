const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema(
  {
    driverId: {
      type: String,
      required: true,
      unique: true,
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

module.exports = mongoose.model('Driver', DriverSchema);
