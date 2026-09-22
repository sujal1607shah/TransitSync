const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema(
  {
    tripID: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    source: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    vehicleID: {
      type: String,
      default: '',
    },
    driverID: {
      type: String,
      default: '',
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    dispatcher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cargoWeight: {
      type: Number,
      default: 0,
    },
    plannedDistance: {
      type: Number,
      default: 0,
    },
    startingOdometer: {
      type: Number,
      default: 0,
    },
    finalOdometer: {
      type: Number,
      default: 0,
    },
    fuelConsumed: {
      type: Number,
      default: 0,
    },
    estimatedDuration: {
      type: String,
      default: '2 hrs 30 mins',
    },
    estimatedArrival: {
      type: Date,
    },
    actualStartTime: {
      type: Date,
    },
    actualEndTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'CREATED', 'ASSIGNED', 'ACCEPTED', 'DISPATCHED', 'IN_PROGRESS', 'DELAYED', 'COMPLETED', 'CANCELLED', 'ON TRIP', 'On Trip', 'Completed', 'Cancelled'],
      default: 'DRAFT',
      index: true,
    },
    currentLocation: {
      latitude: { type: Number, default: 23.0225 },
      longitude: { type: Number, default: 72.5714 },
    },
    trafficStatus: {
      type: String,
      enum: ['CLEAR', 'MODERATE', 'HEAVY'],
      default: 'CLEAR',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trip', TripSchema);
