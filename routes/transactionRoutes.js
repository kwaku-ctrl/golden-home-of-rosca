const express = require('express');
const transactionController = require('../controllers/transactionController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const router = express.Router();

router.use(protect);
router.post('/', transactionController.createTransaction);
router.get('/', transactionController.getTransactions);
router.get('/:id', transactionController.getTransaction);
router.delete('/:id', restrictTo('admin', 'super-admin'), transactionController.deleteTransaction);

module.exports = router;
