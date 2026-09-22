const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    checkInTime: {
      type: Date,
      default: Date.now,
    },
    checkOutTime: {
      type: Date,
    },
    checkInLocation: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    checkOutLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'LATE', 'ON_LEAVE'],
      default: 'PRESENT',
    },
    distanceFromGeofence: {
      type: Number, // meters
      default: 0,
    },
    isInsideGeofence: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attendance', AttendanceSchema);
