const mongoose = require('mongoose');

const adminUserSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin record must belong to a user'],
      unique: true
    },
    department: {
      type: String,
      trim: true
    },
    permissions: {
      type: [String],
      default: ['manage_users', 'manage_loans', 'manage_savings', 'manage_transactions']
    },
    accessLevel: {
      type: String,
      enum: ['admin', 'super-admin'],
      default: 'admin'
    },
    lastLoginAt: Date
  },
  { timestamps: true }
);

adminUserSchema.index({ user: 1, accessLevel: 1 });

module.exports = mongoose.model('AdminUser', adminUserSchema);
