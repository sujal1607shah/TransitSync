const User = require('../models/User');
const Organization = require('../models/Organization');
const generateToken = require('../utils/generateToken');
const { successResponse, errorResponse } = require('../utils/response');

// Helper to get or create demo organization
const getOrCreateDemoOrg = async () => {
  let demoOrg = await Organization.findOne({ code: 'TS-DEMO' });
  if (!demoOrg) {
    demoOrg = await Organization.create({
      name: 'TransitSync Demo Organization',
      code: 'TS-DEMO',
      email: 'admin@transitsync.com',
      phone: '+91 98765 00000',
      address: 'Central Logistics Park',
      city: 'Ahmedabad',
      country: 'India',
      timezone: 'Asia/Kolkata',
      currency: 'INR (Rs)',
      geofence: {
        latitude: 23.0225,
        longitude: 72.5714,
        radiusMeters: 200,
        name: 'Ahmedabad Central Depot',
      },
    });
  }
  return demoOrg;
};

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
      const demoOrg = await getOrCreateDemoOrg();
      const mockRole = role || 'ROLE_DRIVER';
      let user = await User.findOne({ email, organizationId: demoOrg._id });

      if (!user) {
        user = await User.create({
          organizationId: demoOrg._id,
          name: mockRole === 'ROLE_ADMIN' ? 'Demo Admin' : mockRole === 'ROLE_DISPATCHER' ? 'Demo Dispatcher' : 'Demo Driver',
          email,
          password: 'password',
          role: mockRole,
        });
      }

      const token = generateToken(user._id, user.role, demoOrg._id);

      return successResponse(res, 200, 'Login successful', {
        token,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: demoOrg._id,
        organization: {
          id: demoOrg._id,
          name: demoOrg.name,
          code: demoOrg.code,
        },
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password').populate('organizationId');

    if (!user) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    // Enforce role consistency (prevent role escalation)
    if (role && role !== user.role && role.replace('ROLE_', '') !== user.role.replace('ROLE_', '')) {
      const prettyRole = user.role.replace('ROLE_', '');
      return errorResponse(res, 403, `Role mismatch: This account is registered as ${prettyRole}. Please select the correct role.`);
    }

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const orgId = user.organizationId ? (user.organizationId._id || user.organizationId) : null;
    const token = generateToken(user._id, user.role, orgId);

    return successResponse(res, 200, 'Login successful', {
      token,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: orgId,
      organization: user.organizationId
        ? {
            id: user.organizationId._id,
            name: user.organizationId.name,
            code: user.organizationId.code,
          }
        : null,
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
    const user = await User.findById(req.user._id).populate('organizationId');
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
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return errorResponse(res, 400, 'Email and new password required');
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return errorResponse(res, 404, 'User with this email not found');
    }

    user.password = newPassword;
    await user.save();

    return successResponse(res, 200, 'Password has been reset successfully');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isOnline: false, lastSeen: new Date() });
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
