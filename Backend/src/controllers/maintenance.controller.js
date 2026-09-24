const Maintenance = require('../models/Maintenance');
const Vehicle = require('../models/Vehicle');
const AuditLog = require('../models/AuditLog');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Get Maintenance Records for Caller's Organization
// @route   GET /api/maintenance
// @access  Private
const getMaintenance = async (req, res) => {
  try {
    const list = await Maintenance.find({ organizationId: req.user.organizationId }).sort({ serviceDate: -1 });
    return successResponse(res, 200, 'Maintenance logs retrieved', list);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Schedule Maintenance in Caller's Organization
// @route   POST /api/maintenance
// @access  Private/Admin/Dispatcher
const createMaintenance = async (req, res) => {
  try {
    const { vehicleID, maintenanceType, description, cost, odometer } = req.body;
    const orgId = req.user.organizationId;

    if (vehicleID) {
      const vehicle = await Vehicle.findOne({
        $or: [{ vehicleID }, { registrationNumber: vehicleID }, { _id: vehicleID.match(/^[0-9a-fA-F]{24}$/) ? vehicleID : null }],
        organizationId: orgId,
      });

      if (!vehicle) {
        return errorResponse(res, 400, 'Target vehicle does not belong to your organization');
      }

      await Vehicle.findOneAndUpdate({ _id: vehicle._id }, { status: 'MAINTENANCE' });
    }

    const maintenance = await Maintenance.create({
      organizationId: orgId,
      vehicleID: vehicleID || 'GJ01AB1234',
      maintenanceType: maintenanceType || 'Routine Service',
      description: description || 'Scheduled 10,000 km check',
      cost: cost || 4500,
      odometer: odometer || 12000,
      createdBy: req.user._id,
      status: 'SCHEDULED',
    });

    await AuditLog.create({
      organizationId: orgId,
      userId: req.user._id,
      action: 'MAINTENANCE_SCHEDULED',
      resource: 'Maintenance',
      resourceId: maintenance._id.toString(),
      details: { vehicleID: maintenance.vehicleID, cost: maintenance.cost },
    });

    return successResponse(res, 201, 'Maintenance scheduled successfully', maintenance);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getMaintenance,
  createMaintenance,
};
