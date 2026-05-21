const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) newObj[key] = obj[key];
  });
  return newObj;
};

exports.getUserProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.status(200).json({ status: 'success', data: { user } });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.role) {
    return next(new AppError('This route is not for password or role updates', 400));
  }
  const filteredBody = filterObj(req.body, 'fullName', 'name', 'phone', 'profileImage', 'address', 'occupation');
  if (filteredBody.name && !filteredBody.fullName) {
    filteredBody.fullName = filteredBody.name;
    delete filteredBody.name;
  }
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  }).select('-password');

  res.status(200).json({ status: 'success', data: { user: updatedUser } });
});

const { streamCursorAsCSV } = require('../utils/csvStream');

exports.getUsers = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(200, parseInt(req.query.limit, 10) || 20);
  const skip = (page - 1) * limit;
  const q = req.query.q;
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (q) {
    const re = new RegExp(q, 'i');
    filter.$or = [{ fullName: re }, { email: re }, { phoneNumber: re }];
  }

  if (req.query.export === 'csv') {
    const keys = ['_id', 'fullName', 'email', 'phoneNumber', 'role', 'active', 'createdAt'];
    const cursor = User.find(filter).select('-password').sort({ createdAt: -1 }).cursor();
    res.attachment('users.csv');
    return streamCursorAsCSV(res, cursor, keys, (d) => ({
      _id: d._id,
      fullName: d.fullName,
      email: d.email,
      phoneNumber: d.phoneNumber,
      role: d.role,
      active: d.active,
      createdAt: d.createdAt
    }));
  }

  const total = await User.countDocuments(filter);
  const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit);
  res.status(200).json({ status: 'success', results: users.length, page, total, data: { users } });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return next(new AppError('User not found', 404));
  res.status(200).json({ status: 'success', data: { user } });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(req.body, 'fullName', 'name', 'phone', 'role', 'profileImage', 'address', 'occupation', 'verificationStatus', 'active');
  const user = await User.findByIdAndUpdate(req.params.id, filteredBody, {
    new: true,
    runValidators: true
  }).select('-password');
  if (!user) return next(new AppError('User not found', 404));
  res.status(200).json({ status: 'success', data: { user } });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!user) return next(new AppError('User not found', 404));
  res.status(204).json({ status: 'success', data: null });
});
