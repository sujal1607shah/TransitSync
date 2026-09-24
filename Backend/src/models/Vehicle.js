const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    vehicleID: {
      type: String,
      required: true,
      index: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['Truck', 'Van', 'Trailer', 'Container', 'Heavy Truck', 'Light Commercial'],
      default: 'Truck',
    },
    maxLoadCapacity: {
      type: Number,
      default: 5000,
    },
    odometer: {
      type: Number,
      default: 12000,
    },
    acquisitionCost: {
      type: Number,
      default: 2500000,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'ON_TRIP', 'IDLE', 'MAINTENANCE', 'IN_SHOP', 'INACTIVE', 'Available', 'On Trip', 'Maintenance'],
      default: 'AVAILABLE',
    },
    fuelType: {
      type: String,
      enum: ['Diesel', 'Electric', 'CNG', 'Petrol'],
      default: 'Diesel',
    },
    currentMileage: {
      type: Number,
      default: 12.5,
    },
    currentLocation: {
      latitude: { type: Number, default: 23.0225 },
      longitude: { type: Number, default: 72.5714 },
      address: { type: String, default: 'Ahmedabad Highway Depot' },
    },
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    lastServiceDate: {
      type: Date,
      default: Date.now,
    },
    nextServiceDate: {
      type: Date,
    },
    insuranceExpiry: {
      type: Date,
    },
    fitnessExpiry: {
      type: Date,
    },
  },
  { timestamps: true }
);

VehicleSchema.index({ organizationId: 1, vehicleID: 1 }, { unique: true });
VehicleSchema.index({ organizationId: 1, registrationNumber: 1 }, { unique: true });
VehicleSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model('Vehicle', VehicleSchema);
