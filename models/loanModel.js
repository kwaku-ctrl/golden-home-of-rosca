const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Loan must belong to a user']
    },
    loanType: {
      type: String,
      enum: ['personal', 'business', 'education', 'group', 'susu', 'other'],
      default: 'personal'
    },
    amount: {
      type: Number,
      required: [true, 'Loan amount is required'],
      min: [100, 'Loan amount must be at least 100']
    },
    durationMonths: {
      type: Number,
      required: [true, 'Loan duration is required'],
      min: [1, 'Loan duration must be at least 1 month']
    },
    interestRate: {
      type: Number,
      required: [true, 'Interest rate is required'],
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'active', 'paid'],
      default: 'pending'
    },
    purpose: {
      type: String,
      trim: true,
      maxlength: 300
    },
    approval: {
      requestedAt: {
        type: Date,
        default: Date.now
      },
      approvedAt: Date,
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      rejectedAt: Date,
      rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      notes: String
    },
    repaymentSchedule: [
      {
        installmentNumber: Number,
        dueDate: Date,
        amountDue: Number,
        amountPaid: {
          type: Number,
          default: 0,
          min: 0
        },
        status: {
          type: String,
          enum: ['pending', 'paid', 'overdue'],
          default: 'pending'
        },
        paidAt: Date,
        paymentReference: String
      }
    ],
    nextPaymentDate: Date,
    paidAt: Date
  },
  { timestamps: true }
);

loanSchema.index({ user: 1, status: 1, loanType: 1 });

module.exports = mongoose.model('Loan', loanSchema);
