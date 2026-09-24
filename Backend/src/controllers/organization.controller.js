const mongoose = require('mongoose');
const Organization = require('../models/Organization');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const generateToken = require('../utils/generateToken');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Register Organization and its First Admin
// @route   POST /api/organizations/register
// @access  Public
const registerOrganization = async (req, res) => {
  let orgInstance = null;

  try {
    const { organization, admin } = req.body;

    if (!organization || !organization.name || !organization.code) {
      return errorResponse(res, 400, 'Organization name and unique code are required');
    }

    if (!admin || !admin.name || !admin.email || !admin.password) {
      return errorResponse(res, 400, 'Admin name, email, and password are required');
    }

    const orgCodeUpper = organization.code.toUpperCase().trim();

    // Check duplicate organization code
    const existingOrg = await Organization.findOne({ code: orgCodeUpper });
    if (existingOrg) {
      return errorResponse(res, 400, `Organization code "${orgCodeUpper}" is already in use`);
    }

    // 1. Create Organization
    orgInstance = await Organization.create({
      name: organization.name.trim(),
      code: orgCodeUpper,
      email: organization.email ? organization.email.toLowerCase().trim() : admin.email.toLowerCase().trim(),
      phone: organization.phone || admin.phone || '',
      address: organization.address || '',
      city: organization.city || '',
      country: organization.country || 'India',
      timezone: organization.timezone || 'Asia/Kolkata',
      currency: organization.currency || 'INR (Rs)',
      logo: organization.logo || '',
      geofence: organization.geofence || {
        latitude: 23.0225,
        longitude: 72.5714,
        radiusMeters: 200,
        name: 'Central Depot',
      },
    });

    // Check duplicate email in this organization
    const existingUser = await User.findOne({
      organizationId: orgInstance._id,
      email: admin.email.toLowerCase().trim(),
    });

    if (existingUser) {
      await Organization.findByIdAndDelete(orgInstance._id);
      return errorResponse(res, 400, 'User with this email already exists in this organization');
    }

    // 2. Create First Admin
    const adminInstance = await User.create({
      organizationId: orgInstance._id,
      name: admin.name.trim(),
      email: admin.email.toLowerCase().trim(),
      password: admin.password,
      phone: admin.phone || '',
      role: 'ROLE_ADMIN',
      isActive: true,
    });

    // 3. Create Audit Log
    await AuditLog.create({
      organizationId: orgInstance._id,
      userId: adminInstance._id,
      action: 'ORGANIZATION_REGISTERED',
      resource: 'Organization',
      resourceId: orgInstance._id.toString(),
      details: {
        orgCode: orgInstance.code,
        adminEmail: adminInstance.email,
      },
    });

    // Generate token for auto-login
    const token = generateToken(adminInstance._id, adminInstance.role, orgInstance._id);

    return successResponse(res, 201, 'Organization and Admin registered successfully', {
      token,
      organization: {
        id: orgInstance._id,
        name: orgInstance.name,
        code: orgInstance.code,
        email: orgInstance.email,
        phone: orgInstance.phone,
        timezone: orgInstance.timezone,
        currency: orgInstance.currency,
        geofence: orgInstance.geofence,
      },
      user: {
        id: adminInstance._id,
        name: adminInstance.name,
        email: adminInstance.email,
        role: adminInstance.role,
        organizationId: orgInstance._id,
      },
    });
  } catch (error) {
    // Rollback organization creation if user creation fails
    if (orgInstance && orgInstance._id) {
      try {
        await Organization.findByIdAndDelete(orgInstance._id);
      } catch (cleanupErr) {}
    }
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Create standalone Organization
// @route   POST /api/organizations
// @access  Public / Admin
const createOrganization = async (req, res) => {
  try {
    const { name, code, email, phone, address, city, country, timezone, currency, logo, geofence } = req.body;

    if (!name || !code) {
      return errorResponse(res, 400, 'Name and code are required');
    }

    const orgCodeUpper = code.toUpperCase().trim();
    const existing = await Organization.findOne({ code: orgCodeUpper });
    if (existing) {
      return errorResponse(res, 400, `Organization code "${orgCodeUpper}" already exists`);
    }

    const org = await Organization.create({
      name: name.trim(),
      code: orgCodeUpper,
      email: email ? email.toLowerCase().trim() : '',
      phone: phone || '',
      address: address || '',
      city: city || '',
      country: country || 'India',
      timezone: timezone || 'Asia/Kolkata',
      currency: currency || 'INR (Rs)',
      logo: logo || '',
      geofence: geofence || {
        latitude: 23.0225,
        longitude: 72.5714,
        radiusMeters: 200,
        name: 'Central Depot',
      },
    });

    return successResponse(res, 201, 'Organization created successfully', org);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get Current User's Organization Info
// @route   GET /api/organizations/me
// @access  Private
const getMyOrganization = async (req, res) => {
  try {
    const org = await Organization.findById(req.user.organizationId);
    if (!org) {
      return errorResponse(res, 404, 'Organization not found');
    }
    return successResponse(res, 200, 'Organization details retrieved', org);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Update Current User's Organization (Admin only)
// @route   PUT /api/organizations/me
// @access  Private/Admin
const updateMyOrganization = async (req, res) => {
  try {
    const { name, email, phone, address, city, country, timezone, currency, logo, geofence } = req.body;

    // Security: Do NOT allow modification of organizationId or organization code
    const updates = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = email.toLowerCase().trim();
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (city !== undefined) updates.city = city;
    if (country !== undefined) updates.country = country;
    if (timezone) updates.timezone = timezone;
    if (currency) updates.currency = currency;
    if (logo !== undefined) updates.logo = logo;
    if (geofence) updates.geofence = geofence;

    const org = await Organization.findByIdAndUpdate(req.user.organizationId, updates, { new: true });
    if (!org) {
      return errorResponse(res, 404, 'Organization not found');
    }

    await AuditLog.create({
      organizationId: org._id,
      userId: req.user._id,
      action: 'ORGANIZATION_UPDATED',
      resource: 'Organization',
      resourceId: org._id.toString(),
      details: updates,
    });

    return successResponse(res, 200, 'Organization updated successfully', org);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  registerOrganization,
  createOrganization,
  getMyOrganization,
  updateMyOrganization,
};
