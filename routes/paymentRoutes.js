const express = require('express');
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/initialize', protect, paymentController.initializePayment);
router.get('/verify/:reference', protect, paymentController.verifyPayment);

module.exports = router;
