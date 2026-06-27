const db = require('../utils/supabaseDatabase');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { streamCursorAsCSV } = require('../utils/csvStream');

exports.createLoan = catchAsync(async (req, res, next) => {
  const { amount, durationMonths, termMonths, interestRate, purpose, loanType } = req.body;
  const duration = durationMonths || termMonths;
  if (!amount || !duration || !interestRate) {
    return next(new AppError('Amount, duration, and interest rate are required', 400));
  }
  try {
    const loan = await db.createLoan({
      user: req.user.id,
      loan_type: loanType || 'personal',
      amount,
      duration_months: duration,
      interest_rate: interestRate,
      purpose
    });
    res.status(201).json({ status: 'success', data: { loan } });
  } catch (error) {
    return next(new AppError('Failed to create loan', 500));
  }
});

exports.getLoans = catchAsync(async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, parseInt(req.query.limit, 10) || 20);
    const status = req.query.status;
    const filters = req.user.role === 'member' ? { user: req.user.id } : {};
    if (status) filters.status = status;

    if (req.query.export === 'csv') {
      const keys = ['id', 'user', 'amount', 'duration_months', 'interest_rate', 'status', 'created_at'];
      const loans = await db.getLoansByUser(req.user.id, filters);
      res.attachment('loans.csv');
      return streamCursorAsCSV(res, loans, keys, (r) => ({
        id: r.id,
        user: r.user,
        amount: r.amount,
        duration_months: r.duration_months,
        interest_rate: r.interest_rate,
        status: r.status,
        created_at: r.created_at
      }));
    }

    const paginatedResult = await db.paginatedQuery('loans', filters, page, limit);
    res.status(200).json({
      status: 'success',
      results: paginatedResult.data.length,
      page: paginatedResult.page,
      total: paginatedResult.total,
      data: { loans: paginatedResult.data }
    });
  } catch (error) {
    res.status(200).json({ status: 'success', results: 0, page: 1, total: 0, data: { loans: [] } });
  }
});

exports.getLoan = catchAsync(async (req, res, next) => {
  try {
    const loan = await db.getLoanById(req.params.id);
    if (!loan) return next(new AppError('Loan not found', 404));
    if (req.user.role === 'member' && loan.user !== req.user.id) {
      return next(new AppError('Not authorized to access this loan', 403));
    }
    res.status(200).json({ status: 'success', data: { loan } });
  } catch (error) {
    return next(new AppError('Failed to fetch loan', 500));
  }
});

exports.updateLoan = catchAsync(async (req, res, next) => {
  try {
    const loan = await db.updateLoan(req.params.id, req.body);
    if (!loan) return next(new AppError('Loan not found', 404));
    res.status(200).json({ status: 'success', data: { loan } });
  } catch (error) {
    return next(new AppError('Failed to update loan', 500));
  }
});

exports.deleteLoan = catchAsync(async (req, res, next) => {
  try {
    await db.deleteLoan(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    return next(new AppError('Failed to delete loan', 500));
  }
});
