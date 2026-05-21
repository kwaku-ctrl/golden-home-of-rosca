const Saving = require('../models/savingModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.createSaving = catchAsync(async (req, res, next) => {
  const { amount, frequency, targetDate, description } = req.body;
  if (!amount) {
    return next(new AppError('A saving amount is required', 400));
  }
  const saving = await Saving.create({
    user: req.user._id,
    amount,
    balance: amount,
    frequency,
    targetDate,
    description
  });
  res.status(201).json({ status: 'success', data: { saving } });
});

const { streamCursorAsCSV } = require('../utils/csvStream');

exports.getSavings = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(200, parseInt(req.query.limit, 10) || 20);
  const skip = (page - 1) * limit;
  const q = req.query.q;
  const filter = req.user.role === 'member' ? { user: req.user._id } : {};
  if (q) {
    const re = new RegExp(q, 'i');
    filter.$or = [{ accountType: re }, { accountNumber: re }];
  }

  if (req.query.export === 'csv') {
    const keys = ['_id', 'user', 'accountType', 'accountNumber', 'balance', 'status', 'createdAt'];
    const cursor = Saving.find(filter).populate('user', 'fullName email').sort({ createdAt: -1 }).cursor();
    res.attachment('savings.csv');
    return streamCursorAsCSV(res, cursor, keys, (r) => ({
      _id: r._id,
      user: r.user?.fullName || r.user?.email || '',
      accountType: r.accountType,
      accountNumber: r.accountNumber,
      balance: r.balance,
      status: r.status,
      createdAt: r.createdAt
    }));
  }

  const total = await Saving.countDocuments(filter);
  const savings = await Saving.find(filter).populate('user', 'fullName email').sort({ createdAt: -1 }).skip(skip).limit(limit);
  res.status(200).json({ status: 'success', results: savings.length, page, total, data: { savings } });
});

exports.getSaving = catchAsync(async (req, res, next) => {
  const saving = await Saving.findById(req.params.id);
  if (!saving) return next(new AppError('Saving record not found', 404));
  if (req.user.role === 'member' && saving.user.toString() !== req.user.id) {
    return next(new AppError('Not authorized to access this saving account', 403));
  }
  res.status(200).json({ status: 'success', data: { saving } });
});

exports.updateSaving = catchAsync(async (req, res, next) => {
  const allowed = ['amount', 'frequency', 'status', 'targetDate', 'description'];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });
  const saving = await Saving.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true
  });
  if (!saving) return next(new AppError('Saving record not found', 404));
  res.status(200).json({ status: 'success', data: { saving } });
});

exports.deleteSaving = catchAsync(async (req, res, next) => {
  const saving = await Saving.findByIdAndDelete(req.params.id);
  if (!saving) return next(new AppError('Saving record not found', 404));
  res.status(204).json({ status: 'success', data: null });
});
