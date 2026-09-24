const mongoose = require('mongoose');

const MaintenanceSchema = new mongoose.Schema(
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
    maintenanceType: {
      type: String,
      enum: ['Routine Service', 'Engine Overhaul', 'Brake Replacement', 'Tyre Change', 'Oil Change', 'Emergency Repair'],
      default: 'Routine Service',
    },
    description: {
      type: String,
      default: '',
    },
    serviceDate: {
      type: Date,
      default: Date.now,
    },
    nextServiceDate: {
      type: Date,
    },
    cost: {
      type: Number,
      default: 0,
    },
    odometer: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'],
      default: 'SCHEDULED',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

MaintenanceSchema.index({ organizationId: 1, vehicleID: 1 });
MaintenanceSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model('Maintenance', MaintenanceSchema);
