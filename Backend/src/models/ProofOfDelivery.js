const mongoose = require('mongoose');

const ProofOfDeliverySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    podId: {
      type: String,
      required: true,
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

ProofOfDeliverySchema.index({ organizationId: 1, podId: 1 }, { unique: true });
ProofOfDeliverySchema.index({ organizationId: 1, tripID: 1 });

module.exports = mongoose.model('ProofOfDelivery', ProofOfDeliverySchema);
