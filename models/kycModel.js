const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'KYC document must belong to a user']
    },
    documentType: {
      type: String,
      required: [true, 'KYC document type is required']
    },
    documentNumber: {
      type: String,
      trim: true
    },
    issueDate: Date,
    expiryDate: Date,
    filePath: {
      type: String,
      required: [true, 'KYC file path is required']
    },
    fileType: {
      type: String,
      enum: ['image', 'pdf', 'other'],
      default: 'image'
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    reviewedAt: Date,
    notes: String
  },
  { timestamps: true }
);

kycSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Kyc', kycSchema);
