const Loan = require('../models/loanModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.createLoan = catchAsync(async (req, res, next) => {
  const { amount, durationMonths, termMonths, interestRate, purpose, loanType } = req.body;
  const duration = durationMonths || termMonths;
  if (!amount || !duration || !interestRate) {
    return next(new AppError('Amount, duration, and interest rate are required', 400));
  }
  const loan = await Loan.create({
    user: req.user.id,
    loanType: loanType || 'personal',
    amount,
    durationMonths: duration,
    interestRate,
    purpose
  });
  res.status(201).json({ status: 'success', data: { loan } });
});

const { streamCursorAsCSV } = require('../utils/csvStream');

exports.getLoans = catchAsync(async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;
    const q = req.query.q;
    const status = req.query.status;
    const filter = req.user.role === 'member' ? { user: req.user.id } : {};
    if (status) filter.status = status;
    if (q) {
      const re = new RegExp(q, 'i');
      filter.$or = [{ purpose: re }, { loanType: re }, { 'user.fullName': re }];
    }

    if (req.query.export === 'csv') {
      const keys = ['_id', 'user', 'amount', 'durationMonths', 'interestRate', 'status', 'createdAt'];
      const cursor = Loan.find(filter).populate('user', 'fullName email').sort({ createdAt: -1 }).cursor();
      res.attachment('loans.csv');
      return streamCursorAsCSV(res, cursor, keys, (r) => ({
        _id: r._id,
        user: r.user?.fullName || r.user?.email || '',
        amount: r.amount,
        durationMonths: r.durationMonths,
        interestRate: r.interestRate,
        status: r.status,
        createdAt: r.createdAt
      }));
    }

    const total = await Loan.countDocuments(filter);
    const loans = await Loan.find(filter).populate('user', 'fullName email').sort({ createdAt: -1 }).skip(skip).limit(limit);
    res.status(200).json({ status: 'success', results: loans.length, page, total, data: { loans } });
  } catch (error) {
    // Return empty results if database is unavailable
    res.status(200).json({ status: 'success', results: 0, page: 1, total: 0, data: { loans: [] } });
  }
});

exports.getLoan = catchAsync(async (req, res, next) => {
  const loan = await Loan.findById(req.params.id);
  if (!loan) return next(new AppError('Loan not found', 404));
  if (req.user.role === 'member' && loan.user.toString() !== req.user.id) {
    return next(new AppError('Not authorized to access this loan', 403));
  }
  res.status(200).json({ status: 'success', data: { loan } });
});

exports.updateLoan = catchAsync(async (req, res, next) => {
  const updates = req.body;
  const loan = await Loan.findById(req.params.id);
  if (!loan) return next(new AppError('Loan not found', 404));
  Object.assign(loan, updates);
  await loan.save();
  res.status(200).json({ status: 'success', data: { loan } });
});

exports.deleteLoan = catchAsync(async (req, res, next) => {
  const loan = await Loan.findByIdAndDelete(req.params.id);
  if (!loan) return next(new AppError('Loan not found', 404));
  res.status(204).json({ status: 'success', data: null });
});
