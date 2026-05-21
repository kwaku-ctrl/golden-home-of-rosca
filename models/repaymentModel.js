const mongoose = require('mongoose');

const repaymentSchema = new mongoose.Schema(
  {
    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      required: [true, 'Repayment must be linked to a loan']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Repayment must belong to a user']
    },
    dueDate: {
      type: Date,
      required: [true, 'Repayment due date is required']
    },
    amountDue: {
      type: Number,
      required: [true, 'Repayment amount is required'],
      min: [0, 'Repayment amount cannot be negative']
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative']
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue'],
      default: 'pending'
    },
    paidAt: Date,
    paymentReference: {
      type: String,
      trim: true
    },
    paymentProvider: {
      type: String,
      enum: ['paystack', 'flutterwave', 'bank_transfer', 'mobile_money', 'cash', 'other'],
      default: 'mobile_money'
    }
  },
  { timestamps: true }
);

repaymentSchema.index({ loan: 1, user: 1, dueDate: 1 });

module.exports = mongoose.model('Repayment', repaymentSchema);
