const db = require('../utils/supabaseDatabase');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { streamCursorAsCSV } = require('../utils/csvStream');

exports.createNotification = catchAsync(async (req, res, next) => {
  const { title, message, user, priority } = req.body;
  if (!title || !message) {
    return next(new AppError('Title and message are required', 400));
  }
  try {
    const notification = await db.createNotification({
      title,
      message,
      user,
      priority: priority || 'medium'
    });
    res.status(201).json({ status: 'success', data: { notification } });
  } catch (error) {
    return next(new AppError('Failed to create notification', 500));
  }
});

exports.getNotifications = catchAsync(async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, parseInt(req.query.limit, 10) || 20);
    const filters = {};
    if (req.user && req.user.role === 'member') filters.user = req.user.id;

    if (req.query.export === 'csv') {
      const keys = ['id', 'user', 'title', 'message', 'read', 'created_at'];
      const notifications = await db.getNotificationsByUser(req.user?.id || null, filters);
      res.attachment('notifications.csv');
      return streamCursorAsCSV(res, notifications, keys, (n) => ({
        id: n.id,
        user: n.user,
        title: n.title,
        message: n.message,
        read: n.read,
        created_at: n.created_at
      }));
    }

    const paginatedResult = await db.paginatedQuery('notifications', filters, page, limit);
    res.status(200).json({
      status: 'success',
      results: paginatedResult.data.length,
      page: paginatedResult.page,
      total: paginatedResult.total,
      data: { notifications: paginatedResult.data }
    });
  } catch (error) {
    res.status(200).json({ status: 'success', results: 0, page: 1, total: 0, data: { notifications: [] } });
  }
});

exports.markAsRead = catchAsync(async (req, res, next) => {
  try {
    const notification = await db.updateNotification(req.params.id, { read: true });
    if (!notification) return next(new AppError('Notification not found', 404));
    res.status(200).json({ status: 'success', data: { notification } });
  } catch (error) {
    return next(new AppError('Failed to update notification', 500));
  }
});

exports.deleteNotification = catchAsync(async (req, res, next) => {
  try {
    await db.deleteNotification(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    return next(new AppError('Failed to delete notification', 500));
  }
});
