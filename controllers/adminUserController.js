const AdminUser = require('../models/adminUserModel');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.createAdminUser = catchAsync(async (req, res, next) => {
  const { userId, department, permissions, accessLevel } = req.body;
  if (!userId) {
    return next(new AppError('User ID is required to create an admin record', 400));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (!['admin', 'super-admin'].includes(user.role)) {
    return next(new AppError('User role must be admin or super-admin to create admin metadata', 400));
  }

  const adminUser = await AdminUser.create({
    user: userId,
    department,
    permissions: permissions || ['manage_users', 'manage_loans', 'manage_savings', 'manage_transactions'],
    accessLevel: accessLevel || user.role
  });

  res.status(201).json({ status: 'success', data: { adminUser } });
});

exports.getAdminUsers = catchAsync(async (req, res) => {
  const adminUsers = await AdminUser.find().populate('user', 'fullName email role');
  res.status(200).json({ status: 'success', results: adminUsers.length, data: { adminUsers } });
});

exports.getAdminUser = catchAsync(async (req, res, next) => {
  const adminUser = await AdminUser.findById(req.params.id).populate('user', 'fullName email role');
  if (!adminUser) return next(new AppError('Admin user not found', 404));
  res.status(200).json({ status: 'success', data: { adminUser } });
});

exports.updateAdminUser = catchAsync(async (req, res, next) => {
  const updates = {};
  ['department', 'permissions', 'accessLevel', 'lastLoginAt'].forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const adminUser = await AdminUser.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true
  }).populate('user', 'fullName email role');

  if (!adminUser) return next(new AppError('Admin user not found', 404));
  res.status(200).json({ status: 'success', data: { adminUser } });
});

exports.deleteAdminUser = catchAsync(async (req, res, next) => {
  const adminUser = await AdminUser.findByIdAndDelete(req.params.id);
  if (!adminUser) return next(new AppError('Admin user not found', 404));
  res.status(204).json({ status: 'success', data: null });
});
