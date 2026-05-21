const express = require('express');
const loanController = require('../controllers/loanController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const router = express.Router();

router.use(protect);
router.post('/', loanController.createLoan);
router.get('/', loanController.getLoans);
router.get('/:id', loanController.getLoan);
router.patch('/:id', restrictTo('admin', 'super-admin'), loanController.updateLoan);
router.delete('/:id', restrictTo('admin', 'super-admin'), loanController.deleteLoan);

module.exports = router;
