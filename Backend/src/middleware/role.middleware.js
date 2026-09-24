const { errorResponse } = require('../utils/response');

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'Unauthorized access');
    }

    const userRole = (req.user.role || '').toUpperCase();
    const normalizedUserRole = userRole.replace('ROLE_', '');

    const allowedRoles = roles.map((r) => r.toUpperCase().replace('ROLE_', ''));

    if (!allowedRoles.includes(normalizedUserRole)) {
      return errorResponse(
        res,
        403,
        `Forbidden: Access denied for role ${req.user.role}`
      );
    }
    next();
  };
};

module.exports = { authorizeRoles };
