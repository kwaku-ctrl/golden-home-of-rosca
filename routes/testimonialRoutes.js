const express = require('express');
const testimonialController = require('../controllers/testimonialController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/', testimonialController.getTestimonials);
router.use(protect);
router.post('/', restrictTo('admin', 'super-admin'), testimonialController.createTestimonial);
router.patch('/:id', restrictTo('admin', 'super-admin'), testimonialController.updateTestimonial);
router.delete('/:id', restrictTo('admin', 'super-admin'), testimonialController.deleteTestimonial);

module.exports = router;
