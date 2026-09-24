const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const AuditLog = require('../models/AuditLog');
const { successResponse, errorResponse } = require('../utils/response');

const buildTripIdQuery = (id, orgId) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
  const conditions = [{ tripID: id }];
  if (isObjectId) {
    conditions.push({ _id: new mongoose.Types.ObjectId(id) });
  }
  return {
    $or: conditions,
    organizationId: orgId,
  };
};

// @desc    Register / Create Trip in Caller's Organization
// @route   POST /api/trip/create or POST /api/trips
// @access  Private/Dispatcher/Admin
const createTrip = async (req, res) => {
  try {
    const {
      tripID,
      source,
      destination,
      vehicleID,
      driverID,
      cargoWeight,
      plannedDistance,
      startingOdometer,
      finalOdometer,
      fuelConsumed,
      status,
    } = req.body;

    const orgId = req.user.organizationId;
    const generatedID = tripID || `TRP-${Math.floor(1000 + Math.random() * 9000)}`;

    // Verify driver belongs to caller's organization if provided
    let driverDoc = null;
    if (driverID) {
      const isDriverObjId = mongoose.Types.ObjectId.isValid(driverID) && /^[0-9a-fA-F]{24}$/.test(driverID);
      const conds = [{ driverId: driverID }];
      if (isDriverObjId) conds.push({ _id: new mongoose.Types.ObjectId(driverID) });

      driverDoc = await Driver.findOne({
        $or: conds,
        organizationId: orgId,
      });
      if (!driverDoc) {
        return errorResponse(res, 400, 'Assigned driver does not belong to your organization');
      }
    }

    // Verify vehicle belongs to caller's organization if provided
    let vehicleDoc = null;
    if (vehicleID) {
      const isVehObjId = mongoose.Types.ObjectId.isValid(vehicleID) && /^[0-9a-fA-F]{24}$/.test(vehicleID);
      const vConds = [{ vehicleID }, { registrationNumber: vehicleID }];
      if (isVehObjId) vConds.push({ _id: new mongoose.Types.ObjectId(vehicleID) });

      vehicleDoc = await Vehicle.findOne({
        $or: vConds,
        organizationId: orgId,
      });
      if (!vehicleDoc) {
        return errorResponse(res, 400, 'Assigned vehicle does not belong to your organization');
      }
    }

    const trip = await Trip.create({
      organizationId: orgId,
      tripID: generatedID,
      source: source || 'Warehouse A',
      destination: destination || 'Client Location B',
      vehicleID: vehicleDoc ? vehicleDoc.vehicleID : vehicleID || 'GJ01AB1234',
      driverID: driverDoc ? driverDoc.driverId : driverID || 'DRV-101',
      driver: driverDoc ? driverDoc.user : req.user._id,
      vehicle: vehicleDoc ? vehicleDoc._id : null,
      dispatcher: req.user._id,
      cargoWeight: cargoWeight || 1200,
      plannedDistance: plannedDistance || 28,
      startingOdometer: startingOdometer || 12000,
      finalOdometer: finalOdometer || 0,
      fuelConsumed: fuelConsumed || 0,
      status: status || 'CREATED',
    });

    await AuditLog.create({
      organizationId: orgId,
      userId: req.user._id,
      action: 'TRIP_CREATED',
      resource: 'Trip',
      resourceId: trip._id.toString(),
      details: { tripID: trip.tripID, driverID: trip.driverID, vehicleID: trip.vehicleID },
    });

    return successResponse(res, 201, 'Trip created successfully', trip);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get All Trips for Caller's Organization
// @route   GET /api/trip or GET /api/trips
// @access  Private
const getTrips = async (req, res) => {
  try {
    const { status, driverID } = req.query;
    let filter = { organizationId: req.user.organizationId };

    if (status) filter.status = status;
    if (driverID) filter.driverID = driverID;

    // Drivers can only see their own trips
    if (req.user.role === 'ROLE_DRIVER' || req.user.role === 'DRIVER') {
      filter.$or = [
        { driver: req.user._id },
        { driverID: req.user.driverID },
      ];
    }

    const trips = await Trip.find(filter)
      .populate('driver', 'name email phone avatar')
      .populate('vehicle')
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Trips retrieved successfully', trips);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get Trip By ID (Scoped to Organization)
// @route   GET /api/trips/:id
// @access  Private
const getTripById = async (req, res) => {
  try {
    const query = buildTripIdQuery(req.params.id, req.user.organizationId);
    const trip = await Trip.findOne(query)
      .populate('driver', 'name email phone avatar')
      .populate('vehicle');

    if (!trip) {
      return errorResponse(res, 404, 'Trip not found in your organization');
    }
    return successResponse(res, 200, 'Trip retrieved', trip);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Dispatch Trip (Scoped to Organization)
// @route   PUT /api/trip/dispatch/:tripID
// @access  Private/Dispatcher/Admin
const dispatchTrip = async (req, res) => {
  try {
    const { tripID } = req.params;
    const query = buildTripIdQuery(tripID, req.user.organizationId);

    const trip = await Trip.findOneAndUpdate(
      query,
      { status: 'DISPATCHED', actualStartTime: new Date() },
      { new: true }
    );

    if (!trip) {
      return errorResponse(res, 404, 'Trip not found in your organization');
    }

    if (trip.vehicleID) {
      await Vehicle.findOneAndUpdate(
        { vehicleID: trip.vehicleID, organizationId: req.user.organizationId },
        { status: 'ON_TRIP' }
      );
    }

    if (trip.driverID) {
      await Driver.findOneAndUpdate(
        { driverId: trip.driverID, organizationId: req.user.organizationId },
        { status: 'ON_TRIP', isAvailable: false }
      );
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`organization:${req.user.organizationId}`).emit('trip:status:changed', {
        tripID: trip.tripID,
        status: trip.status,
        actualStartTime: trip.actualStartTime,
      });
    }

    return successResponse(res, 200, 'Trip dispatched successfully', trip);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Complete Trip (Scoped to Organization)
// @route   PUT /api/trip/complete/:tripID
// @access  Private/Dispatcher/Admin/Driver
const completeTrip = async (req, res) => {
  try {
    const { tripID } = req.params;
    const { finalOdometer, fuelConsumed } = req.body;
    const query = buildTripIdQuery(tripID, req.user.organizationId);

    const trip = await Trip.findOneAndUpdate(
      query,
      {
        status: 'COMPLETED',
        actualEndTime: new Date(),
        ...(finalOdometer ? { finalOdometer } : {}),
        ...(fuelConsumed ? { fuelConsumed } : {}),
      },
      { new: true }
    );

    if (!trip) {
      return errorResponse(res, 404, 'Trip not found in your organization');
    }

    if (trip.vehicleID) {
      await Vehicle.findOneAndUpdate(
        { vehicleID: trip.vehicleID, organizationId: req.user.organizationId },
        {
          status: 'AVAILABLE',
          ...(finalOdometer ? { odometer: finalOdometer } : {}),
        }
      );
    }

    if (trip.driverID) {
      await Driver.findOneAndUpdate(
        { driverId: trip.driverID, organizationId: req.user.organizationId },
        { status: 'AVAILABLE', isAvailable: true }
      );
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`organization:${req.user.organizationId}`).emit('trip:status:changed', {
        tripID: trip.tripID,
        status: trip.status,
        actualEndTime: trip.actualEndTime,
      });
    }

    return successResponse(res, 200, 'Trip completed successfully', trip);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Cancel Trip (Scoped to Organization)
// @route   PUT /api/trip/cancel/:tripID
// @access  Private/Dispatcher/Admin
const cancelTrip = async (req, res) => {
  try {
    const { tripID } = req.params;
    const query = buildTripIdQuery(tripID, req.user.organizationId);

    const trip = await Trip.findOneAndUpdate(
      query,
      { status: 'CANCELLED' },
      { new: true }
    );

    if (!trip) {
      return errorResponse(res, 404, 'Trip not found in your organization');
    }

    if (trip.vehicleID) {
      await Vehicle.findOneAndUpdate(
        { vehicleID: trip.vehicleID, organizationId: req.user.organizationId },
        { status: 'AVAILABLE' }
      );
    }

    if (trip.driverID) {
      await Driver.findOneAndUpdate(
        { driverId: trip.driverID, organizationId: req.user.organizationId },
        { status: 'AVAILABLE', isAvailable: true }
      );
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`organization:${req.user.organizationId}`).emit('trip:status:changed', {
        tripID: trip.tripID,
        status: trip.status,
      });
    }

    return successResponse(res, 200, 'Trip cancelled', trip);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Reassign Driver/Vehicle to Trip (Scoped to Organization)
// @route   POST /api/trips/:id/reassign
// @access  Private/Dispatcher/Admin
const reassignTrip = async (req, res) => {
  try {
    const { driverID, vehicleID } = req.body;
    const orgId = req.user.organizationId;

    if (driverID) {
      const isDriverObjId = mongoose.Types.ObjectId.isValid(driverID) && /^[0-9a-fA-F]{24}$/.test(driverID);
      const conds = [{ driverId: driverID }];
      if (isDriverObjId) conds.push({ _id: new mongoose.Types.ObjectId(driverID) });

      const driver = await Driver.findOne({ $or: conds, organizationId: orgId });
      if (!driver) {
        return errorResponse(res, 400, 'Driver does not belong to your organization');
      }
    }

    if (vehicleID) {
      const isVehObjId = mongoose.Types.ObjectId.isValid(vehicleID) && /^[0-9a-fA-F]{24}$/.test(vehicleID);
      const vConds = [{ vehicleID }, { registrationNumber: vehicleID }];
      if (isVehObjId) vConds.push({ _id: new mongoose.Types.ObjectId(vehicleID) });

      const vehicle = await Vehicle.findOne({ $or: vConds, organizationId: orgId });
      if (!vehicle) {
        return errorResponse(res, 400, 'Vehicle does not belong to your organization');
      }
    }

    const query = buildTripIdQuery(req.params.id, orgId);
    const trip = await Trip.findOneAndUpdate(
      query,
      {
        ...(driverID ? { driverID } : {}),
        ...(vehicleID ? { vehicleID } : {}),
      },
      { new: true }
    );

    if (!trip) {
      return errorResponse(res, 404, 'Trip not found in your organization');
    }

    return successResponse(res, 200, 'Trip reassigned successfully', trip);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  createTrip,
  getTrips,
  getTripById,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  reassignTrip,
};
