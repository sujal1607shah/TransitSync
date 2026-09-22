const mongoose = require('mongoose');

const ProofOfDeliverySchema = new mongoose.Schema(
  {
    podId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tripID: {
      type: String,
      required: true,
      index: true,
    },
    driverName: {
      type: String,
      default: '',
    },
    receiverName: {
      type: String,
      required: true,
    },
    deliveryDate: {
      type: Date,
      default: Date.now,
    },
    deliveryLocation: {
      type: String,
      default: '',
    },
    deliveryNotes: {
      type: String,
      default: '',
    },
    deliveryImage: {
      type: String,
      default: '',
    },
    signature: {
      type: String,
      default: '',
    },
    pdfUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['VERIFIED', 'PENDING_REVIEW', 'REJECTED'],
      default: 'VERIFIED',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProofOfDelivery', ProofOfDeliverySchema);
