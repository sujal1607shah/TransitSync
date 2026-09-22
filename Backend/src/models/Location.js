const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema(
  {
    driverId: {
      type: String,
      required: true,
      index: true,
    },
    driverName: {
      type: String,
      default: '',
    },
    tripID: {
      type: String,
      default: '',
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    accuracy: {
      type: Number,
      default: 5,
    },
    speed: {
      type: Number,
      default: 0,
    },
    heading: {
      type: Number,
      default: 0,
    },
    address: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Location', LocationSchema);
