const db = require('../utils/supabaseDatabase');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.createAdminUser = catchAsync(async (req, res, next) => {
  const { userId, department, permissions, accessLevel } = req.body;
  if (!userId) {
    return next(new AppError('User ID is required to create an admin record', 400));
  }

  try {
    const user = await db.getUserById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (!['admin', 'super-admin'].includes(user.role)) {
      return next(new AppError('User role must be admin or super-admin to create admin metadata', 400));
    }

    const adminUser = await db.createAdminUser({
      user: userId,
      department,
      permissions: permissions || ['manage_users', 'manage_loans', 'manage_savings', 'manage_transactions'],
      access_level: accessLevel || user.role
    });

    res.status(201).json({ status: 'success', data: { adminUser } });
  } catch (error) {
    return next(new AppError('Failed to create admin user', 500));
  }
});

exports.getAdminUsers = catchAsync(async (req, res, next) => {
  try {
    const adminUsers = await db.getAllAdminUsers();
    res.status(200).json({ status: 'success', results: adminUsers.length, data: { adminUsers } });
  } catch (error) {
    return next(new AppError('Failed to fetch admin users', 500));
  }
});

exports.getAdminUser = catchAsync(async (req, res, next) => {
  try {
    const adminUser = await db.getAdminUserById(req.params.id);
    if (!adminUser) return next(new AppError('Admin user not found', 404));
    res.status(200).json({ status: 'success', data: { adminUser } });
  } catch (error) {
    return next(new AppError('Failed to fetch admin user', 500));
  }
});

exports.updateAdminUser = catchAsync(async (req, res, next) => {
  const updates = {};
  ['department', 'permissions', 'access_level', 'last_login_at'].forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  try {
    const adminUser = await db.updateAdminUser(req.params.id, updates);

    if (!adminUser) return next(new AppError('Admin user not found', 404));
    res.status(200).json({ status: 'success', data: { adminUser } });
  } catch (error) {
    return next(new AppError('Failed to update admin user', 500));
  }
});

exports.deleteAdminUser = catchAsync(async (req, res, next) => {
  try {
    await db.deleteAdminUser(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    return next(new AppError('Failed to delete admin user', 500));
  }
});
