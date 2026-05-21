const Transaction = require('../models/transactionModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const generateReference = () => `txn_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

exports.createTransaction = catchAsync(async (req, res, next) => {
  const { type, amount, currency, meta } = req.body;
  if (!type || !amount) {
    return next(new AppError('Transaction type and amount are required', 400));
  }
  const transaction = await Transaction.create({
    user: req.user._id,
    type,
    amount,
    currency: currency || 'GHS',
    meta: meta || {},
    reference: generateReference(),
    status: 'completed'
  });
  res.status(201).json({ status: 'success', data: { transaction } });
});

const { streamCursorAsCSV } = require('../utils/csvStream');

exports.getTransactions = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(200, parseInt(req.query.limit, 10) || 20);
  const skip = (page - 1) * limit;
  const q = req.query.q;
  const type = req.query.type;
  const filter = req.user.role === 'member' ? { user: req.user._id } : {};
  if (type) filter.type = type;
  if (q) {
    const re = new RegExp(q, 'i');
    filter.$or = [{ reference: re }, { providerReference: re }];
  }

  if (req.query.export === 'csv') {
    const keys = ['_id', 'user', 'type', 'amount', 'currency', 'status', 'reference', 'createdAt'];
    const cursor = Transaction.find(filter).populate('user', 'fullName email').sort({ createdAt: -1 }).cursor();
    res.attachment('transactions.csv');
    return streamCursorAsCSV(res, cursor, keys, (r) => ({
      _id: r._id,
      user: r.user?.fullName || r.user?.email || '',
      type: r.type,
      amount: r.amount,
      currency: r.currency,
      status: r.status,
      reference: r.reference,
      createdAt: r.createdAt
    }));
  }

  const total = await Transaction.countDocuments(filter);
  const transactions = await Transaction.find(filter).populate('user', 'fullName email').sort({ createdAt: -1 }).skip(skip).limit(limit);
  res.status(200).json({ status: 'success', results: transactions.length, page, total, data: { transactions } });
});

exports.getTransaction = catchAsync(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id);
  if (!transaction) return next(new AppError('Transaction not found', 404));
  if (req.user.role === 'member' && transaction.user.toString() !== req.user.id) {
    return next(new AppError('Not authorized to access this transaction', 403));
  }
  res.status(200).json({ status: 'success', data: { transaction } });
});

exports.deleteTransaction = catchAsync(async (req, res, next) => {
  const transaction = await Transaction.findByIdAndDelete(req.params.id);
  if (!transaction) return next(new AppError('Transaction not found', 404));
  res.status(204).json({ status: 'success', data: null });
});
