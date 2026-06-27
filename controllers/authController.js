const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../utils/supabaseDatabase');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

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
  const userWithoutPassword = { ...user };
  delete userWithoutPassword.password;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: userWithoutPassword
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const { name, fullName, email, phone, password } = req.body;
  const displayName = fullName || name;
  if (!displayName || !email || !phone || !password) {
    return next(new AppError('Full name, email, phone, and password are required', 400));
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await db.createUser({
      full_name: displayName,
      email,
      phone,
      password: hashedPassword
    });
    createSendToken(user, 201, res);
  } catch (error) {
    return next(new AppError('Failed to create user account', 500));
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  try {
    const user = await db.getUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    createSendToken(user, 200, res);
  } catch (error) {
    return next(new AppError('Failed to login', 500));
  }
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });
  res.status(200).json({ status: 'success' });
};

exports.getMe = (req, res) => {
  res.status(200).json({ status: 'success', data: { user: req.user } });
};

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return next(new AppError('Current password and new password are required', 400));
  }

  try {
    const user = await db.getUserById(req.user.id);
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return next(new AppError('Current password is incorrect', 401));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const updatedUser = await db.updateUser(req.user.id, {
      password: hashedPassword,
      password_changed_at: new Date().toISOString()
    });
    createSendToken(updatedUser, 200, res);
  } catch (error) {
    return next(new AppError('Failed to update password', 500));
  }
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new AppError('Please provide your email address', 400));
  }

  try {
    const user = await db.getUserByEmail(email);
    if (!user) {
      return next(new AppError('There is no user with that email address', 404));
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    await db.updateUser(user.id, {
      password_reset_token: resetTokenHash,
      password_reset_expires: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    });

    const resetURL = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
    res.status(200).json({
      status: 'success',
      message: 'Password reset token sent to email (demo response)',
      resetURL
    });
  } catch (error) {
    return next(new AppError('Failed to process password reset', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  try {
    const users = await db.getAllUsers();
    const user = users.find(u => u.password_reset_token === hashedToken);

    if (!user || !user.password_reset_expires || new Date(user.password_reset_expires) < new Date()) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    const updatedUser = await db.updateUser(user.id, {
      password: hashedPassword,
      password_reset_token: null,
      password_reset_expires: null
    });

    createSendToken(updatedUser, 200, res);
  } catch (error) {
    return next(new AppError('Failed to reset password', 500));
  }
});
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  if (!req.body.password) {
    return next(new AppError('Please provide a new password', 400));
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, res);
});
