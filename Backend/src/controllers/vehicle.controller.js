const Vehicle = require('../models/Vehicle');
const Maintenance = require('../models/Maintenance');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Register / Create Vehicle
// @route   POST /api/vehicle/create or POST /api/vehicles
// @access  Private/Admin
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

    const generatedID = vehicleID || `VEH-${Math.floor(1000 + Math.random() * 9000)}`;

    const vehicle = await Vehicle.create({
      vehicleID: generatedID,
      registrationNumber: registrationNumber || `GJ01${Math.floor(1000 + Math.random() * 9000)}`,
      name: name || 'Fleet Vehicle',
      type: type || 'Truck',
      maxLoadCapacity: maxLoadCapacity || 5000,
      odometer: odometer || 0,
      acquisitionCost: acquisitionCost || 2500000,
      status: status || 'AVAILABLE',
    });

    return successResponse(res, 201, 'Vehicle registered successfully', vehicle);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get All Vehicles
// @route   GET /api/vehicle/ or GET /api/vehicles
// @access  Private
const getVehicles = async (req, res) => {
  try {
    const { status, type } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;

    const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });
    return successResponse(res, 200, 'Vehicles retrieved successfully', vehicles);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get Single Vehicle By ID
// @route   GET /api/vehicles/:id
// @access  Private
const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      $or: [{ _id: req.params.id }, { vehicleID: req.params.id }],
    });
    if (!vehicle) {
      return errorResponse(res, 404, 'Vehicle not found');
    }
    return successResponse(res, 200, 'Vehicle retrieved', vehicle);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Update Vehicle
// @route   PUT /api/vehicle/update/ or PUT /api/vehicles/:id
// @access  Private
const updateVehicle = async (req, res) => {
  try {
    const id = req.query.id || req.params.id;
    const vehicle = await Vehicle.findOneAndUpdate(
      { $or: [{ vehicleID: id }, { _id: id }] },
      req.body,
      { new: true }
    );
    if (!vehicle) {
      return errorResponse(res, 404, 'Vehicle not found');
    }
    return successResponse(res, 200, 'Vehicle updated successfully', vehicle);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Delete Vehicle
// @route   DELETE /api/vehicle/delete/ or DELETE /api/vehicles/:id
// @access  Private/Admin
const deleteVehicle = async (req, res) => {
  try {
    const id = req.query.id || req.params.id;
    await Vehicle.findOneAndDelete({ $or: [{ vehicleID: id }, { _id: id }] });
    return successResponse(res, 200, 'Vehicle deleted successfully');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get Vehicle Service History
// @route   GET /api/vehicles/:id/service-history
// @access  Private
const getServiceHistory = async (req, res) => {
  try {
    const history = await Maintenance.find({ vehicleID: req.params.id }).sort({ serviceDate: -1 });
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
