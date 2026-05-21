const express = require('express');
const repaymentController = require('../controllers/repaymentController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const router = express.Router();

router.use(protect);
router.post('/', repaymentController.createRepayment);
router.get('/', repaymentController.getRepayments);
router.get('/:id', repaymentController.getRepayment);
router.patch('/:id', restrictTo('admin', 'super-admin'), repaymentController.updateRepayment);
router.delete('/:id', restrictTo('admin', 'super-admin'), repaymentController.deleteRepayment);

module.exports = router;
