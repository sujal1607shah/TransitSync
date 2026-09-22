const Maintenance = require('../models/Maintenance');
const Vehicle = require('../models/Vehicle');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Get Maintenance Records
// @route   GET /api/maintenance
// @access  Private
const getMaintenance = async (req, res) => {
  try {
    const list = await Maintenance.find({}).sort({ serviceDate: -1 });
    return successResponse(res, 200, 'Maintenance logs retrieved', list);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Schedule Maintenance
// @route   POST /api/maintenance
// @access  Private/Admin/Dispatcher
const createMaintenance = async (req, res) => {
  try {
    const { vehicleID, maintenanceType, description, cost, odometer } = req.body;

    const maintenance = await Maintenance.create({
      vehicleID: vehicleID || 'GJ01AB1234',
      maintenanceType: maintenanceType || 'Routine Service',
      description: description || 'Scheduled 10,000 km check',
      cost: cost || 4500,
      odometer: odometer || 12000,
      createdBy: req.user._id,
      status: 'SCHEDULED',
    });

    if (vehicleID) {
      await Vehicle.findOneAndUpdate({ vehicleID }, { status: 'MAINTENANCE' });
    }

    return successResponse(res, 201, 'Maintenance scheduled successfully', maintenance);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getMaintenance,
  createMaintenance,
};
