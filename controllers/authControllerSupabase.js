const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { findUserByEmail, findUserById, createUser, updateUser } = require('../utils/localUserStore');

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

  // Remove sensitive fields before sending
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

const isSupabaseUnavailableError = (error) => {
  const message = error?.message || error?.details || '';
  return Boolean(error) && /fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|socket hang up|EAI_AGAIN|network/i.test(message);
};

const getUserByEmail = async (email) => {
  if (!supabase?.from) {
    return { data: await findUserByEmail(email), error: null };
  }

  try {
    const result = await supabase.from('users').select('*').eq('email', email).single();
    if (result?.error && isSupabaseUnavailableError(result.error)) {
      return { data: await findUserByEmail(email), error: null };
    }
    return result;
  } catch (error) {
    if (isSupabaseUnavailableError(error)) {
      return { data: await findUserByEmail(email), error: null };
    }
    throw error;
  }
};

const getUserById = async (id) => {
  if (!supabase?.from) {
    return { data: await findUserById(id), error: null };
  }

  try {
    const result = await supabase.from('users').select('*').eq('id', id).single();
    if (result?.error && isSupabaseUnavailableError(result.error)) {
      return { data: await findUserById(id), error: null };
    }
    return result;
  } catch (error) {
    if (isSupabaseUnavailableError(error)) {
      return { data: await findUserById(id), error: null };
    }
    throw error;
  }
};

const createUserRecord = async (userPayload) => {
  if (!supabase?.from) {
    return createUser(userPayload);
  }

  try {
    const { data, error } = await supabase.from('users').insert([userPayload]).select().single();
    if (error) {
      if (isSupabaseUnavailableError(error)) {
        return createUser(userPayload);
      }
      throw error;
    }

    return data;
  } catch (error) {
    if (isSupabaseUnavailableError(error)) {
      return createUser(userPayload);
    }
    throw error;
  }
};

const updateUserRecord = async (id, updates) => {
  if (!supabase?.from) {
    return updateUser(id, updates);
  }

  try {
    const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
    if (error) {
      if (isSupabaseUnavailableError(error)) {
        return updateUser(id, updates);
      }
      throw error;
    }

    return data;
  } catch (error) {
    if (isSupabaseUnavailableError(error)) {
      return updateUser(id, updates);
    }
    throw error;
  }
};

exports.signup = catchAsync(async (req, res, next) => {
  const { name, fullName, email, phone, password } = req.body;
  const displayName = fullName || name;

  if (!displayName || !email || !phone || !password) {
    return next(new AppError('Full name, email, phone, and password are required', 400));
  }

  // Check if user already exists
  const { data: existingUser } = await getUserByEmail(email);

  if (existingUser) {
    return next(new AppError('Email already exists', 400));
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user in Supabase or local fallback store
  const newUser = await createUserRecord({
    full_name: displayName,
    email,
    phone_number: phone,
    password: hashedPassword,
    role: 'member'
  });

  if (!newUser) {
    return next(new AppError('Error creating user', 400));
  }

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Fetch user with password field
  const { data: user, error } = await getUserByEmail(email);

  if (error || !user) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // Compare passwords
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return next(new AppError('Incorrect email or password', 401));
  }

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
  // req.user is set by authMiddleware
  if (!req.user) {
    return next(new AppError('Not authenticated', 401));
  }

  const { data: user, error } = await getUserById(req.user.id);

  if (error || !user) {
    return next(new AppError('User not found', 404));
  }

  // Remove password before sending
  delete user.password;

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

exports.updateProfile = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Not authenticated', 401));
  }

  const { full_name, phone_number, address } = req.body;

  const updatedUser = await updateUserRecord(req.user.id, {
    full_name,
    phone_number,
    address,
    updated_at: new Date().toISOString()
  });

  if (!updatedUser) {
    return next(new AppError('Error updating profile', 400));
  }

  delete updatedUser.password;

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
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

  // Fetch user with password
  const { data: user, error: fetchError } = await getUserById(req.user.id);

  if (fetchError || !user) {
    return next(new AppError('User not found', 404));
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Update password
  const updatedUser = await updateUserRecord(req.user.id, {
    password: hashedPassword,
    updated_at: new Date().toISOString()
  });

  if (!updatedUser) {
    return next(new AppError('Error updating password', 400));
  }

  res.status(200).json({
    status: 'success',
    message: 'Password changed successfully'
  });
});

exports.getMe = exports.getCurrentUser;
exports.updatePassword = exports.changePassword;

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new AppError('Please provide an email address', 400));
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.CLIENT_URL || 'http://localhost:5500'}/login.html`
  });

  if (error) {
    return next(new AppError(error.message, 400));
  }

  res.status(200).json({
    status: 'success',
    message: 'Password reset instructions have been sent if the email exists.'
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  return next(new AppError('Password reset with Supabase uses email link flow. Please use the forgot password endpoint.', 400));
});
