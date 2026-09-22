const Attendance = require('../models/Attendance');
const { verifyGeofence } = require('../services/geofence.service');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Geofence Check In
// @route   POST /api/attendance/check-in
// @access  Private
const checkIn = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user._id;
    const dateStr = new Date().toISOString().split('T')[0];

    // Check if already checked in today
    const existing = await Attendance.findOne({ user: userId, date: dateStr });
    if (existing && existing.checkInTime) {
      return errorResponse(res, 400, 'Already checked in for today');
    }

    const geofenceResult = verifyGeofence(latitude || 23.0225, longitude || 72.5714);

    const attendance = await Attendance.create({
      user: userId,
      date: dateStr,
      checkInTime: new Date(),
      checkInLocation: {
        latitude: latitude || 23.0225,
        longitude: longitude || 72.5714,
      },
      status: 'PRESENT',
      distanceFromGeofence: geofenceResult.distanceMeters,
      isInsideGeofence: geofenceResult.isInside,
    });

    return successResponse(res, 201, 'Check-in successful', attendance);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Geofence Check Out
// @route   POST /api/attendance/check-out
// @access  Private
const checkOut = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user._id;
    const dateStr = new Date().toISOString().split('T')[0];

    const attendance = await Attendance.findOne({ user: userId, date: dateStr });
    if (!attendance) {
      return errorResponse(res, 400, 'No check-in record found for today');
    }

    attendance.checkOutTime = new Date();
    attendance.checkOutLocation = {
      latitude: latitude || 23.0225,
      longitude: longitude || 72.5714,
    };
    await attendance.save();

    return successResponse(res, 200, 'Check-out successful', attendance);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get My Attendance History
// @route   GET /api/attendance/my
// @access  Private
const getMyAttendance = async (req, res) => {
  try {
    const list = await Attendance.find({ user: req.user._id }).sort({ date: -1 });
    return successResponse(res, 200, 'Attendance records retrieved', list);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get All Attendance Records (Admin / Dispatcher)
// @route   GET /api/attendance
// @access  Private/Dispatcher/Admin
const getAllAttendance = async (req, res) => {
  try {
    const list = await Attendance.find({}).populate('user', 'name email role').sort({ date: -1 });
    return successResponse(res, 200, 'All attendance records retrieved', list);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
};
