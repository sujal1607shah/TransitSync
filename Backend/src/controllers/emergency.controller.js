const Emergency = require('../models/Emergency');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Trigger Emergency SOS
// @route   POST /api/emergency/sos
// @access  Private
const triggerSOS = async (req, res) => {
  try {
    const { latitude, longitude, vehicleID, tripID, message } = req.body;
    const generatedId = `SOS-${Math.floor(1000 + Math.random() * 9000)}`;

    const emergency = await Emergency.create({
      emergencyId: generatedId,
      driverName: req.user.name || 'Alex Driver',
      vehicleID: vehicleID || 'GJ01AB1234',
      tripID: tripID || 'TRP-1045',
      latitude: latitude || 23.0225,
      longitude: longitude || 72.5714,
      location: 'SG Highway, Ahmedabad',
      message: message || 'Emergency SOS Signal Triggered by Driver',
      status: 'ACTIVE',
    });

    // Access Socket.IO server from app instance if available
    const io = req.app.get('io');
    if (io) {
      io.emit('emergency:sos', emergency);
      io.emit('emergency:new', emergency);
    }

    return successResponse(res, 201, 'Emergency SOS triggered successfully', emergency);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get All Emergency Records
// @route   GET /api/emergency
// @access  Private/Dispatcher/Admin
const getEmergencies = async (req, res) => {
  try {
    const list = await Emergency.find({}).sort({ createdAt: -1 });
    return successResponse(res, 200, 'Emergencies retrieved', list);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Acknowledge SOS
// @route   PATCH /api/emergency/:id/acknowledge
// @access  Private/Dispatcher/Admin
const acknowledgeSOS = async (req, res) => {
  try {
    const emergency = await Emergency.findOneAndUpdate(
      { $or: [{ emergencyId: req.params.id }, { _id: req.params.id }] },
      { status: 'ACKNOWLEDGED' },
      { new: true }
    );
    return successResponse(res, 200, 'SOS acknowledged', emergency);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Resolve SOS
// @route   PATCH /api/emergency/:id/resolve
// @access  Private/Dispatcher/Admin
const resolveSOS = async (req, res) => {
  try {
    const emergency = await Emergency.findOneAndUpdate(
      { $or: [{ emergencyId: req.params.id }, { _id: req.params.id }] },
      { status: 'RESOLVED', resolvedAt: new Date(), resolvedBy: req.user.name },
      { new: true }
    );
    return successResponse(res, 200, 'SOS resolved', emergency);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  triggerSOS,
  getEmergencies,
  acknowledgeSOS,
  resolveSOS,
};
