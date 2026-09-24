const Issue = require('../models/Issue');
const AuditLog = require('../models/AuditLog');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Create / Report Issue ("Mess It Up") in Caller's Organization
// @route   POST /api/issues
// @access  Private
const createIssue = async (req, res) => {
  try {
    const { category, issueType, severity, description, vehicleID, photos } = req.body;
    const orgId = req.user.organizationId;
    const generatedId = `#ISS-${Math.floor(1000 + Math.random() * 9000)}`;

    const issue = await Issue.create({
      organizationId: orgId,
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

    await AuditLog.create({
      organizationId: orgId,
      userId: req.user._id,
      action: 'ISSUE_REPORTED',
      resource: 'Issue',
      resourceId: issue._id.toString(),
      details: { issueId: issue.issueId, category: issue.category, severity: issue.severity },
    });

    return successResponse(res, 201, 'Issue reported successfully', issue);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get All Reported Issues for Caller's Organization
// @route   GET /api/issues
// @access  Private
const getIssues = async (req, res) => {
  try {
    const { status, severity } = req.query;
    let filter = { organizationId: req.user.organizationId };

    if (status) filter.status = status;
    if (severity) filter.severity = severity;

    const issues = await Issue.find(filter).populate('reportedBy', 'name email role').sort({ createdAt: -1 });
    return successResponse(res, 200, 'Issues retrieved successfully', issues);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get Issue By ID (Scoped to Organization)
// @route   GET /api/issues/:id
// @access  Private
const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findOne({
      $or: [{ issueId: req.params.id }, { _id: req.params.id }],
      organizationId: req.user.organizationId,
    });
    if (!issue) {
      return errorResponse(res, 404, 'Issue not found in your organization');
    }
    return successResponse(res, 200, 'Issue retrieved', issue);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Update Issue Status (Scoped to Organization)
// @route   PATCH /api/issues/:id/status
// @access  Private/Dispatcher/Admin
const updateIssueStatus = async (req, res) => {
  try {
    const { status, assignedTo } = req.body;
    const issue = await Issue.findOneAndUpdate(
      {
        $or: [{ issueId: req.params.id }, { _id: req.params.id }],
        organizationId: req.user.organizationId,
      },
      {
        status,
        ...(assignedTo ? { assignedTo } : {}),
        ...(status === 'RESOLVED' || status === 'Resolved' ? { resolvedAt: new Date() } : {}),
      },
      { new: true }
    );

    if (!issue) {
      return errorResponse(res, 404, 'Issue not found in your organization');
    }

    return successResponse(res, 200, 'Issue status updated', issue);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Delete Issue (Scoped to Organization)
// @route   DELETE /api/issues/:id
// @access  Private/Admin
const deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findOneAndDelete({
      $or: [{ issueId: req.params.id }, { _id: req.params.id }],
      organizationId: req.user.organizationId,
    });

    if (!issue) {
      return errorResponse(res, 404, 'Issue not found in your organization');
    }

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
