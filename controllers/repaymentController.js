const Repayment = require('../models/repaymentModel');
const Loan = require('../models/loanModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.createRepayment = catchAsync(async (req, res, next) => {
  const { loanId, dueDate, amountDue, paymentProvider, paymentReference } = req.body;
  if (!loanId || !dueDate || !amountDue) {
    return next(new AppError('Loan ID, due date and amount due are required', 400));
  }

  const loan = await Loan.findById(loanId);
  if (!loan) {
    return next(new AppError('Loan not found', 404));
  }

  const repayment = await Repayment.create({
    loan: loanId,
    user: req.user._id,
    dueDate,
    amountDue,
    paymentProvider: paymentProvider || 'mobile_money',
    paymentReference
  });

  res.status(201).json({ status: 'success', data: { repayment } });
});

exports.getRepayments = catchAsync(async (req, res) => {
  const filter = req.user.role === 'member' ? { user: req.user._id } : {};
  const repayments = await Repayment.find(filter).populate('loan', 'amount durationMonths status');
  res.status(200).json({ status: 'success', results: repayments.length, data: { repayments } });
});

exports.getRepayment = catchAsync(async (req, res, next) => {
  const repayment = await Repayment.findById(req.params.id).populate('loan', 'amount durationMonths status');
  if (!repayment) return next(new AppError('Repayment not found', 404));
  if (req.user.role === 'member' && repayment.user.toString() !== req.user.id) {
    return next(new AppError('Not authorized to view this repayment', 403));
  }
  res.status(200).json({ status: 'success', data: { repayment } });
});

exports.updateRepayment = catchAsync(async (req, res, next) => {
  const updates = {};
  ['dueDate', 'amountDue', 'amountPaid', 'status', 'paidAt', 'paymentReference', 'paymentProvider'].forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const repayment = await Repayment.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true
  });

  if (!repayment) {
    return next(new AppError('Repayment not found', 404));
  }

  res.status(200).json({ status: 'success', data: { repayment } });
});

exports.deleteRepayment = catchAsync(async (req, res, next) => {
  const repayment = await Repayment.findByIdAndDelete(req.params.id);
  if (!repayment) {
    return next(new AppError('Repayment not found', 404));
  }
  res.status(204).json({ status: 'success', data: null });
});
