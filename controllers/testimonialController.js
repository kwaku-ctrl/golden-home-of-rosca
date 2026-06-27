const db = require('../utils/supabaseDatabase');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { streamCursorAsCSV } = require('../utils/csvStream');

exports.createTestimonial = catchAsync(async (req, res, next) => {
  const { name, role, message, rating, featured } = req.body;
  if (!name || !message) {
    return next(new AppError('Name and message are required', 400));
  }
  try {
    const testimonial = await db.createTestimonial({
      name,
      role: role || 'Member',
      message,
      rating: rating || 5,
      featured: featured || false
    });
    res.status(201).json({ status: 'success', data: { testimonial } });
  } catch (error) {
    return next(new AppError('Failed to create testimonial', 500));
  }
});

exports.getTestimonials = catchAsync(async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, parseInt(req.query.limit, 10) || 20);
    const filters = {};

    if (req.query.export === 'csv') {
      const keys = ['id', 'name', 'role', 'message', 'rating', 'featured', 'created_at'];
      const testimonials = await db.getAllTestimonials(filters);
      res.attachment('testimonials.csv');
      return streamCursorAsCSV(res, testimonials, keys, (t) => ({
        id: t.id,
        name: t.name,
        role: t.role,
        message: t.message,
        rating: t.rating,
        featured: t.featured,
        created_at: t.created_at
      }));
    }

    const paginatedResult = await db.paginatedQuery('testimonials', filters, page, limit);
    res.status(200).json({
      status: 'success',
      results: paginatedResult.data.length,
      page: paginatedResult.page,
      total: paginatedResult.total,
      data: { testimonials: paginatedResult.data }
    });
  } catch (error) {
    return next(new AppError('Failed to fetch testimonials', 500));
  }
});

exports.updateTestimonial = catchAsync(async (req, res, next) => {
  try {
    const testimonial = await db.updateTestimonial(req.params.id, req.body);
    if (!testimonial) return next(new AppError('Testimonial not found', 404));
    res.status(200).json({ status: 'success', data: { testimonial } });
  } catch (error) {
    return next(new AppError('Failed to update testimonial', 500));
  }
});

exports.deleteTestimonial = catchAsync(async (req, res, next) => {
  try {
    await db.deleteTestimonial(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    return next(new AppError('Failed to delete testimonial', 500));
  }
});
