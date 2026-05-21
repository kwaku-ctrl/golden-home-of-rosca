const Blog = require('../models/blogModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.createBlog = catchAsync(async (req, res, next) => {
  const { title, content, author, tags, published } = req.body;
  if (!title || !content) {
    return next(new AppError('Title and content are required', 400));
  }
  const blog = await Blog.create({
    title,
    content,
    author: author || 'Admin',
    tags: tags || [],
    published: published !== undefined ? published : true,
    publishedAt: published ? Date.now() : null
  });
  res.status(201).json({ status: 'success', data: { blog } });
});

const { streamCursorAsCSV } = require('../utils/csvStream');

exports.getBlogs = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(200, parseInt(req.query.limit, 10) || 20);
  const skip = (page - 1) * limit;
  const q = req.query.q;
  const filter = req.user && req.user.role !== 'member' ? {} : { published: true };
  if (q) {
    const re = new RegExp(q, 'i');
    filter.$or = [{ title: re }, { tags: re }];
  }

  if (req.query.export === 'csv') {
    const keys = ['_id', 'title', 'author', 'published', 'publishedAt', 'createdAt'];
    const cursor = Blog.find(filter).sort({ createdAt: -1 }).cursor();
    res.attachment('blogs.csv');
    return streamCursorAsCSV(res, cursor, keys, (b) => ({
      _id: b._id,
      title: b.title,
      author: b.author,
      published: b.published,
      publishedAt: b.publishedAt,
      createdAt: b.createdAt
    }));
  }

  const total = await Blog.countDocuments(filter);
  const blogs = await Blog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
  res.status(200).json({ status: 'success', results: blogs.length, page, total, data: { blogs } });
});

exports.getBlog = catchAsync(async (req, res, next) => {
  const blog = await Blog.findOne(req.params.slug ? { slug: req.params.slug } : { _id: req.params.id });
  if (!blog) return next(new AppError('Blog post not found', 404));
  if (!blog.published && req.user?.role === 'member') {
    return next(new AppError('Blog post is not available', 403));
  }
  res.status(200).json({ status: 'success', data: { blog } });
});

exports.updateBlog = catchAsync(async (req, res, next) => {
  const updates = req.body;
  if (updates.published) updates.publishedAt = Date.now();
  const blog = await Blog.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true
  });
  if (!blog) return next(new AppError('Blog post not found', 404));
  res.status(200).json({ status: 'success', data: { blog } });
});

exports.deleteBlog = catchAsync(async (req, res, next) => {
  const blog = await Blog.findByIdAndDelete(req.params.id);
  if (!blog) return next(new AppError('Blog post not found', 404));
  res.status(204).json({ status: 'success', data: null });
});
