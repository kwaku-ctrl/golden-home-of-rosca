# Quick Start Guide for Deployment

## For the Impatient 🚀

**TL;DR: Follow these 4 steps in order**

### Step 1: Push to GitHub (2 min)
```bash
cd c:\Users\kb626\OneDrive\Desktop\GHOR
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/golden-home-of-rosca.git
git push -u origin main
```

### Step 2: Set Up MongoDB (5 min)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Create database user (`ghor_user` / strong password)
4. Allow IP access (0.0.0.0/0)
5. Copy connection string → save it

### Step 3: Deploy Backend on Render (10 min)
1. Go to https://render.com
2. Create new Web Service
3. Connect your GitHub repo
4. Set environment variables:
   - `NODE_ENV`: `production`
   - `MONGO_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Generate with `openssl rand -base64 32`
   - `JWT_EXPIRES_IN`: `7d`
   - `JWT_COOKIE_EXPIRES_IN`: `7`
   - `CLIENT_URL`: Will update after frontend
   - `PAYSTACK_SECRET_KEY`: Your live Paystack key
   - `RATE_LIMIT_MAX`: `120`
   - `RATE_LIMIT_WINDOW_MIN`: `15`
5. Deploy
6. Copy your backend URL (e.g., `https://ghor-backend.onrender.com`)

### Step 4: Deploy Frontend on Vercel (5 min)
1. Go to https://vercel.com
2. Import `golden-home-of-rosca` repo from GitHub
3. Set root directory: `public`
4. Add env var: `VITE_API_URL` = Your Render backend URL
5. Deploy
6. Get your frontend URL

### Step 5: Update Backend with Frontend URL
1. Go to Render backend settings
2. Update `CLIENT_URL` to your Vercel URL
3. Redeploy

---

## You're Done! ✅

- Frontend: Your Vercel URL
- Backend API: Your Render URL
- Database: MongoDB Atlas

---

## Important Notes

- **Keep `.env` out of GitHub** (use `.env.example` instead)
- **Use strong JWT_SECRET** (don't use the same locally and production)
- **Use LIVE Paystack keys** in production (not test keys)
- **Enable backups** on MongoDB for data safety
- **Monitor logs** on Render for errors

---

## Troubleshooting

**Frontend can't connect to backend?**
- Check `CLIENT_URL` in Render is set correctly
- Check `VITE_API_URL` on Vercel is correct
- Check CORS is enabled in backend

**Backend won't start?**
- Check MongoDB connection string is valid
- Check all required env vars are set
- Look at Render logs for specific error

**Database connection fails?**
- Verify connection string has correct password
- Check IP whitelist in MongoDB Atlas
- Test connection locally first

---

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)
