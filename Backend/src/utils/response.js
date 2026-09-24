/**
 * Standard API Response Helper
 */
const successResponse = (res, statusCode = 200, message = 'Success', data = null, extraProps = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    serviceResult: data, // For compatibility with existing frontend expectations
    ...extraProps,
  });
};

const errorResponse = (res, statusCode = 500, message = 'Internal Server Error', error = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: error || message,
  });
};

module.exports = {
  successResponse,
  errorResponse,
};
