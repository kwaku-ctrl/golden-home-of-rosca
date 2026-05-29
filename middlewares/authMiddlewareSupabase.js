const jwt = require('jsonwebtoken');
const mockDb = require('../config/mockDb');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  console.log('[AUTH] Checking token - Headers:', req.headers.authorization ? 'Bearer' : 'None', 'Cookies:', req.cookies?.jwt ? 'jwt found' : 'no jwt');

  if (!token) {
    console.log('[AUTH] ❌ No token found');
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[AUTH] ✅ Token verified, user ID:', decoded.id);
  } catch (err) {
    console.error('[AUTH] ❌ Token verification failed:', err.message);
    return next(new AppError('Invalid token. Please log in again.', 401));
  }

  // Use SQLite database instead of Supabase
  const user = mockDb.findUserById(decoded.id);
  console.log('[AUTH] User lookup result:', user ? `✅ Found ${user.email}` : '❌ Not found');

  if (!user) {
    return next(new AppError('The user associated with this token no longer exists.', 401));
  }

  req.user = user;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};
