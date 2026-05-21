const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Transaction must belong to a user']
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'loan_payment', 'savings_credit', 'savings_debit'],
      required: [true, 'Transaction type is required']
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      min: [0, 'Transaction amount must be positive']
    },
    currency: {
      type: String,
      default: 'GHS'
    },
    paymentProvider: {
      type: String,
      enum: ['paystack', 'flutterwave', 'bank_transfer', 'mobile_money', 'cash', 'other'],
      default: 'mobile_money'
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'bank_transfer', 'mobile_money', 'cash', 'other'],
      default: 'mobile_money'
    },
    providerReference: String,
    reference: {
      type: String,
      required: true,
      unique: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    description: String,
    meta: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, reference: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
