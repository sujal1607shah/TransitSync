const express = require('express');
const router = express.Router();
const { getExpenses, createExpense } = require('../controllers/expense.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

router.get('/', authenticateUser, getExpenses);
router.post('/', authenticateUser, createExpense);

module.exports = router;
