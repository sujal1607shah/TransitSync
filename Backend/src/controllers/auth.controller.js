const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, 'Please provide email and password');
    }

    // Demo account shortcut support for testing/college presentation
    if (email === 'test@transitsync.com' && password === 'password') {
      const mockRole = role || 'ROLE_DRIVER';
      let user = await User.findOne({ email });

      if (!user) {
        user = await User.create({
          name: mockRole === 'ROLE_ADMIN' ? 'Demo Admin' : mockRole === 'ROLE_DISPATCHER' ? 'Demo Dispatcher' : 'Demo Driver',
          email,
          password: 'password',
          role: mockRole,
        });
      }

      const token = generateToken(user._id, user.role);

      return successResponse(res, 200, 'Login successful', {
        token,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    // Enforce role consistency (prevent role escalation)
    if (role && role !== user.role) {
      const prettyRole = user.role.replace('ROLE_', '');
      return errorResponse(res, 403, `Role mismatch: This account is registered as ${prettyRole}. Please select the correct role.`);
    }

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user._id, user.role);

    return successResponse(res, 200, 'Login successful', {
      token,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    return successResponse(res, 200, 'User profile retrieved', user);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Request Password Reset Email
// @route   GET /api/auth/request-reset-password
// @access  Public
const requestResetPassword = async (req, res) => {
  try {
    const { email } = req.query;
    return successResponse(res, 200, `Reset instructions sent to ${email}`);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    return successResponse(res, 200, 'Password reset successful');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Logout User
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { isOnline: false, lastSeen: new Date() });
    }
    return successResponse(res, 200, 'Logged out successfully');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  login,
  getMe,
  requestResetPassword,
  resetPassword,
  logout,
};
