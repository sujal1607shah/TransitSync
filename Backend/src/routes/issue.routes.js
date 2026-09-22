const express = require('express');
const router = express.Router();
const { createIssue, getIssues, getIssueById, updateIssueStatus, deleteIssue } = require('../controllers/issue.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

router.post('/', authenticateUser, createIssue);
router.get('/', authenticateUser, getIssues);
router.get('/:id', authenticateUser, getIssueById);
router.patch('/:id/status', authenticateUser, updateIssueStatus);
router.delete('/:id', authenticateUser, deleteIssue);

module.exports = router;
