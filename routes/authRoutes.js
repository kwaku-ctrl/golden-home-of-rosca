const express = require('express');
const authController = require('../controllers/authControllerSupabase');
const { protect } = require('../middlewares/authMiddlewareSupabase');
const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);
router.patch('/update-password', protect, authController.updatePassword);
router.get('/me', protect, authController.getMe);

module.exports = router;
