const Testimonial = require('../models/testimonialModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { streamCursorAsCSV } = require('../utils/csvStream');

exports.createTestimonial = catchAsync(async (req, res, next) => {
  const { name, role, message, rating, featured } = req.body;
  if (!name || !message) {
    return next(new AppError('Name and message are required', 400));
  }
  const testimonial = await Testimonial.create({
    name,
    role: role || 'Member',
    message,
    rating: rating || 5,
    featured: featured || false
  });
  res.status(201).json({ status: 'success', data: { testimonial } });
});

exports.getTestimonials = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(200, parseInt(req.query.limit, 10) || 20);
  const skip = (page - 1) * limit;
  const q = req.query.q;
  const filter = {};
  if (q) {
    const re = new RegExp(q, 'i');
    filter.$or = [{ name: re }, { message: re }];
  }

  if (req.query.export === 'csv') {
    const keys = ['_id', 'name', 'role', 'message', 'rating', 'featured', 'createdAt'];
    const cursor = Testimonial.find(filter).sort({ createdAt: -1 }).cursor();
    res.attachment('testimonials.csv');
    return streamCursorAsCSV(res, cursor, keys, (t) => ({
      _id: t._id,
      name: t.name,
      role: t.role,
      message: t.message,
      rating: t.rating,
      featured: t.featured,
      createdAt: t.createdAt
    }));
  }

  const total = await Testimonial.countDocuments(filter);
  const testimonials = await Testimonial.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
  res.status(200).json({ status: 'success', results: testimonials.length, page, total, data: { testimonials } });
});

exports.updateTestimonial = catchAsync(async (req, res, next) => {
  const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!testimonial) return next(new AppError('Testimonial not found', 404));
  res.status(200).json({ status: 'success', data: { testimonial } });
});

exports.deleteTestimonial = catchAsync(async (req, res, next) => {
  const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
  if (!testimonial) return next(new AppError('Testimonial not found', 404));
  res.status(204).json({ status: 'success', data: null });
});
