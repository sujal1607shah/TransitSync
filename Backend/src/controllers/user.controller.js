const User = require('../models/User');
const Driver = require('../models/Driver');
const generateToken = require('../utils/generateToken');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Create/Register New User or Driver (Signup)
// @route   POST /api/user/create
// @access  Public / Admin
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

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 400, 'User with this email already exists');
    }

    const assignedRole = role || 'ROLE_DRIVER';

    const user = await User.create({
      name,
      email,
      password,
      phone: phoneNo || '',
      role: assignedRole,
      licenseNo: licenseNo || '',
      licenseExpiryDate: licenseExpiryDate || '',
      driverStatus: driverStatus || 'AVAILABLE',
      safetyScore: safetyScore || 95,
      driverID: driverID || `DRV-${Math.floor(1000 + Math.random() * 9000)}`,
    });

    // If registering a driver, also populate Driver collection
    if (assignedRole === 'ROLE_DRIVER' || assignedRole === 'DRIVER') {
      await Driver.create({
        driverId: user.driverID,
        user: user._id,
        name: user.name,
        phone: user.phone,
        licenseNumber: user.licenseNo,
        safetyScore: user.safetyScore,
        status: 'AVAILABLE',
      });
    }

    const token = generateToken(user._id, user.role);

    return successResponse(res, 201, 'User created successfully', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get All Users / Drivers
// @route   GET /api/user
// @access  Private
const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let filter = {};

    if (role) {
      filter.role = { $in: [role, role.replace('ROLE_', '')] };
    }

    const users = await User.find(filter).select('-password');
    return successResponse(res, 200, 'Users retrieved successfully', users);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get User By ID
// @route   GET /api/user/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }
    return successResponse(res, 200, 'User retrieved', user);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Update User
// @route   PUT /api/user/:id
// @access  Private
const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }
    return successResponse(res, 200, 'User updated successfully', user);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Delete User
// @route   DELETE /api/user/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
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
