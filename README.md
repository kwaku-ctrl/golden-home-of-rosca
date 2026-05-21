# Golden Home Of ROSCA

A production-ready fintech/microfinance foundation for a Ghana-based SUSU savings and loans business built with Node.js, Express, MongoDB, and vanilla frontend assets.

## Project Foundation

- MVC architecture
- RESTful API design
- Secure authentication with JWT and bcrypt
- Mobile-first frontend with reusable components
- Clean folder structure for scaling into mobile apps, branches, agent banking, wallets
- Deployment-ready configuration for Render, Railway, Vercel, and Netlify

## Tech Stack

- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js, Express.js
- Database: MongoDB + Mongoose
- Authentication: JWT + bcrypt
- Payments: Paystack / Flutterwave integration stub
- Uploads: Multer

## Folder Structure

- `server.js` - application entrypoint
- `config/` - database and environment configuration
- `controllers/` - request handlers
- `models/` - Mongoose models
- `routes/` - API route definitions
- `middlewares/` - authentication, error handling, file upload
- `utils/` - shared utilities and error helper
- `public/` - frontend assets

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Duplicate `.env.example` to `.env` and update values.
3. Start development server:
   ```bash
   npm run dev
   ```
4. Open `public/index.html` in a browser or deploy frontend with Vercel/Netlify.

## Deployment

### Backend (Render.com)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following environment variables in Render dashboard:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render's default; will auto-configure)
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A strong random string (generate with `openssl rand -base64 32`)
   - `JWT_EXPIRES_IN`: `7d`
   - `JWT_COOKIE_EXPIRES_IN`: `7`
   - `CLIENT_URL`: Your frontend domain (e.g., `https://yourdomain.com`)
   - `PAYSTACK_SECRET_KEY`: Your Paystack live secret key
   - `FLUTTERWAVE_SECRET_KEY`: Your Flutterwave live secret key (if used)
   - `RATE_LIMIT_MAX`: `120`
   - `RATE_LIMIT_WINDOW_MIN`: `15`
4. Set build command: `npm install`
5. Set start command: `node server.js` (Render reads `package.json` by default)
6. Deploy and monitor logs

### Frontend (Vercel / Netlify)

1. **Option A: Deploy static frontend to Vercel**
   - Connect GitHub to Vercel
   - Set root directory to `public/`
   - Deploy

2. **Option B: Deploy static frontend to Netlify**
   - Connect GitHub to Netlify
   - Set publish directory to `public/`
   - Deploy

### Database

1. Create a MongoDB Atlas cluster (free tier available)
2. Set up a database user with strong password
3. Add IP whitelist (allow 0.0.0.0/0 for Render, or use Render's static IP)
4. Copy connection string and add to `MONGO_URI` env var

### Production Checklist

- [ ] `NODE_ENV=production` set on backend
- [ ] `JWT_SECRET` is a strong random string (not in code)
- [ ] `MONGO_URI` points to production MongoDB
- [ ] `CLIENT_URL` matches your frontend domain
- [ ] Paystack live keys are configured (not sandbox keys)
- [ ] HTTPS is enabled on both frontend and backend
- [ ] CSRF protection is enforced on state-changing requests
- [ ] Rate limiting is enabled
- [ ] Helmet.js security headers are active
- [ ] MongoDB backups are enabled
- [ ] Frontend is served from a CDN (Vercel/Netlify automatically does this)
- [ ] Environment variables are NOT committed to source code

## Environment Variables

Required for production:
- `NODE_ENV`: Set to `production` for production deployments
- `PORT`: Default `5000` locally, Render assigns this automatically
- `MONGO_URI`: MongoDB connection string (use MongoDB Atlas)
- `JWT_SECRET`: Strong random secret (min 32 chars)
- `JWT_EXPIRES_IN`: Token expiration (e.g., `7d`)
- `JWT_COOKIE_EXPIRES_IN`: Cookie expiration in days (e.g., `7`)
- `CLIENT_URL`: Frontend URL (e.g., `https://yourdomain.com`)
- `PAYSTACK_SECRET_KEY`: Paystack live secret (not sandbox)
- `FLUTTERWAVE_SECRET_KEY`: Flutterwave live secret (optional)
- `RATE_LIMIT_MAX`: Max requests per window (default `120`)
- `RATE_LIMIT_WINDOW_MIN`: Rate limit window in minutes (default `15`)


## Future Scaling

- Mobile app API compatibility
- Multi-branch and agent banking support
- Savings groups and wallet-based product expansion
- Modular API versioning and microservices transition
