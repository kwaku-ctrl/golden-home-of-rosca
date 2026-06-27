const db = require('../utils/supabaseDatabase');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { streamCursorAsCSV } = require('../utils/csvStream');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) newObj[key] = obj[key];
  });
  return newObj;
};

exports.getUserProfile = catchAsync(async (req, res, next) => {
  try {
    const user = await db.getUserById(req.user.id);
    if (!user) return next(new AppError('User not found', 404));
    res.status(200).json({ status: 'success', data: { user } });
  } catch (error) {
    return next(new AppError('Failed to fetch user profile', 500));
  }
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.role) {
    return next(new AppError('This route is not for password or role updates', 400));
  }
  const filteredBody = filterObj(req.body, 'full_name', 'name', 'phone', 'profile_image', 'address', 'occupation');
  if (filteredBody.name && !filteredBody.full_name) {
    filteredBody.full_name = filteredBody.name;
    delete filteredBody.name;
  }
  try {
    const updatedUser = await db.updateUser(req.user.id, filteredBody);
    res.status(200).json({ status: 'success', data: { user: updatedUser } });
  } catch (error) {
    return next(new AppError('Failed to update user profile', 500));
  }
});

exports.getUsers = catchAsync(async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;
    const q = req.query.q;
    const filters = {};
    if (req.query.role) filters.role = req.query.role;

    if (req.query.export === 'csv') {
      const keys = ['id', 'full_name', 'email', 'phone', 'role', 'active', 'created_at'];
      const users = await db.getAllUsers(filters);
      res.attachment('users.csv');
      return streamCursorAsCSV(res, users, keys, (d) => ({
        id: d.id,
        full_name: d.full_name,
        email: d.email,
        phone: d.phone,
        role: d.role,
        active: d.active,
        created_at: d.created_at
      }));
    }

    const paginatedResult = await db.paginatedQuery('users', filters, page, limit);
    res.status(200).json({
      status: 'success',
      results: paginatedResult.data.length,
      page: paginatedResult.page,
      total: paginatedResult.total,
      data: { users: paginatedResult.data }
    });
  } catch (error) {
    return next(new AppError('Failed to fetch users', 500));
  }
});

exports.getUser = catchAsync(async (req, res, next) => {
  try {
    const user = await db.getUserById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));
    res.status(200).json({ status: 'success', data: { user } });
  } catch (error) {
    return next(new AppError('Failed to fetch user', 500));
  }
});

exports.updateUser = catchAsync(async (req, res, next) => {
  try {
    const filteredBody = filterObj(req.body, 'full_name', 'name', 'phone', 'role', 'profile_image', 'address', 'occupation', 'verification_status', 'active');
    const user = await db.updateUser(req.params.id, filteredBody);
    if (!user) return next(new AppError('User not found', 404));
    res.status(200).json({ status: 'success', data: { user } });
  } catch (error) {
    return next(new AppError('Failed to update user', 500));
  }
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  try {
    const user = await db.updateUser(req.params.id, { active: false });
    if (!user) return next(new AppError('User not found', 404));
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    return next(new AppError('Failed to delete user', 500));
  }
});
