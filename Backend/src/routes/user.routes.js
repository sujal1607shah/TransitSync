const express = require('express');
const router = express.Router();
const { createUser, getUsers, getUserById, updateUser, deleteUser } = require('../controllers/user.controller');
const { authenticateUser, optionalAuth } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.post('/create', optionalAuth, createUser);
router.get('/', authenticateUser, getUsers);
router.get('/:id', authenticateUser, getUserById);
router.put('/:id', authenticateUser, updateUser);
router.delete('/:id', authenticateUser, authorizeRoles('ADMIN', 'ROLE_ADMIN', 'DISPATCHER', 'ROLE_DISPATCHER'), deleteUser);

module.exports = router;
