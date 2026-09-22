const { errorResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('[Unhandled Error]:', err);

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  return errorResponse(res, statusCode, message, process.env.NODE_ENV === 'development' ? err.stack : null);
};

module.exports = errorHandler;
