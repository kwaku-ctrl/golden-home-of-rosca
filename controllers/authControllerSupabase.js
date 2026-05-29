const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// Use mock DB as fallback
const mockDb = require('../config/mockDb');

const isProduction = process.env.NODE_ENV === 'production';

const signToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'your_jwt_secret_here') {
    throw new Error('JWT_SECRET is not properly configured in environment variables');
  }
  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);
  const cookieOptions = {
    expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 7) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  };

  res.cookie('jwt', token, cookieOptions);

  const userData = { ...user };
  delete userData.password;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: userData
    }
  });
};

// Supabase REST API (production/when available)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

const api = supabaseUrl && supabaseKey ? axios.create({
  baseURL: `${supabaseUrl}/rest/v1`,
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  },
  timeout: 5000
}) : null;

exports.signup = catchAsync(async (req, res, next) => {
  const { name, fullName, email, phone, password } = req.body;
  const displayName = fullName || name;
  const normalizedEmail = email.toLowerCase().trim();

  if (!displayName || !email || !phone || !password) {
    return next(new AppError('Full name, email, phone, and password are required', 400));
  }

  // Always use mock DB for now (fallback)
  const existing = mockDb.findUserByEmail(normalizedEmail);
  if (existing) {
    return next(new AppError('Email already exists', 400));
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const newUser = {
    id: uuidv4(),
    full_name: displayName,
    email: normalizedEmail,
    phone_number: phone,
    password: hashedPassword,
    role: 'member',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  mockDb.addUser(newUser);
  console.log('✅ User created:', normalizedEmail);
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const user = mockDb.findUserByEmail(normalizedEmail);
  if (!user) {
    return next(new AppError('Incorrect email or password', 401));
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return next(new AppError('Incorrect email or password', 401));
  }

  console.log('✅ User logged in:', normalizedEmail);
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.clearCookie('jwt');
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
};

exports.getCurrentUser = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Not authenticated', 401));
  }

  const user = mockDb.findUserById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  delete user.password;
  res.status(200).json({ status: 'success', data: { user } });
});

exports.updateProfile = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Not authenticated', 401));
  }

  const { full_name, phone_number, address } = req.body;

  const updated = mockDb.updateUser(req.user.id, { 
    full_name, 
    phone_number, 
    address, 
    updated_at: new Date().toISOString() 
  });

  if (!updated) {
    return next(new AppError('User not found', 404));
  }
  delete updated.password;
  res.status(200).json({ status: 'success', data: { user: updated } });
});

exports.changePassword = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Not authenticated', 401));
  }

  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return next(new AppError('Please provide current and new password', 400));
  }

  if (newPassword !== confirmPassword) {
    return next(new AppError('Passwords do not match', 400));
  }

  const user = mockDb.findUserById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    return next(new AppError('Current password is incorrect', 401));
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  mockDb.updateUser(req.user.id, { 
    password: hashedPassword, 
    updated_at: new Date().toISOString() 
  });

  res.status(200).json({
    status: 'success',
    message: 'Password changed successfully'
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  console.log('[getMe] req.user:', req.user ? `${req.user.email}` : 'undefined');
  
  if (!req.user) {
    return next(new AppError('Not authenticated', 401));
  }

  const user = mockDb.findUserById(req.user.id);
  console.log('[getMe] User lookup:', user ? `✅ ${user.email}` : '❌ Not found');
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  const userData = { ...user };
  delete userData.password;
  
  res.status(200).json({ 
    status: 'success', 
    data: { user: userData } 
  });
});

exports.updatePassword = exports.changePassword;

exports.forgotPassword = catchAsync(async (req, res, next) => {
  return next(new AppError('Password reset via email is not yet implemented', 400));
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  return next(new AppError('Password reset via token is not yet implemented', 400));
});
