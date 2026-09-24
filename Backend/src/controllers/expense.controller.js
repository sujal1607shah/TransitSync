const Expense = require('../models/Expense');
const AuditLog = require('../models/AuditLog');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Get Expenses List & Summary for Caller's Organization
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const expenses = await Expense.find({ organizationId: orgId }).sort({ date: -1 });

    const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const fuelExpense = expenses.filter((e) => e.category === 'FUEL').reduce((sum, e) => sum + (e.amount || 0), 0);
    const maintenanceExpense = expenses.filter((e) => e.category === 'MAINTENANCE').reduce((sum, e) => sum + (e.amount || 0), 0);

    return successResponse(res, 200, 'Expenses retrieved', {
      expenses,
      metrics: {
        totalExpense,
        fuelExpense,
        maintenanceExpense,
      },
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Create New Expense Log in Caller's Organization
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
  try {
    const { vehicleID, tripID, category, amount, currency, description } = req.body;
    const orgId = req.user.organizationId;

    const expense = await Expense.create({
      organizationId: orgId,
      vehicleID,
      tripID,
      category: category || 'FUEL',
      amount: amount || 0,
      currency: currency || 'INR (Rs)',
      description,
      createdBy: req.user._id,
    });

    await AuditLog.create({
      organizationId: orgId,
      userId: req.user._id,
      action: 'EXPENSE_LOGGED',
      resource: 'Expense',
      resourceId: expense._id.toString(),
      details: { amount: expense.amount, category: expense.category },
    });

    return successResponse(res, 201, 'Expense logged successfully', expense);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getExpenses,
  createExpense,
};
