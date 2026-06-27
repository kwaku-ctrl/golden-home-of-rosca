const db = require('../utils/supabaseDatabase');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { streamCursorAsCSV } = require('../utils/csvStream');

exports.createSaving = catchAsync(async (req, res, next) => {
  const { amount, frequency, targetDate, description } = req.body;
  if (!amount) {
    return next(new AppError('A saving amount is required', 400));
  }
  try {
    const saving = await db.createSaving({
      user: req.user.id,
      amount,
      balance: amount,
      frequency,
      target_date: targetDate,
      description
    });
    res.status(201).json({ status: 'success', data: { saving } });
  } catch (error) {
    return next(new AppError('Failed to create saving account', 500));
  }
});

exports.getSavings = catchAsync(async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, parseInt(req.query.limit, 10) || 20);
    const filters = req.user.role === 'member' ? { user: req.user.id } : {};

    if (req.query.export === 'csv') {
      const keys = ['id', 'user', 'account_type', 'account_number', 'balance', 'status', 'created_at'];
      const savings = await db.getSavingsByUser(req.user.id, filters);
      res.attachment('savings.csv');
      return streamCursorAsCSV(res, savings, keys, (r) => ({
        id: r.id,
        user: r.user,
        account_type: r.account_type,
        account_number: r.account_number,
        balance: r.balance,
        status: r.status,
        created_at: r.created_at
      }));
    }

    const paginatedResult = await db.paginatedQuery('savings', filters, page, limit);
    res.status(200).json({
      status: 'success',
      results: paginatedResult.data.length,
      page: paginatedResult.page,
      total: paginatedResult.total,
      data: { savings: paginatedResult.data }
    });
  } catch (error) {
    res.status(200).json({ status: 'success', results: 0, page: 1, total: 0, data: { savings: [] } });
  }
});

exports.getSaving = catchAsync(async (req, res, next) => {
  try {
    const saving = await db.getSavingById(req.params.id);
    if (!saving) return next(new AppError('Saving record not found', 404));
    if (req.user.role === 'member' && saving.user !== req.user.id) {
      return next(new AppError('Not authorized to access this saving account', 403));
    }
    res.status(200).json({ status: 'success', data: { saving } });
  } catch (error) {
    return next(new AppError('Failed to fetch saving record', 500));
  }
});

exports.updateSaving = catchAsync(async (req, res, next) => {
  const allowed = ['amount', 'frequency', 'status', 'target_date', 'description'];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });
  try {
    const saving = await db.updateSaving(req.params.id, updates);
    if (!saving) return next(new AppError('Saving record not found', 404));
    res.status(200).json({ status: 'success', data: { saving } });
  } catch (error) {
    return next(new AppError('Failed to update saving record', 500));
  }
});

exports.deleteSaving = catchAsync(async (req, res, next) => {
  try {
    await db.deleteSaving(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    return next(new AppError('Failed to delete saving record', 500));
  }
});
