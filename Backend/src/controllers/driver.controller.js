const mongoose = require('mongoose');
const Driver = require('../models/Driver');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { successResponse, errorResponse } = require('../utils/response');

const buildDriverIdQuery = (id, orgId) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
  const conditions = [{ driverId: id }];
  if (isObjectId) {
    conditions.push({ _id: new mongoose.Types.ObjectId(id) });
  }
  return {
    $or: conditions,
    organizationId: orgId,
  };
};

// @desc    Get drivers list for caller's organization
// @route   GET /api/drivers
// @access  Private
const getDrivers = async (req, res) => {
  try {
    const { status, available } = req.query;
    let query = { organizationId: req.user.organizationId };

    if (status) query.status = status;
    if (available !== undefined) query.isAvailable = available === 'true';

    const drivers = await Driver.find(query).populate('assignedVehicle').populate('user', '-password');
    return successResponse(res, 200, 'Drivers retrieved', drivers);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get driver by ID (Scoped to Organization)
// @route   GET /api/drivers/:id
// @access  Private
const getDriverById = async (req, res) => {
  try {
    const query = buildDriverIdQuery(req.params.id, req.user.organizationId);
    const driver = await Driver.findOne(query)
      .populate('assignedVehicle')
      .populate('user', '-password');

    if (!driver) {
      return errorResponse(res, 404, 'Driver not found in your organization');
    }
    return successResponse(res, 200, 'Driver retrieved', driver);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Create new driver profile in caller's organization
// @route   POST /api/drivers
// @access  Private/Admin/Dispatcher
const createDriver = async (req, res) => {
  try {
    const { name, phone, licenseNumber, driverId } = req.body;
    const orgId = req.user.organizationId;

    const generatedId = driverId || `DRV-${Math.floor(1000 + Math.random() * 9000)}`;

    const user = await User.create({
      organizationId: orgId,
      name,
      email: `${generatedId.toLowerCase()}@transitsync.com`,
      password: 'password123',
      phone: phone || '',
      role: 'ROLE_DRIVER',
      licenseNo: licenseNumber || '',
      driverID: generatedId,
    });

    const driver = await Driver.create({
      organizationId: orgId,
      driverId: generatedId,
      user: user._id,
      name,
      phone,
      licenseNumber,
    });

    await AuditLog.create({
      organizationId: orgId,
      userId: req.user._id,
      action: 'DRIVER_CREATED',
      resource: 'Driver',
      resourceId: driver._id.toString(),
      details: { driverId: driver.driverId, name: driver.name },
    });

    return successResponse(res, 201, 'Driver created successfully', driver);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Update driver profile (Scoped to Organization)
// @route   PUT /api/drivers/:id
// @access  Private
const updateDriver = async (req, res) => {
  try {
    const { organizationId, ...updateData } = req.body;
    const query = buildDriverIdQuery(req.params.id, req.user.organizationId);

    const driver = await Driver.findOneAndUpdate(query, updateData, { new: true });

    if (!driver) {
      return errorResponse(res, 404, 'Driver not found in your organization');
    }
    return successResponse(res, 200, 'Driver updated', driver);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Update driver status (Scoped to Organization)
// @route   PATCH /api/drivers/:id/status
// @access  Private
const updateDriverStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const query = buildDriverIdQuery(req.params.id, req.user.organizationId);

    const driver = await Driver.findOneAndUpdate(query, { status }, { new: true });

    if (!driver) {
      return errorResponse(res, 404, 'Driver not found in your organization');
    }

    return successResponse(res, 200, 'Driver status updated', driver);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Delete driver (Scoped to Organization)
// @route   DELETE /api/drivers/:id
// @access  Private/Admin
const deleteDriver = async (req, res) => {
  try {
    const query = buildDriverIdQuery(req.params.id, req.user.organizationId);
    const driver = await Driver.findOneAndDelete(query);

    if (!driver) {
      return errorResponse(res, 404, 'Driver not found in your organization');
    }

    await User.findOneAndDelete({ _id: driver.user, organizationId: req.user.organizationId });

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
