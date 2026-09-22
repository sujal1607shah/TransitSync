const Location = require('../models/Location');
const Driver = require('../models/Driver');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Update Driver Location
// @route   POST /api/location/update
// @access  Private
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, accuracy, speed, heading, tripID } = req.body;

    const loc = await Location.create({
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
      { user: req.user._id },
      { currentLocation: { latitude, longitude, updatedAt: new Date() } }
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('driver:location:update', {
        driverId: req.user._id.toString(),
        driverName: req.user.name,
        latitude,
        longitude,
        speed,
        heading,
      });
    }

    return successResponse(res, 200, 'Location updated', loc);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get Latest Location for Driver
// @route   GET /api/location/driver/:driverId
// @access  Private
const getDriverLocation = async (req, res) => {
  try {
    const loc = await Location.findOne({ driverId: req.params.driverId }).sort({ createdAt: -1 });
    return successResponse(res, 200, 'Driver location retrieved', loc);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get Fleet Live Locations
// @route   GET /api/location/fleet
// @access  Private
const getFleetLocations = async (req, res) => {
  try {
    const drivers = await Driver.find({}).select('name driverId currentLocation status');
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
