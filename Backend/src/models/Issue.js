const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema(
  {
    issueId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    driverName: {
      type: String,
      default: 'Driver',
    },
    vehicleID: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['VEHICLE_ISSUE', 'MAINTENANCE', 'ROUTE_PROBLEM', 'INCIDENT_REPORT', 'Engine Problem', 'Scheduled Service', 'Route Traffic Delay', 'Accident Report'],
      default: 'VEHICLE_ISSUE',
    },
    issueType: {
      type: String,
      default: 'Engine Problem',
    },
    severity: {
      type: String,
      enum: ['High', 'Medium', 'Low', 'HIGH', 'MEDIUM', 'LOW'],
      default: 'High',
    },
    description: {
      type: String,
      required: true,
    },
    photos: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ['SUBMITTED', 'ASSIGNED_TO_MAINTENANCE', 'IN_PROGRESS', 'RESOLVED', 'Submitted', 'In Progress', 'Resolved'],
      default: 'SUBMITTED',
      index: true,
    },
    assignedTo: {
      type: String,
      default: 'Maintenance Team',
    },
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Issue', IssueSchema);
