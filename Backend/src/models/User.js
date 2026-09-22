const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['ADMIN', 'DISPATCHER', 'DRIVER', 'ROLE_ADMIN', 'ROLE_DISPATCHER', 'ROLE_DRIVER'],
      default: 'ROLE_DRIVER',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },

    // Embedded driver metadata for convenience
    licenseNo: { type: String, default: '' },
    licenseExpiryDate: { type: String, default: '' },
    driverStatus: { type: String, default: 'AVAILABLE' },
    safetyScore: { type: Number, default: 95 },
    driverID: { type: String, default: '' },
  },
  { timestamps: true }
);

// Encrypt password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
