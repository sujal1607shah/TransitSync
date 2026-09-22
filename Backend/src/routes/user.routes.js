const express = require('express');
const router = express.Router();
const { createUser, getUsers, getUserById, updateUser, deleteUser } = require('../controllers/user.controller');
const { authenticateUser } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.post('/create', createUser);
router.get('/', authenticateUser, getUsers);
router.get('/:id', authenticateUser, getUserById);
router.put('/:id', authenticateUser, updateUser);
router.delete('/:id', authenticateUser, authorizeRoles('ADMIN'), deleteUser);

module.exports = router;
