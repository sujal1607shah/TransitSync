const Issue = require('../models/Issue');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Create / Report Issue ("Mess It Up")
// @route   POST /api/issues
// @access  Private
const createIssue = async (req, res) => {
  try {
    const { category, issueType, severity, description, vehicleID, photos } = req.body;

    const generatedId = `#ISS-${Math.floor(1000 + Math.random() * 9000)}`;

    const issue = await Issue.create({
      issueId: generatedId,
      reportedBy: req.user._id,
      driverName: req.user.name || 'Alex Driver',
      vehicleID: vehicleID || 'GJ01AB1234',
      category: category || 'VEHICLE_ISSUE',
      issueType: issueType || 'Engine Problem',
      severity: severity || 'High',
      description: description || 'Engine making unusual noise since morning...',
      photos: photos || [],
      status: 'SUBMITTED',
    });

    return successResponse(res, 201, 'Issue reported successfully', issue);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get All Reported Issues
// @route   GET /api/issues
// @access  Private
const getIssues = async (req, res) => {
  try {
    const { status, severity } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (severity) filter.severity = severity;

    const issues = await Issue.find(filter).populate('reportedBy', 'name email role').sort({ createdAt: -1 });
    return successResponse(res, 200, 'Issues retrieved successfully', issues);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get Issue By ID
// @route   GET /api/issues/:id
// @access  Private
const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findOne({
      $or: [{ issueId: req.params.id }, { _id: req.params.id }],
    });
    if (!issue) {
      return errorResponse(res, 404, 'Issue not found');
    }
    return successResponse(res, 200, 'Issue retrieved', issue);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Update Issue Status
// @route   PATCH /api/issues/:id/status
// @access  Private/Dispatcher/Admin
const updateIssueStatus = async (req, res) => {
  try {
    const { status, assignedTo } = req.body;
    const issue = await Issue.findOneAndUpdate(
      { $or: [{ issueId: req.params.id }, { _id: req.params.id }] },
      {
        status,
        ...(assignedTo ? { assignedTo } : {}),
        ...(status === 'RESOLVED' || status === 'Resolved' ? { resolvedAt: new Date() } : {}),
      },
      { new: true }
    );

    if (!issue) {
      return errorResponse(res, 404, 'Issue not found');
    }

    return successResponse(res, 200, 'Issue status updated', issue);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Delete Issue
// @route   DELETE /api/issues/:id
// @access  Private/Admin
const deleteIssue = async (req, res) => {
  try {
    await Issue.findOneAndDelete({ $or: [{ issueId: req.params.id }, { _id: req.params.id }] });
    return successResponse(res, 200, 'Issue deleted');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  createIssue,
  getIssues,
  getIssueById,
  updateIssueStatus,
  deleteIssue,
};
