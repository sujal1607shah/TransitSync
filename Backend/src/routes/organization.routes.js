const express = require('express');
const router = express.Router();
const {
  registerOrganization,
  createOrganization,
  getMyOrganization,
  updateMyOrganization,
} = require('../controllers/organization.controller');
const { authenticateUser } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

// Public onboarding
router.post('/register', registerOrganization);
router.post('/', createOrganization);

// Protected tenant settings
router.get('/me', authenticateUser, getMyOrganization);
router.put('/me', authenticateUser, authorizeRoles('ADMIN', 'ROLE_ADMIN'), updateMyOrganization);

module.exports = router;
