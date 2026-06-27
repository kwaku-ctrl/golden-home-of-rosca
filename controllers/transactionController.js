const db = require('../utils/supabaseDatabase');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { streamCursorAsCSV } = require('../utils/csvStream');

const generateReference = () => `txn_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

exports.createTransaction = catchAsync(async (req, res, next) => {
  const { type, amount, currency, meta } = req.body;
  if (!type || !amount) {
    return next(new AppError('Transaction type and amount are required', 400));
  }
  try {
    const transaction = await db.createTransaction({
      user: req.user.id,
      type,
      amount,
      currency: currency || 'GHS',
      meta: meta || {},
      reference: generateReference(),
      status: 'completed'
    });
    res.status(201).json({ status: 'success', data: { transaction } });
  } catch (error) {
    return next(new AppError('Failed to create transaction', 500));
  }
});

exports.getTransactions = catchAsync(async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, parseInt(req.query.limit, 10) || 20);
    const type = req.query.type;
    const filters = req.user.role === 'member' ? { user: req.user.id } : {};
    if (type) filters.type = type;

    if (req.query.export === 'csv') {
      const keys = ['id', 'user', 'type', 'amount', 'currency', 'status', 'reference', 'created_at'];
      const transactions = await db.getTransactionsByUser(req.user.id, filters);
      res.attachment('transactions.csv');
      return streamCursorAsCSV(res, transactions, keys, (r) => ({
        id: r.id,
        user: r.user,
        type: r.type,
        amount: r.amount,
        currency: r.currency,
        status: r.status,
        reference: r.reference,
        created_at: r.created_at
      }));
    }

    const paginatedResult = await db.paginatedQuery('transactions', filters, page, limit);
    res.status(200).json({
      status: 'success',
      results: paginatedResult.data.length,
      page: paginatedResult.page,
      total: paginatedResult.total,
      data: { transactions: paginatedResult.data }
    });
  } catch (error) {
    res.status(200).json({ status: 'success', results: 0, page: 1, total: 0, data: { transactions: [] } });
  }
});

exports.getTransaction = catchAsync(async (req, res, next) => {
  try {
    const transaction = await db.getTransactionById(req.params.id);
    if (!transaction) return next(new AppError('Transaction not found', 404));
    if (req.user.role === 'member' && transaction.user !== req.user.id) {
      return next(new AppError('Not authorized to access this transaction', 403));
    }
    res.status(200).json({ status: 'success', data: { transaction } });
  } catch (error) {
    return next(new AppError('Failed to fetch transaction', 500));
  }
});

exports.deleteTransaction = catchAsync(async (req, res, next) => {
  try {
    await db.deleteTransaction(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    return next(new AppError('Failed to delete transaction', 500));
  }
});
