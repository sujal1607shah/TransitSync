const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const Issue = require('../models/Issue');
const Expense = require('../models/Expense');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Admin Dashboard Analytics (Scoped strictly to Caller's Organization)
// @route   GET /api/dashboard/admin
// @access  Private/Admin
const getAdminDashboard = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const orgMatch = { organizationId: orgId };

    const totalVehicles = await Vehicle.countDocuments(orgMatch);
    const activeVehicles = await Vehicle.countDocuments({ ...orgMatch, status: { $in: ['ON_TRIP', 'On Trip'] } });
    const availableVehicles = await Vehicle.countDocuments({ ...orgMatch, status: { $in: ['AVAILABLE', 'Available'] } });
    const inMaintenance = await Vehicle.countDocuments({ ...orgMatch, status: { $in: ['MAINTENANCE', 'Maintenance', 'IN_SHOP'] } });

    const totalDrivers = await Driver.countDocuments(orgMatch);
    const activeDrivers = await Driver.countDocuments({ ...orgMatch, status: 'ON_TRIP' });

    const totalTrips = await Trip.countDocuments(orgMatch);
    const activeTrips = await Trip.countDocuments({ ...orgMatch, status: { $in: ['DISPATCHED', 'ON TRIP', 'In Progress'] } });
    const completedTrips = await Trip.countDocuments({ ...orgMatch, status: 'COMPLETED' });
    const delayedTrips = await Trip.countDocuments({ ...orgMatch, status: 'DELAYED' });

    const incidents = await Issue.countDocuments({ ...orgMatch, category: { $in: ['INCIDENT_REPORT', 'Accident Report'] } });
    const maintenanceDue = inMaintenance;

    const expenses = await Expense.find(orgMatch);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const utilization = totalVehicles > 0 ? Math.round(((activeVehicles + inMaintenance) / totalVehicles) * 100) : 0;

    return successResponse(res, 200, 'Admin dashboard metrics retrieved', {
      totalVehicles,
      activeVehicles,
      vehiclesOnTrip: activeVehicles,
      availableVehicles,
      totalDrivers,
      activeDrivers,
      todayTrips: totalTrips,
      completedTrips,
      activeTrips,
      delayedTrips,
      incidents,
      maintenanceDue,
      utilization: `${utilization}%`,
      totalExpenses,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Dispatcher Dashboard (Scoped strictly to Caller's Organization)
// @route   GET /api/dashboard/dispatcher
// @access  Private/Dispatcher/Admin
const getDispatcherDashboard = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const orgMatch = { organizationId: orgId };

    const activeTrips = await Trip.find({ ...orgMatch, status: { $in: ['DISPATCHED', 'ON TRIP', 'In Progress', 'CREATED'] } });
    const availableDrivers = await Driver.find({ ...orgMatch, isAvailable: true });
    const availableVehicles = await Vehicle.find({ ...orgMatch, status: { $in: ['AVAILABLE', 'Available'] } });

    return successResponse(res, 200, 'Dispatcher dashboard metrics retrieved', {
      activeTripsCount: activeTrips.length,
      availableDriversCount: availableDrivers.length,
      availableVehiclesCount: availableVehicles.length,
      activeTrips,
      availableDrivers,
      availableVehicles,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Driver Dashboard (Scoped strictly to Caller's Organization)
// @route   GET /api/dashboard/driver
// @access  Private
const getDriverDashboard = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const orgMatch = { organizationId: orgId };

    const todayTrip = await Trip.findOne({
      ...orgMatch,
      $or: [{ driver: req.user._id }, { driverID: req.user.driverID }],
      status: { $in: ['DISPATCHED', 'ON TRIP', 'CREATED', 'In Progress'] },
    });

    const latestIssue = await Issue.findOne({
      ...orgMatch,
      reportedBy: req.user._id,
    }).sort({ createdAt: -1 });

    return successResponse(res, 200, 'Driver dashboard data retrieved', {
      greeting: `Good Morning, ${req.user.name || 'Driver'}`,
      dutyStatus: todayTrip ? 'On Duty' : 'Available',
      todayTrip: todayTrip || null,
      latestIssue,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Fleet Analytics (Scoped strictly to Caller's Organization)
// @route   GET /api/analytics/fleet
// @access  Private/Admin
const getFleetAnalytics = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const orgMatch = { organizationId: orgId };

    const totalVehicles = await Vehicle.countDocuments(orgMatch);
    const totalDrivers = await Driver.countDocuments(orgMatch);
    const totalTrips = await Trip.countDocuments(orgMatch);
    const expenses = await Expense.find(orgMatch);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    return successResponse(res, 200, 'Fleet analytics retrieved', {
      totalVehicles,
      totalDrivers,
      totalTrips,
      totalExpenses,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getAdminDashboard,
  getDispatcherDashboard,
  getDriverDashboard,
  getFleetAnalytics,
};
