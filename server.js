const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const csurf = require('csurf');
const compression = require('compression');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const connectDatabase = require('./config/db');
const AppError = require('./utils/AppError');
const globalErrorHandler = require('./middlewares/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const loanRoutes = require('./routes/loanRoutes');
const savingRoutes = require('./routes/savingRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const kycRoutes = require('./routes/kycRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const blogRoutes = require('./routes/blogRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const repaymentRoutes = require('./routes/repaymentRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5500';

connectDatabase();

// Helmet with a basic CSP; adjust sources as your frontend evolves
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "blob:"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", CLIENT_URL, 'ws:', 'https://ghor-backend.onrender.com']
      }
    }
  })
);
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Gzip compression for responses
app.use(compression());

// CSRF protection for state-changing requests. Token is stored in a cookie.
app.use(csurf({ cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' } }));
app.use((req, res, next) => {
  res.cookie('XSRF-TOKEN', req.csrfToken(), {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  next();
});

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const requestLogger = (req, res, next) => {
  console.info(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
};
app.use(requestLogger);

app.set('trust proxy', 1);
const limiter = rateLimit({
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 120,
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW_MIN, 10) || 15) * 60 * 1000,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Route to fetch CSRF token for SPA or client usage
app.get('/api/csrf-token', (req, res) => {
  try {
    res.status(200).json({ csrfToken: req.csrfToken() });
  } catch (err) {
    res.status(500).json({ error: 'Unable to generate CSRF token' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/savings', savingRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/repayments', repaymentRoutes);
app.use('/api/admin-users', adminUserRoutes);
// Serve static files with caching headers for optimization
app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: '7d',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        // HTML should be revalidated
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  })
);

app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
