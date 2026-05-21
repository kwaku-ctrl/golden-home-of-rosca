const express = require('express');
const adminUserController = require('../controllers/adminUserController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const router = express.Router();

router.use(protect);
router.use(restrictTo('super-admin'));

router.post('/', adminUserController.createAdminUser);
router.get('/', adminUserController.getAdminUsers);
router.get('/:id', adminUserController.getAdminUser);
router.patch('/:id', adminUserController.updateAdminUser);
router.delete('/:id', adminUserController.deleteAdminUser);

module.exports = router;
