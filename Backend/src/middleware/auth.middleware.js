const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const { errorResponse } = require('../utils/response');

const authenticateUser = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return errorResponse(res, 401, 'Unauthorized: No token provided');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return errorResponse(res, 401, 'Unauthorized: User account invalid or inactive');
    }

    req.user = user;
    next();
  } catch (err) {
    return errorResponse(res, 401, 'Unauthorized: Token verification failed');
  }
};

module.exports = { authenticateUser };
