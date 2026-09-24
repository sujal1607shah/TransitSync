const Emergency = require('../models/Emergency');
const AuditLog = require('../models/AuditLog');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Trigger Emergency SOS in Caller's Organization
// @route   POST /api/emergency/sos
// @access  Private
const triggerSOS = async (req, res) => {
  try {
    const { latitude, longitude, vehicleID, tripID, message } = req.body;
    const orgId = req.user.organizationId;
    const generatedId = `SOS-${Math.floor(1000 + Math.random() * 9000)}`;

    const emergency = await Emergency.create({
      organizationId: orgId,
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

    await AuditLog.create({
      organizationId: orgId,
      userId: req.user._id,
      action: 'SOS_TRIGGERED',
      resource: 'Emergency',
      resourceId: emergency._id.toString(),
      details: { emergencyId: emergency.emergencyId, driverName: emergency.driverName },
    });

    // Access Socket.IO server from app instance - broadcast ONLY to this organization's room
    const io = req.app.get('io');
    if (io) {
      io.to(`organization:${orgId}`).emit('emergency:sos', emergency);
      io.to(`organization:${orgId}`).emit('emergency:new', emergency);
    }

    return successResponse(res, 201, 'Emergency SOS triggered successfully', emergency);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get All Emergency Records for Caller's Organization
// @route   GET /api/emergency
// @access  Private/Dispatcher/Admin
const getEmergencies = async (req, res) => {
  try {
    const list = await Emergency.find({ organizationId: req.user.organizationId }).sort({ createdAt: -1 });
    return successResponse(res, 200, 'Emergencies retrieved', list);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Acknowledge SOS (Scoped to Organization)
// @route   PATCH /api/emergency/:id/acknowledge
// @access  Private/Dispatcher/Admin
const acknowledgeSOS = async (req, res) => {
  try {
    const emergency = await Emergency.findOneAndUpdate(
      {
        $or: [{ emergencyId: req.params.id }, { _id: req.params.id }],
        organizationId: req.user.organizationId,
      },
      { status: 'ACKNOWLEDGED' },
      { new: true }
    );

    if (!emergency) {
      return errorResponse(res, 404, 'Emergency record not found in your organization');
    }

    return successResponse(res, 200, 'SOS acknowledged', emergency);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Resolve SOS (Scoped to Organization)
// @route   PATCH /api/emergency/:id/resolve
// @access  Private/Dispatcher/Admin
const resolveSOS = async (req, res) => {
  try {
    const emergency = await Emergency.findOneAndUpdate(
      {
        $or: [{ emergencyId: req.params.id }, { _id: req.params.id }],
        organizationId: req.user.organizationId,
      },
      { status: 'RESOLVED', resolvedAt: new Date(), resolvedBy: req.user.name },
      { new: true }
    );

    if (!emergency) {
      return errorResponse(res, 404, 'Emergency record not found in your organization');
    }

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
