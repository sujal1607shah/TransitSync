const express = require('express');
const router = express.Router();
const { getExpenses, createExpense, exportExpensesPDF } = require('../controllers/expense.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

router.get('/', authenticateUser, getExpenses);
router.post('/', authenticateUser, createExpense);
router.get('/pdf', authenticateUser, exportExpensesPDF);
router.post('/pdf', authenticateUser, exportExpensesPDF);

module.exports = router;
