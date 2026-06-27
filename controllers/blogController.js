const db = require('../utils/supabaseDatabase');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { streamCursorAsCSV } = require('../utils/csvStream');

exports.createBlog = catchAsync(async (req, res, next) => {
  const { title, content, author, tags, published } = req.body;
  if (!title || !content) {
    return next(new AppError('Title and content are required', 400));
  }
  try {
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const blog = await db.createBlog({
      title,
      content,
      slug,
      author: author || 'Admin',
      tags: tags || [],
      published: published !== undefined ? published : true,
      published_at: published ? new Date().toISOString() : null
    });
    res.status(201).json({ status: 'success', data: { blog } });
  } catch (error) {
    return next(new AppError('Failed to create blog post', 500));
  }
});

exports.getBlogs = catchAsync(async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, parseInt(req.query.limit, 10) || 20);
    const filters = req.user && req.user.role !== 'member' ? {} : { published: true };

    if (req.query.export === 'csv') {
      const keys = ['id', 'title', 'author', 'published', 'published_at', 'created_at'];
      const blogs = await db.getAllBlogs(filters);
      res.attachment('blogs.csv');
      return streamCursorAsCSV(res, blogs, keys, (b) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        published: b.published,
        published_at: b.published_at,
        created_at: b.created_at
      }));
    }

    const paginatedResult = await db.paginatedQuery('blogs', filters, page, limit);
    res.status(200).json({
      status: 'success',
      results: paginatedResult.data.length,
      page: paginatedResult.page,
      total: paginatedResult.total,
      data: { blogs: paginatedResult.data }
    });
  } catch (error) {
    return next(new AppError('Failed to fetch blogs', 500));
  }
});

exports.getBlog = catchAsync(async (req, res, next) => {
  try {
    let blog;
    if (req.params.slug) {
      blog = await db.getBlogBySlug(req.params.slug);
    } else {
      blog = await db.getBlogById(req.params.id);
    }

    if (!blog) return next(new AppError('Blog post not found', 404));
    if (!blog.published && req.user?.role === 'member') {
      return next(new AppError('Blog post is not available', 403));
    }
    res.status(200).json({ status: 'success', data: { blog } });
  } catch (error) {
    return next(new AppError('Failed to fetch blog post', 500));
  }
});

exports.updateBlog = catchAsync(async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.published) updates.published_at = new Date().toISOString();
    const blog = await db.updateBlog(req.params.id, updates);
    if (!blog) return next(new AppError('Blog post not found', 404));
    res.status(200).json({ status: 'success', data: { blog } });
  } catch (error) {
    return next(new AppError('Failed to update blog post', 500));
  }
});

exports.deleteBlog = catchAsync(async (req, res, next) => {
  try {
    await db.deleteBlog(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    return next(new AppError('Failed to delete blog post', 500));
  }
});
