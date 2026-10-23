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

const path = require('path');
const fs = require('fs');
const { generateExpensePDF } = require('../services/pdf.service');
const Organization = require('../models/Organization');

// @desc    Download / Generate Expenses PDF Statement
// @route   GET /api/expenses/pdf or POST /api/expenses/pdf
// @access  Private (Admin & Dispatcher only)
const exportExpensesPDF = async (req, res) => {
  try {
    const role = req.user.role;
    const isAuthorized =
      role === 'ROLE_ADMIN' ||
      role === 'ADMIN' ||
      role === 'ROLE_DISPATCHER' ||
      role === 'DISPATCHER';

    if (!isAuthorized) {
      return errorResponse(res, 403, 'Access denied: Only Admins and Dispatchers can download expense statements');
    }

    const orgId = req.user.organizationId;
    const org = await Organization.findById(orgId).select('name code');

    // Accept optional custom items or filters from body/query
    let { items, period, startDate, endDate } = req.body || {};
    if (!items || !Array.isArray(items) || items.length === 0) {
      // Query from DB
      let query = { organizationId: orgId };
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }
      items = await Expense.find(query).sort({ date: -1 }).lean();
    }

    // Compute metrics
    const totalExpense = items.reduce((sum, e) => sum + (Number(e.amount || e.cost) || 0), 0);
    const fuelExpense = items
      .filter((e) => (e.category || '').toUpperCase() === 'FUEL' || e.liters)
      .reduce((sum, e) => sum + (Number(e.amount || e.cost) || 0), 0);
    const maintenanceExpense = items
      .filter((e) => (e.category || '').toUpperCase() === 'MAINTENANCE' || e.maint)
      .reduce((sum, e) => sum + (Number(e.amount || e.maint || e.cost) || 0), 0);
    const tollExpense = items
      .filter((e) => (e.category || '').toUpperCase() === 'TOLL' || e.toll)
      .reduce((sum, e) => sum + (Number(e.amount || e.toll || e.cost) || 0), 0);
    const otherExpense = totalExpense - (fuelExpense + maintenanceExpense + tollExpense);

    // Ensure uploads/documents folder
    const uploadDir = path.join(__dirname, '../../uploads/documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const timestamp = Date.now();
    const pdfFileName = `TransitSync_Expense_Report_${timestamp}.pdf`;
    const outputPath = path.join(uploadDir, pdfFileName);

    const reportData = {
      organizationName: org?.name || 'TransitSync Organization',
      organizationCode: org?.code || 'TS-CORP',
      generatedByName: req.user.name || 'Staff User',
      generatedByRole: req.user.role === 'ROLE_ADMIN' || req.user.role === 'ADMIN' ? 'Fleet Admin' : 'Operations Dispatcher',
      generatedAt: new Date(),
      period: period || (startDate && endDate ? `${startDate} to ${endDate}` : 'Complete Audit Statement'),
      metrics: {
        totalExpense,
        fuelExpense,
        maintenanceExpense,
        tollExpense,
        otherExpense: otherExpense > 0 ? otherExpense : 0,
      },
      items,
    };

    await generateExpensePDF(reportData, outputPath);

    const downloadUrl = `/uploads/documents/${pdfFileName}`;

    // If query ?download=true or header requests file stream
    if (req.query.download === 'true') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${pdfFileName}"`);
      return fs.createReadStream(outputPath).pipe(res);
    }

    return successResponse(res, 200, 'Expense PDF statement generated successfully', {
      downloadUrl,
      fileName: pdfFileName,
      metrics: reportData.metrics,
      recordCount: items.length,
      fileSize: fs.statSync(outputPath).size,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getExpenses,
  createExpense,
  exportExpensesPDF,
};

