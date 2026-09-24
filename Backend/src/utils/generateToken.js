const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateToken = (userId, role, organizationId) => {
  return jwt.sign(
    {
      userId: userId ? userId.toString() : '',
      role,
      organizationId: organizationId ? organizationId.toString() : '',
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRE,
    }
  );
};

module.exports = generateToken;
