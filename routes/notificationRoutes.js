const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const router = express.Router();

router.use(protect);
router.get('/', notificationController.getNotifications);
router.post('/', restrictTo('admin', 'super-admin'), notificationController.createNotification);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/:id', restrictTo('admin', 'super-admin'), notificationController.deleteNotification);

module.exports = router;
