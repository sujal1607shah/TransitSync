const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const Maintenance = require('../models/Maintenance');
const AuditLog = require('../models/AuditLog');
const { successResponse, errorResponse } = require('../utils/response');

// Helper to construct query for vehicle ID or ObjectID
const buildVehicleIdQuery = (id, orgId) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
  const conditions = [{ vehicleID: id }];
  if (isObjectId) {
    conditions.push({ _id: new mongoose.Types.ObjectId(id) });
  }
  return {
    $or: conditions,
    organizationId: orgId,
  };
};

// @desc    Register / Create Vehicle in Caller's Organization
// @route   POST /api/vehicle/create or POST /api/vehicles
// @access  Private/Admin/Dispatcher
const createVehicle = async (req, res) => {
  try {
    const {
      vehicleID,
      registrationNumber,
      name,
      type,
      maxLoadCapacity,
      odometer,
      acquisitionCost,
      status,
    } = req.body;

    const orgId = req.user.organizationId;
    const generatedID = vehicleID || `VEH-${Math.floor(1000 + Math.random() * 9000)}`;
    const regNum = registrationNumber || `GJ01${Math.floor(1000 + Math.random() * 9000)}`;

    // Check duplicate in this organization
    const existingVehicle = await Vehicle.findOne({
      organizationId: orgId,
      $or: [{ vehicleID: generatedID }, { registrationNumber: regNum }],
    });

    if (existingVehicle) {
      return errorResponse(res, 400, 'Vehicle with this ID or Registration already exists in your organization');
    }

    const vehicle = await Vehicle.create({
      organizationId: orgId,
      vehicleID: generatedID,
      registrationNumber: regNum,
      name: name || 'Fleet Vehicle',
      type: type || 'Truck',
      maxLoadCapacity: maxLoadCapacity || 5000,
      odometer: odometer || 0,
      acquisitionCost: acquisitionCost || 2500000,
      status: status || 'AVAILABLE',
    });

    await AuditLog.create({
      organizationId: orgId,
      userId: req.user._id,
      action: 'VEHICLE_CREATED',
      resource: 'Vehicle',
      resourceId: vehicle._id.toString(),
      details: { vehicleID: vehicle.vehicleID, regNum: vehicle.registrationNumber },
    });

    return successResponse(res, 201, 'Vehicle registered successfully', vehicle);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get All Vehicles for Caller's Organization
// @route   GET /api/vehicle/ or GET /api/vehicles
// @access  Private
const getVehicles = async (req, res) => {
  try {
    const { status, type } = req.query;
    let filter = { organizationId: req.user.organizationId };

    if (status) filter.status = status;
    if (type) filter.type = type;

    const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });
    return successResponse(res, 200, 'Vehicles retrieved successfully', vehicles);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get Single Vehicle By ID (Scoped to Organization)
// @route   GET /api/vehicles/:id
// @access  Private
const getVehicleById = async (req, res) => {
  try {
    const query = buildVehicleIdQuery(req.params.id, req.user.organizationId);
    const vehicle = await Vehicle.findOne(query);

    if (!vehicle) {
      return errorResponse(res, 404, 'Vehicle not found in your organization');
    }
    return successResponse(res, 200, 'Vehicle retrieved', vehicle);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Update Vehicle (Scoped to Organization)
// @route   PUT /api/vehicle/update/ or PUT /api/vehicles/:id
// @access  Private
const updateVehicle = async (req, res) => {
  try {
    const id = req.query.id || req.params.id;
    const { organizationId, ...updateData } = req.body;
    const query = buildVehicleIdQuery(id, req.user.organizationId);

    const vehicle = await Vehicle.findOneAndUpdate(query, updateData, { new: true });

    if (!vehicle) {
      return errorResponse(res, 404, 'Vehicle not found in your organization');
    }
    return successResponse(res, 200, 'Vehicle updated successfully', vehicle);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Delete Vehicle (Scoped to Organization)
// @route   DELETE /api/vehicle/delete/ or DELETE /api/vehicles/:id
// @access  Private/Admin
const deleteVehicle = async (req, res) => {
  try {
    const id = req.query.id || req.params.id;
    const query = buildVehicleIdQuery(id, req.user.organizationId);
    const vehicle = await Vehicle.findOneAndDelete(query);

    if (!vehicle) {
      return errorResponse(res, 404, 'Vehicle not found in your organization');
    }

    return successResponse(res, 200, 'Vehicle deleted successfully');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get Vehicle Service History (Scoped to Organization)
// @route   GET /api/vehicles/:id/service-history
// @access  Private
const getServiceHistory = async (req, res) => {
  try {
    const history = await Maintenance.find({
      vehicleID: req.params.id,
      organizationId: req.user.organizationId,
    }).sort({ serviceDate: -1 });

    return successResponse(res, 200, 'Service history retrieved', history);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getServiceHistory,
};
