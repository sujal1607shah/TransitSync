const Expense = require('../models/Expense');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Get Expenses List & Summary
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({}).sort({ date: -1 });

    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const fuelExpense = expenses.filter((e) => e.category === 'FUEL').reduce((sum, e) => sum + e.amount, 0);
    const maintenanceExpense = expenses.filter((e) => e.category === 'MAINTENANCE').reduce((sum, e) => sum + e.amount, 0);

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

// @desc    Create New Expense Log
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
  try {
    const { vehicleID, tripID, category, amount, currency, description } = req.body;

    const expense = await Expense.create({
      vehicleID,
      tripID,
      category: category || 'FUEL',
      amount: amount || 0,
      currency: currency || 'INR (Rs)',
      description,
      createdBy: req.user._id,
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
