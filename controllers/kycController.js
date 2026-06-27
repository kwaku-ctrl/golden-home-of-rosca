const db = require('../utils/supabaseDatabase');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { streamCursorAsCSV } = require('../utils/csvStream');

exports.uploadKyc = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('KYC document upload is required', 400));
  }

  const { documentType } = req.body;
  if (!documentType) {
    return next(new AppError('Document type is required', 400));
  }

  try {
    const kyc = await db.createKyc({
      user: req.user.id,
      document_type: documentType,
      file_path: req.file.path
    });

    res.status(201).json({ status: 'success', data: { kyc } });
  } catch (error) {
    return next(new AppError('Failed to upload KYC document', 500));
  }
});

exports.getKycDocuments = catchAsync(async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, parseInt(req.query.limit, 10) || 20);
    const status = req.query.status;
    const filters = req.user.role === 'member' ? { user: req.user.id } : {};
    if (status) filters.status = status;

    if (req.query.export === 'csv') {
      const keys = ['id', 'user', 'document_type', 'status', 'file_path', 'created_at'];
      const kycs = await db.getKycByUser(req.user.id);
      res.attachment('kyc.csv');
      return streamCursorAsCSV(res, kycs, keys, (r) => ({
        id: r.id,
        user: r.user,
        document_type: r.document_type,
        status: r.status,
        file_path: r.file_path,
        created_at: r.created_at
      }));
    }

    const paginatedResult = await db.paginatedQuery('kyc_documents', filters, page, limit);
    res.status(200).json({
      status: 'success',
      results: paginatedResult.data.length,
      page: paginatedResult.page,
      total: paginatedResult.total,
      data: { kycs: paginatedResult.data }
    });
  } catch (error) {
    return next(new AppError('Failed to fetch KYC documents', 500));
  }
});

exports.updateKycStatus = catchAsync(async (req, res, next) => {
  const { status, notes } = req.body;
  try {
    const updates = {};
    if (status) updates.status = status;
    if (notes) updates.notes = notes;
    if (status === 'verified' || status === 'rejected') {
      updates.reviewed_at = new Date().toISOString();
    }

    const kyc = await db.updateKyc(req.params.id, updates);
    if (!kyc) return next(new AppError('KYC document not found', 404));

    res.status(200).json({ status: 'success', data: { kyc } });
  } catch (error) {
    return next(new AppError('Failed to update KYC document', 500));
  }
});

exports.deleteKyc = catchAsync(async (req, res, next) => {
  try {
    await db.deleteKyc(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    return next(new AppError('Failed to delete KYC document', 500));
  }
});
