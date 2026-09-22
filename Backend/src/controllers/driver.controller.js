const Driver = require('../models/Driver');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Get drivers list
// @route   GET /api/drivers
// @access  Private
const getDrivers = async (req, res) => {
  try {
    const { status, available } = req.query;
    let query = {};

    if (status) query.status = status;
    if (available !== undefined) query.isAvailable = available === 'true';

    const drivers = await Driver.find(query).populate('assignedVehicle').populate('user', '-password');
    return successResponse(res, 200, 'Drivers retrieved', drivers);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get driver by ID
// @route   GET /api/drivers/:id
// @access  Private
const getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id).populate('assignedVehicle').populate('user', '-password');
    if (!driver) {
      return errorResponse(res, 404, 'Driver not found');
    }
    return successResponse(res, 200, 'Driver retrieved', driver);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Create new driver profile
// @route   POST /api/drivers
// @access  Private/Admin
const createDriver = async (req, res) => {
  try {
    const { name, phone, licenseNumber, driverId } = req.body;

    const generatedId = driverId || `DRV-${Math.floor(1000 + Math.random() * 9000)}`;

    let user = await User.create({
      name,
      email: `${generatedId.toLowerCase()}@transitsync.com`,
      password: 'password123',
      role: 'ROLE_DRIVER',
    });

    const driver = await Driver.create({
      driverId: generatedId,
      user: user._id,
      name,
      phone,
      licenseNumber,
    });

    return successResponse(res, 201, 'Driver created successfully', driver);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Update driver profile
// @route   PUT /api/drivers/:id
// @access  Private
const updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return successResponse(res, 200, 'Driver updated', driver);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Update driver status
// @route   PATCH /api/drivers/:id/status
// @access  Private
const updateDriverStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const driver = await Driver.findByIdAndUpdate(req.params.id, { status }, { new: true });
    return successResponse(res, 200, 'Driver status updated', driver);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Delete driver
// @route   DELETE /api/drivers/:id
// @access  Private/Admin
const deleteDriver = async (req, res) => {
  try {
    await Driver.findByIdAndDelete(req.params.id);
    return successResponse(res, 200, 'Driver deleted');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  updateDriverStatus,
  deleteDriver,
};
