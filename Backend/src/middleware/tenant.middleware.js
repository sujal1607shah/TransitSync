const { errorResponse } = require('../utils/response');

/**
 * Ensures that the authenticated request carries an active organization context.
 */
const requireTenant = (req, res, next) => {
  if (!req.user || !req.user.organizationId) {
    return errorResponse(res, 403, 'Forbidden: Organization context is required');
  }
  req.organizationId = req.user.organizationId;
  next();
};

/**
 * Helper to build an organization-filtered query object.
 * Ignores any client-supplied organizationId.
 */
const getOrgFilter = (req, extraFilter = {}) => {
  if (!req.user || !req.user.organizationId) {
    throw new Error('Organization context is missing on request user');
  }
  return {
    ...extraFilter,
    organizationId: req.user.organizationId,
  };
};

module.exports = {
  requireTenant,
  getOrgFilter,
};
