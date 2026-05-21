const Kyc = require('../models/kycModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.uploadKyc = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('KYC document upload is required', 400));
  }

  const { documentType } = req.body;
  if (!documentType) {
    return next(new AppError('Document type is required', 400));
  }

  const kyc = await Kyc.create({
    user: req.user._id,
    documentType,
    filePath: req.file.path
  });

  res.status(201).json({ status: 'success', data: { kyc } });
});

const { streamCursorAsCSV } = require('../utils/csvStream');

exports.getKycDocuments = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(200, parseInt(req.query.limit, 10) || 20);
  const skip = (page - 1) * limit;
  const q = req.query.q;
  const status = req.query.status;
  const filter = req.user.role === 'member' ? { user: req.user._id } : {};
  if (status) filter.status = status;
  if (q) {
    const re = new RegExp(q, 'i');
    filter.$or = [{ documentType: re }, { notes: re }];
  }

  if (req.query.export === 'csv') {
    const keys = ['_id', 'user', 'documentType', 'status', 'filePath', 'createdAt'];
    const cursor = Kyc.find(filter).populate('user', 'fullName email').sort({ createdAt: -1 }).cursor();
    res.attachment('kyc.csv');
    return streamCursorAsCSV(res, cursor, keys, (r) => ({
      _id: r._id,
      user: r.user?.fullName || r.user?.email || '',
      documentType: r.documentType,
      status: r.status,
      filePath: r.filePath,
      createdAt: r.createdAt
    }));
  }

  const total = await Kyc.countDocuments(filter);
  const kycs = await Kyc.find(filter).populate('user', 'fullName email').sort({ createdAt: -1 }).skip(skip).limit(limit);
  res.status(200).json({ status: 'success', results: kycs.length, page, total, data: { kycs } });
});

exports.updateKycStatus = catchAsync(async (req, res, next) => {
  const { status, notes } = req.body;
  const kyc = await Kyc.findById(req.params.id);
  if (!kyc) return next(new AppError('KYC document not found', 404));

  if (status) kyc.status = status;
  if (notes) kyc.notes = notes;
  if (status === 'verified' || status === 'rejected') {
    kyc.reviewedAt = Date.now();
  }

  await kyc.save();
  res.status(200).json({ status: 'success', data: { kyc } });
});

exports.deleteKyc = catchAsync(async (req, res, next) => {
  const kyc = await Kyc.findByIdAndDelete(req.params.id);
  if (!kyc) return next(new AppError('KYC document not found', 404));
  res.status(204).json({ status: 'success', data: null });
});
