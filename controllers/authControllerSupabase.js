const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// Use mock DB for local testing, real API for production
const isDev = process.env.NODE_ENV === 'development';
const mockDb = isDev ? require('../config/mockDb') : null;

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

// REST API for Supabase (production)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

const api = supabaseUrl && supabaseKey ? axios.create({
  baseURL: `${supabaseUrl}/rest/v1`,
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  }
}) : null;

exports.signup = catchAsync(async (req, res, next) => {
  const { name, fullName, email, phone, password } = req.body;
  const displayName = fullName || name;

  if (!displayName || !email || !phone || !password) {
    return next(new AppError('Full name, email, phone, and password are required', 400));
  }

  try {
    if (isDev && mockDb) {
      // Local development - use mock DB
      const existing = mockDb.findUserByEmail(email);
      if (existing) {
        return next(new AppError('Email already exists', 400));
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = {
        id: uuidv4(),
        full_name: displayName,
        email,
        phone_number: phone,
        password: hashedPassword,
        role: 'member',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockDb.addUser(newUser);
      console.log('✅ User created in mock DB:', email);
      createSendToken(newUser, 201, res);
    } else {
      // Production - use Supabase REST API
      if (!api) {
        return next(new AppError('Supabase not configured', 500));
      }

      const checkRes = await api.get('/users?select=id&email=eq.' + email);
      if (checkRes.data && checkRes.data.length > 0) {
        return next(new AppError('Email already exists', 400));
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const createRes = await api.post('/users', {
        full_name: displayName,
        email,
        phone_number: phone,
        password: hashedPassword,
        role: 'member'
      });

      const newUser = createRes.data[0];
      createSendToken(newUser, 201, res);
    }
  } catch (error) {
    console.error('Signup error:', error.response?.data || error.message);
    return next(new AppError(`Error creating user: ${error.response?.data?.message || error.message}`, 400));
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  try {
    if (isDev && mockDb) {
      // Local development - use mock DB
      const user = mockDb.findUserByEmail(email);
      if (!user) {
        return next(new AppError('Incorrect email or password', 401));
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return next(new AppError('Incorrect email or password', 401));
      }

      console.log('✅ User logged in from mock DB:', email);
      createSendToken(user, 200, res);
    } else {
      // Production - use Supabase REST API
      if (!api) {
        return next(new AppError('Supabase not configured', 500));
      }

      const userRes = await api.get('/users?select=*&email=eq.' + email);
      if (!userRes.data || userRes.data.length === 0) {
        return next(new AppError('Incorrect email or password', 401));
      }

      const user = userRes.data[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return next(new AppError('Incorrect email or password', 401));
      }

      createSendToken(user, 200, res);
    }
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    return next(new AppError(`Error logging in: ${error.response?.data?.message || error.message}`, 400));
  }
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

  try {
    if (isDev && mockDb) {
      const user = mockDb.findUserById(req.user.id);
      if (!user) {
        return next(new AppError('User not found', 404));
      }
      delete user.password;
      res.status(200).json({ status: 'success', data: { user } });
    } else {
      if (!api) {
        return next(new AppError('Supabase not configured', 500));
      }
      const userRes = await api.get('/users?select=*&id=eq.' + req.user.id);
      const user = userRes.data[0];
      if (!user) {
        return next(new AppError('User not found', 404));
      }
      delete user.password;
      res.status(200).json({ status: 'success', data: { user } });
    }
  } catch (error) {
    return next(new AppError('Error fetching user', 400));
  }
});

exports.updateProfile = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Not authenticated', 401));
  }

  const { full_name, phone_number, address } = req.body;

  try {
    if (isDev && mockDb) {
      const updated = mockDb.updateUser(req.user.id, { full_name, phone_number, address, updated_at: new Date().toISOString() });
      if (!updated) {
        return next(new AppError('User not found', 404));
      }
      delete updated.password;
      res.status(200).json({ status: 'success', data: { user: updated } });
    } else {
      if (!api) {
        return next(new AppError('Supabase not configured', 500));
      }
      const updateRes = await api.patch(`/users?id=eq.${req.user.id}`, { full_name, phone_number, address, updated_at: new Date().toISOString() });
      const updatedUser = updateRes.data[0];
      delete updatedUser.password;
      res.status(200).json({ status: 'success', data: { user: updatedUser } });
    }
  } catch (error) {
    return next(new AppError(`Error updating profile: ${error.message}`, 400));
  }
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

  try {
    if (isDev && mockDb) {
      const user = mockDb.findUserById(req.user.id);
      if (!user) {
        return next(new AppError('User not found', 404));
      }
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return next(new AppError('Current password is incorrect', 401));
      }
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      mockDb.updateUser(req.user.id, { password: hashedPassword, updated_at: new Date().toISOString() });
      res.status(200).json({ status: 'success', message: 'Password changed successfully' });
    } else {
      if (!api) {
        return next(new AppError('Supabase not configured', 500));
      }
      const userRes = await api.get('/users?select=*&id=eq.' + req.user.id);
      const user = userRes.data[0];
      if (!user) {
        return next(new AppError('User not found', 404));
      }
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return next(new AppError('Current password is incorrect', 401));
      }
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await api.patch(`/users?id=eq.${req.user.id}`, { password: hashedPassword, updated_at: new Date().toISOString() });
      res.status(200).json({ status: 'success', message: 'Password changed successfully' });
    }
  } catch (error) {
    return next(new AppError(`Error updating password: ${error.message}`, 400));
  }
});

exports.getMe = exports.getCurrentUser;
exports.updatePassword = exports.changePassword;

exports.forgotPassword = catchAsync(async (req, res, next) => {
  return next(new AppError('Password reset via email is not yet implemented', 400));
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  return next(new AppError('Password reset via token is not yet implemented', 400));
});
