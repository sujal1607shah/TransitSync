const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema(
  {
    vehicleID: {
      type: String,
      default: '',
    },
    tripID: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['FUEL', 'MAINTENANCE', 'TOLL', 'DRIVER_EXPENSE', 'OTHER'],
      default: 'FUEL',
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR (Rs)',
    },
    description: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    receiptImage: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', ExpenseSchema);
