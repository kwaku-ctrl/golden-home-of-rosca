const mongoose = require('mongoose');

const savingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Saving account must belong to a user']
    },
    accountType: {
      type: String,
      enum: ['regular', 'target', 'fixed', 'group'],
      default: 'regular'
    },
    accountNumber: {
      type: String,
      unique: true,
      sparse: true
    },
    amount: {
      type: Number,
      required: [true, 'Saving amount is required'],
      min: [1, 'Amount must be greater than zero']
    },
    targetAmount: {
      type: Number,
      min: [1, 'Target amount must be greater than zero']
    },
    frequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly', 'one-time'],
      default: 'monthly'
    },
    balance: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed'],
      default: 'active'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    maturityDate: Date,
    targetDate: Date,
    description: {
      type: String,
      trim: true,
      maxlength: 300
    }
  },
  { timestamps: true }
);

savingSchema.index({ user: 1, accountNumber: 1 });

module.exports = mongoose.model('Saving', savingSchema);
