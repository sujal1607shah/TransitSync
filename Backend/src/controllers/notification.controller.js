const Notification = require('../models/Notification');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Get Notifications for Current User
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const list = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 });
    return successResponse(res, 200, 'Notifications retrieved', list);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Mark Notification Read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    return successResponse(res, 200, 'Notification marked read', notification);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getNotifications,
  markRead,
};
