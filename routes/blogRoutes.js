const express = require('express');
const blogController = require('../controllers/blogController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/', blogController.getBlogs);
router.get('/slug/:slug', blogController.getBlog);

router.use(protect);
router.post('/', restrictTo('admin', 'super-admin'), blogController.createBlog);
router.patch('/:id', restrictTo('admin', 'super-admin'), blogController.updateBlog);
router.delete('/:id', restrictTo('admin', 'super-admin'), blogController.deleteBlog);

module.exports = router;
