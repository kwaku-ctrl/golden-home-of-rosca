const Notification = require('../models/notificationModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { streamCursorAsCSV } = require('../utils/csvStream');

exports.createNotification = catchAsync(async (req, res, next) => {
  const { title, message, user, priority } = req.body;
  if (!title || !message) {
    return next(new AppError('Title and message are required', 400));
  }
  const notification = await Notification.create({
    title,
    message,
    user,
    priority: priority || 'medium'
  });
  res.status(201).json({ status: 'success', data: { notification } });
});

exports.getNotifications = catchAsync(async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;
    const q = req.query.q;
    const filter = {};
    if (req.user && req.user.role === 'member') filter.user = req.user.id;
    if (q) {
      const re = new RegExp(q, 'i');
      filter.$or = [{ title: re }, { body: re }];
    }

    if (req.query.export === 'csv') {
      const keys = ['_id', 'user', 'title', 'body', 'read', 'createdAt'];
      const cursor = Notification.find(filter).sort({ createdAt: -1 }).cursor();
      res.attachment('notifications.csv');
      return streamCursorAsCSV(res, cursor, keys, (n) => ({
        _id: n._id,
        user: n.user,
        title: n.title,
        body: n.body,
        read: n.read,
        createdAt: n.createdAt
      }));
    }

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
    res.status(200).json({ status: 'success', results: notifications.length, page, total, data: { notifications } });
  } catch (error) {
    // Return empty results if database is unavailable
    res.status(200).json({ status: 'success', results: 0, page: 1, total: 0, data: { notifications: [] } });
  }
});

exports.markAsRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { read: true },
    { new: true }
  );
  if (!notification) return next(new AppError('Notification not found', 404));
  res.status(200).json({ status: 'success', data: { notification } });
});

exports.deleteNotification = catchAsync(async (req, res, next) => {
  const notification = await Notification.findByIdAndDelete(req.params.id);
  if (!notification) return next(new AppError('Notification not found', 404));
  res.status(204).json({ status: 'success', data: null });
});
