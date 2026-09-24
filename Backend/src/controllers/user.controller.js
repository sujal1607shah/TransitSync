const User = require('../models/User');
const Driver = require('../models/Driver');
const Organization = require('../models/Organization');
const AuditLog = require('../models/AuditLog');
const generateToken = require('../utils/generateToken');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Create/Register New User or Driver
// @route   POST /api/user/create or POST /api/user
// @access  Public / Private / Admin
const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phoneNo,
      licenseNo,
      licenseExpiryDate,
      role,
      driverStatus,
      safetyScore,
      driverID,
    } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, 400, 'Name, email, and password are required');
    }

    // Determine target organizationId
    // If authenticated user creates driver/dispatcher, strictly use req.user.organizationId
    // If unauthenticated public signup, fall back to default demo organization
    let orgId = req.user ? req.user.organizationId : null;
    if (!orgId) {
      let demoOrg = await Organization.findOne({ code: 'TS-DEMO' });
      if (!demoOrg) {
        demoOrg = await Organization.create({
          name: 'TransitSync Demo Organization',
          code: 'TS-DEMO',
          email: 'admin@transitsync.com',
        });
      }
      orgId = demoOrg._id;
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ organizationId: orgId, email: normalizedEmail });
    if (existingUser) {
      return errorResponse(res, 400, 'User with this email already exists in this organization');
    }

    let assignedRole = (role || 'ROLE_DRIVER').toUpperCase();
    if (!assignedRole.startsWith('ROLE_')) {
      assignedRole = `ROLE_${assignedRole}`;
    }

    // Role Security Rules:
    // 1. Unauthenticated public signup is strictly restricted to Admin (ROLE_ADMIN)
    if (!req.user && assignedRole !== 'ROLE_ADMIN') {
      return errorResponse(
        res,
        403,
        'Direct public signup is restricted to Administrators. Drivers and Dispatchers must be created by an Admin or Dispatcher.'
      );
    }

    // 2. Creating a Dispatcher (ROLE_DISPATCHER) requires an authenticated Admin
    if (assignedRole === 'ROLE_DISPATCHER') {
      if (!req.user || (req.user.role !== 'ROLE_ADMIN' && req.user.role !== 'ADMIN')) {
        return errorResponse(res, 403, 'Only Administrators are authorized to create Dispatcher profiles');
      }
    }

    // 3. Creating a Driver (ROLE_DRIVER) requires Admin or Dispatcher
    if (assignedRole === 'ROLE_DRIVER') {
      if (req.user) {
        const callerRole = (req.user.role || '').toUpperCase();
        if (!['ROLE_ADMIN', 'ADMIN', 'ROLE_DISPATCHER', 'DISPATCHER'].includes(callerRole)) {
          return errorResponse(res, 403, 'Unauthorized to create driver accounts');
        }
      }
    }

    const generatedDriverId = driverID || `DRV-${Math.floor(1000 + Math.random() * 9000)}`;

    const user = await User.create({
      organizationId: orgId,
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone: phoneNo || '',
      role: assignedRole,
      licenseNo: licenseNo || '',
      licenseExpiryDate: licenseExpiryDate || '',
      driverStatus: driverStatus || 'AVAILABLE',
      safetyScore: safetyScore || 95,
      driverID: generatedDriverId,
    });

    // If registering a driver, also populate Driver collection under same organization
    if (assignedRole === 'ROLE_DRIVER' || assignedRole === 'DRIVER') {
      await Driver.create({
        organizationId: orgId,
        driverId: user.driverID,
        user: user._id,
        name: user.name,
        phone: user.phone,
        licenseNumber: user.licenseNo,
        safetyScore: user.safetyScore,
        status: 'AVAILABLE',
      });
    }

    // Audit log
    await AuditLog.create({
      organizationId: orgId,
      userId: req.user ? req.user._id : user._id,
      action: 'USER_CREATED',
      resource: 'User',
      resourceId: user._id.toString(),
      details: { email: user.email, role: user.role },
    });

    const token = generateToken(user._id, user.role, orgId);

    return successResponse(res, 201, 'User created successfully', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: orgId,
      },
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get All Users in Caller's Organization
// @route   GET /api/user or GET /api/users
// @access  Private
const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let filter = { organizationId: req.user.organizationId };

    if (role) {
      filter.role = { $in: [role, role.replace('ROLE_', ''), `ROLE_${role.replace('ROLE_', '')}`] };
    }

    const users = await User.find(filter).select('-password');
    return successResponse(res, 200, 'Users retrieved successfully', users);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get User By ID (Scoped to Organization)
// @route   GET /api/user/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    }).select('-password');

    if (!user) {
      return errorResponse(res, 404, 'User not found in your organization');
    }
    return successResponse(res, 200, 'User retrieved successfully', user);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Update User (Scoped to Organization)
// @route   PUT /api/user/:id
// @access  Private
const updateUser = async (req, res) => {
  try {
    // Security: Do NOT allow changing organizationId or password directly here
    const { organizationId, password, ...updateData } = req.body;

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return errorResponse(res, 404, 'User not found in your organization');
    }

    return successResponse(res, 200, 'User updated successfully', user);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Delete User (Scoped to Organization)
// @route   DELETE /api/user/:id
// @access  Private (Admin or Dispatcher)
const deleteUser = async (req, res) => {
  try {
    const callerRole = (req.user.role || '').toUpperCase();
    const isDispatcher = ['ROLE_DISPATCHER', 'DISPATCHER'].includes(callerRole);

    const targetUser = await User.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });

    if (!targetUser) {
      return errorResponse(res, 404, 'User not found in your organization');
    }

    // Security: Dispatchers can only delete Drivers
    if (isDispatcher && targetUser.role !== 'ROLE_DRIVER' && targetUser.role !== 'DRIVER') {
      return errorResponse(res, 403, 'Dispatchers are only permitted to delete driver accounts');
    }

    await User.findByIdAndDelete(targetUser._id);
    await Driver.findOneAndDelete({ user: targetUser._id, organizationId: req.user.organizationId });

    await AuditLog.create({
      organizationId: req.user.organizationId,
      userId: req.user._id,
      action: 'USER_DELETED',
      resource: 'User',
      resourceId: targetUser._id.toString(),
      details: { email: targetUser.email, role: targetUser.role, name: targetUser.name },
    });

    return successResponse(res, 200, 'User deleted successfully');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
