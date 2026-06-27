const db = require('../utils/supabaseDatabase');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.createRepayment = catchAsync(async (req, res, next) => {
  const { loanId, dueDate, amountDue, paymentProvider, paymentReference } = req.body;
  if (!loanId || !dueDate || !amountDue) {
    return next(new AppError('Loan ID, due date and amount due are required', 400));
  }

  try {
    const loan = await db.getLoanById(loanId);
    if (!loan) {
      return next(new AppError('Loan not found', 404));
    }

    const repayment = await db.createRepayment({
      loan: loanId,
      user: req.user.id,
      due_date: dueDate,
      amount_due: amountDue,
      payment_provider: paymentProvider || 'mobile_money',
      payment_reference: paymentReference
    });

    res.status(201).json({ status: 'success', data: { repayment } });
  } catch (error) {
    return next(new AppError('Failed to create repayment', 500));
  }
});

exports.getRepayments = catchAsync(async (req, res, next) => {
  try {
    const filters = req.user.role === 'member' ? { user: req.user.id } : {};
    const repayments = await db.getRepaymentsByUser(req.user.id);
    res.status(200).json({ status: 'success', results: repayments.length, data: { repayments } });
  } catch (error) {
    return next(new AppError('Failed to fetch repayments', 500));
  }
});

exports.getRepayment = catchAsync(async (req, res, next) => {
  try {
    const repayment = await db.getRepaymentById(req.params.id);
    if (!repayment) return next(new AppError('Repayment not found', 404));
    if (req.user.role === 'member' && repayment.user !== req.user.id) {
      return next(new AppError('Not authorized to view this repayment', 403));
    }
    res.status(200).json({ status: 'success', data: { repayment } });
  } catch (error) {
    return next(new AppError('Failed to fetch repayment', 500));
  }
});

exports.updateRepayment = catchAsync(async (req, res, next) => {
  const updates = {};
  ['due_date', 'amount_due', 'amount_paid', 'status', 'paid_at', 'payment_reference', 'payment_provider'].forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  try {
    const repayment = await db.updateRepayment(req.params.id, updates);

    if (!repayment) {
      return next(new AppError('Repayment not found', 404));
    }

    res.status(200).json({ status: 'success', data: { repayment } });
  } catch (error) {
    return next(new AppError('Failed to update repayment', 500));
  }
});

exports.deleteRepayment = catchAsync(async (req, res, next) => {
  try {
    await db.deleteRepayment(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    return next(new AppError('Failed to delete repayment', 500));
  }
});
