const Location = require('../models/Location');
const Driver = require('../models/Driver');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Update Driver Location
// @route   POST /api/location/update
// @access  Private
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, accuracy, speed, heading, tripID } = req.body;
    const orgId = req.user.organizationId;

    const loc = await Location.create({
      organizationId: orgId,
      driverId: req.user._id.toString(),
      driverName: req.user.name,
      tripID: tripID || '',
      latitude,
      longitude,
      accuracy: accuracy || 5,
      speed: speed || 0,
      heading: heading || 0,
    });

    await Driver.findOneAndUpdate(
      { user: req.user._id, organizationId: orgId },
      { currentLocation: { latitude, longitude, updatedAt: new Date() } }
    );

    const io = req.app.get('io');
    if (io) {
      // Broadcast strictly to this organization's room
      io.to(`organization:${orgId}`).emit('driver:location:update', {
        driverId: req.user._id.toString(),
        driverName: req.user.name,
        latitude,
        longitude,
        speed,
        heading,
        tripID,
      });

      if (tripID) {
        io.to(`organization:${orgId}:trip:${tripID}`).emit('trip:location:update', {
          driverId: req.user._id.toString(),
          latitude,
          longitude,
          speed,
          heading,
          tripID,
        });
      }
    }

    return successResponse(res, 200, 'Location updated', loc);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get Latest Location for Driver (Scoped to Organization)
// @route   GET /api/location/driver/:driverId
// @access  Private
const getDriverLocation = async (req, res) => {
  try {
    const loc = await Location.findOne({
      driverId: req.params.driverId,
      organizationId: req.user.organizationId,
    }).sort({ createdAt: -1 });

    return successResponse(res, 200, 'Driver location retrieved', loc);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get Fleet Live Locations (Scoped to Organization)
// @route   GET /api/location/fleet
// @access  Private
const getFleetLocations = async (req, res) => {
  try {
    const drivers = await Driver.find({ organizationId: req.user.organizationId }).select('name driverId currentLocation status');
    return successResponse(res, 200, 'Fleet locations retrieved', drivers);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  updateLocation,
  getDriverLocation,
  getFleetLocations,
};
