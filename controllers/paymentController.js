const catchAsync = require('../utils/catchAsync');
const paymentService = require('../utils/payment');
const AppError = require('../utils/AppError');

exports.initializePayment = catchAsync(async (req, res, next) => {
  const { email, amount } = req.body;
  if (!email || !amount) {
    return next(new AppError('Email and amount are required to initialize payment', 400));
  }

  const payload = {
    email,
    amount: Number(amount) * 100
  };
  const response = await paymentService.initializePaystackPayment(payload.email, payload.amount);

  res.status(200).json({ status: 'success', data: response.data });
});

exports.verifyPayment = catchAsync(async (req, res, next) => {
  const { reference } = req.params;
  if (!reference) {
    return next(new AppError('Payment reference is required', 400));
  }

  const response = await paymentService.verifyPaystackPayment(reference);
  res.status(200).json({ status: 'success', data: response.data });
});
