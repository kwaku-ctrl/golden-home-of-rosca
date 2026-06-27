const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { findUserById } = require('../utils/localUserStore');

const isSupabaseUnavailableError = (error) => {
  const message = error?.message || error?.details || '';
  return Boolean(error) && /fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|socket hang up|EAI_AGAIN|network/i.test(message);
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new AppError('Invalid token. Please log in again.', 401));
  }

  let user = null;
  let error = null;

  if (supabase?.from) {
    try {
      const response = await supabase.from('users').select('*').eq('id', decoded.id).single();
      user = response?.data;
      error = response?.error;
    } catch (supabaseError) {
      error = supabaseError;
    }
  }

  if (!user || (error && isSupabaseUnavailableError(error))) {
    user = await findUserById(decoded.id);
  }

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
