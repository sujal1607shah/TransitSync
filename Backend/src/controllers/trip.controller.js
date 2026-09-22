const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Register / Create Trip
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

    const generatedID = tripID || `TRP-${Math.floor(1000 + Math.random() * 9000)}`;

    const trip = await Trip.create({
      tripID: generatedID,
      source: source || 'Warehouse A',
      destination: destination || 'Client Location B',
      vehicleID: vehicleID || 'GJ01AB1234',
      driverID: driverID || 'DRV-101',
      cargoWeight: cargoWeight || 1200,
      plannedDistance: plannedDistance || 28,
      startingOdometer: startingOdometer || 12000,
      finalOdometer: finalOdometer || 0,
      fuelConsumed: fuelConsumed || 0,
      status: status || 'CREATED',
    });

    return successResponse(res, 201, 'Trip created successfully', trip);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get All Trips
// @route   GET /api/trip or GET /api/trips
// @access  Private
const getTrips = async (req, res) => {
  try {
    const { status, driverID } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (driverID) filter.driverID = driverID;

    const trips = await Trip.find(filter).sort({ createdAt: -1 });
    return successResponse(res, 200, 'Trips retrieved successfully', trips);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get Trip By ID
// @route   GET /api/trips/:id
// @access  Private
const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findOne({
      $or: [{ tripID: req.params.id }, { _id: req.params.id }],
    });
    if (!trip) {
      return errorResponse(res, 404, 'Trip not found');
    }
    return successResponse(res, 200, 'Trip retrieved', trip);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Dispatch Trip
// @route   PUT /api/trip/dispatch/:tripID
// @access  Private/Dispatcher/Admin
const dispatchTrip = async (req, res) => {
  try {
    const { tripID } = req.params;
    const trip = await Trip.findOneAndUpdate(
      { $or: [{ tripID }, { _id: tripID }] },
      { status: 'DISPATCHED', actualStartTime: new Date() },
      { new: true }
    );

    if (!trip) {
      return errorResponse(res, 404, 'Trip not found');
    }

    if (trip.vehicleID) {
      await Vehicle.findOneAndUpdate({ vehicleID: trip.vehicleID }, { status: 'ON_TRIP' });
    }
    if (trip.driverID) {
      await Driver.findOneAndUpdate({ driverId: trip.driverID }, { status: 'ON_TRIP' });
    }

    return successResponse(res, 200, 'Trip dispatched successfully', trip);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Complete Trip
// @route   PUT /api/trip/complete/:tripID
// @access  Private
const completeTrip = async (req, res) => {
  try {
    const { tripID } = req.params;
    const { finalOdometer, fuelConsumed } = req.body;

    const trip = await Trip.findOneAndUpdate(
      { $or: [{ tripID }, { _id: tripID }] },
      {
        status: 'COMPLETED',
        finalOdometer: finalOdometer || 0,
        fuelConsumed: fuelConsumed || 0,
        actualEndTime: new Date(),
      },
      { new: true }
    );

    if (!trip) {
      return errorResponse(res, 404, 'Trip not found');
    }

    if (trip.vehicleID) {
      await Vehicle.findOneAndUpdate({ vehicleID: trip.vehicleID }, { status: 'AVAILABLE' });
    }
    if (trip.driverID) {
      await Driver.findOneAndUpdate({ driverId: trip.driverID }, { status: 'AVAILABLE' });
    }

    return successResponse(res, 200, 'Trip completed successfully', trip);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Cancel Trip
// @route   PUT /api/trip/cancel/:tripID
// @access  Private/Dispatcher/Admin
const cancelTrip = async (req, res) => {
  try {
    const { tripID } = req.params;
    const trip = await Trip.findOneAndUpdate(
      { $or: [{ tripID }, { _id: tripID }] },
      { status: 'CANCELLED' },
      { new: true }
    );

    if (!trip) {
      return errorResponse(res, 404, 'Trip not found');
    }

    if (trip.vehicleID) {
      await Vehicle.findOneAndUpdate({ vehicleID: trip.vehicleID }, { status: 'AVAILABLE' });
    }
    if (trip.driverID) {
      await Driver.findOneAndUpdate({ driverId: trip.driverID }, { status: 'AVAILABLE' });
    }

    return successResponse(res, 200, 'Trip cancelled successfully', trip);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Reassign Driver/Vehicle to Trip
// @route   POST /api/trips/:id/reassign
// @access  Private/Dispatcher/Admin
const reassignTrip = async (req, res) => {
  try {
    const { driverID, vehicleID } = req.body;
    const trip = await Trip.findOneAndUpdate(
      { $or: [{ tripID: req.params.id }, { _id: req.params.id }] },
      { ...(driverID ? { driverID } : {}), ...(vehicleID ? { vehicleID } : {}) },
      { new: true }
    );
    return successResponse(res, 200, 'Trip reassigned', trip);
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
