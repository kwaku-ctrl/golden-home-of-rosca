# Deployment Guide: Golden Home Of ROSCA

## Prerequisites

- GitHub account
- Render.com account (free tier available)
- MongoDB Atlas account (free tier available)
- Paystack account (for payments)

---

## Step 1: Prepare GitHub Repository

### 1.1 Create a GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `golden-home-of-rosca`
3. Set it to **Private** (if sensitive) or **Public**
4. Do NOT initialize with README (you already have one)

### 1.2 Push Code to GitHub

```bash
cd c:\Users\kb626\OneDrive\Desktop\GHOR
git init
git add .
git commit -m "Initial commit: Golden Home Of ROSCA fintech platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/golden-home-of-rosca.git
git push -u origin main
```

### 1.3 Verify Sensitive Files Are NOT Pushed

Ensure these files are **NOT** in the repo:
- `.env` (only `.env.example` should be there)
- `.env.production`
- Any API keys or tokens

Check with:
```bash
git status
```

---

## Step 2: Set Up MongoDB Atlas (Database)

### 2.1 Create a Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Create a new project: "Golden Home"
4. Create a cluster:
   - Select **M0 (Free)** tier
   - Choose region closest to your users
   - Click "Create Cluster"

### 2.2 Create a Database User

1. Go to **Database Access** in the left menu
2. Click "Add New Database User"
3. Set username: `ghor_user`
4. Set password: Use a strong random password (copy it for later)
5. Set role: **Atlas Admin**
6. Click "Add User"

### 2.3 Set IP Whitelist

1. Go to **Network Access** in the left menu
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (for Render compatibility)
   - Or add Render's IP range if you know it
4. Click "Confirm"

### 2.4 Get Connection String

1. Go to **Database** → your cluster → "Connect"
2. Select "Connect your application"
3. Choose Driver: **Node.js**, Version: **latest**
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `myFirstDatabase` with `ghor`

Example:
```
mongodb+srv://ghor_user:PASSWORD@cluster0.xxxxx.mongodb.net/ghor?retryWrites=true&w=majority
```

---

## Step 3: Deploy Backend on Render

### 3.1 Connect GitHub to Render

1. Go to [Render.com](https://render.com)
2. Sign up or log in
3. Click "New +" and select "Web Service"
4. Click "Connect account" for GitHub
5. Authorize Render to access your GitHub
6. Select the `golden-home-of-rosca` repository

### 3.2 Configure Web Service

1. **Name**: `ghor-backend`
2. **Environment**: `Node`
3. **Build Command**: `npm install`
4. **Start Command**: `node server.js`
5. **Plan**: Select **Free** tier
6. **Region**: Choose closest to your users

### 3.3 Set Environment Variables

In Render dashboard, add these under **Environment**:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | Leave blank (Render auto-assigns) |
| `MONGO_URI` | Your MongoDB Atlas connection string (from Step 2.4) |
| `JWT_SECRET` | Generate strong random: `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | `7d` |
| `JWT_COOKIE_EXPIRES_IN` | `7` |
| `CLIENT_URL` | Your frontend URL (will set after deploying frontend) |
| `PAYSTACK_SECRET_KEY` | Your Paystack live secret key |
| `FLUTTERWAVE_SECRET_KEY` | Your Flutterwave live secret (if using) |
| `RATE_LIMIT_MAX` | `120` |
| `RATE_LIMIT_WINDOW_MIN` | `15` |

### 3.4 Deploy

1. Click **"Deploy"** button
2. Wait for deployment (5-10 minutes)
3. Once done, you'll see your backend URL (e.g., `https://ghor-backend.onrender.com`)
4. **Copy this URL** — you'll need it for frontend config

---

## Step 4: Deploy Frontend on Vercel (or Netlify)

### Option A: Vercel Deployment

#### 4A.1 Connect GitHub

1. Go to [Vercel.com](https://vercel.com)
2. Sign up or log in with GitHub
3. Click "New Project"
4. Select `golden-home-of-rosca` repository

#### 4A.2 Configure

1. **Framework**: None (static)
2. **Root Directory**: `public`
3. **Build Command**: Leave empty
4. **Output Directory**: Leave empty

#### 4A.3 Environment Variables

Add under **Environment Variables**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | Your Render backend URL (from Step 3.4) |

#### 4A.4 Deploy

1. Click **"Deploy"**
2. Wait for deployment
3. You'll get a frontend URL (e.g., `https://golden-home.vercel.app`)

### Option B: Netlify Deployment

#### 4B.1 Connect GitHub

1. Go to [Netlify.com](https://netlify.com)
2. Sign up or log in with GitHub
3. Click "Add new site" → "Import an existing project"
4. Select GitHub and choose `golden-home-of-rosca`

#### 4B.2 Configure

1. **Branch to deploy**: `main`
2. **Build command**: Leave empty
3. **Publish directory**: `public`

#### 4B.3 Deploy

1. Click **"Deploy site"**
2. Wait for deployment
3. You'll get a frontend URL (e.g., `https://golden-home.netlify.app`)

---

## Step 5: Update Backend with Frontend URL

Once you have your frontend URL, update the backend:

### 5.1 In Render Dashboard

1. Go to your `ghor-backend` service
2. Click **"Environment"**
3. Update `CLIENT_URL` to your frontend URL
4. Click **"Save"**
5. Render will automatically redeploy

---

## Step 6: Test the Deployment

### 6.1 Test Frontend

1. Open your frontend URL in browser
2. Try to register/login
3. Verify the dashboard loads

### 6.2 Test Backend API

```bash
curl https://your-render-backend.onrender.com/api/csrf-token
```

You should get:
```json
{"csrfToken":"..."}
```

### 6.3 Test Database Connection

Check the Render logs:
1. Go to your `ghor-backend` service
2. Click **"Logs"**
3. Look for messages like: `Server running in production mode on port ...`

---

## Step 7: Configure Paystack (Payments)

### 7.1 Get Live Keys

1. Go to [Paystack Dashboard](https://dashboard.paystack.com)
2. Go to **Settings** → **API Keys & Webhooks**
3. Copy your **Live Secret Key** (not test key)

### 7.2 Update Render Environment

In Render dashboard:
1. Set `PAYSTACK_SECRET_KEY` to your live secret key
2. Redeploy

### 7.3 Register Webhook

In Paystack Dashboard:
1. Go to **Settings** → **API Keys & Webhooks**
2. Add webhook URL: `https://your-render-backend.onrender.com/api/payments/webhook`
3. Select events: `charge.success`, `charge.failed`
4. Save

---

## Step 8: Monitor & Maintain

### 8.1 Check Logs

**Render Logs:**
- Go to your service → **Logs** tab
- Look for errors or performance issues

**MongoDB Logs:**
- Go to MongoDB Atlas → **Monitoring** tab
- Check connection count, database size

### 8.2 Set Up Backups

**MongoDB Atlas:**
1. Go to **Backup** tab
2. Enable automatic backups (M0 free tier gets limited backups)
3. Consider daily backups for production

**GitHub:**
- Your code is backed up automatically on GitHub

### 8.3 Performance & Security

- Monitor response times in Render logs
- Check rate limiting is working
- Verify HTTPS is enforced
- Monitor MongoDB connection pool
- Set up error tracking (optional: Sentry, LogRocket)

---

## Troubleshooting

### Backend Won't Start

1. Check Render logs for error messages
2. Verify all env vars are set
3. Test MongoDB connection string locally first
4. Check `.env.example` matches required vars

### Frontend Can't Connect to API

1. Verify `CLIENT_URL` is set in backend
2. Check `VITE_API_URL` or frontend API base matches backend URL
3. Check CORS is enabled in backend (`server.js`)
4. Look for HTTPS/mixed content warnings in browser console

### Database Connection Fails

1. Verify MongoDB connection string is correct
2. Check database user password
3. Verify IP whitelist allows Render's IP
4. Test connection string locally: `mongosh "your-connection-string"`

### Paystack Webhook Not Firing

1. Verify webhook URL is correct in Paystack dashboard
2. Check Render logs for webhook requests
3. Ensure `PAYSTACK_SECRET_KEY` is set to LIVE key, not test

---

## Production Checklist

Before going live, verify:

- [ ] GitHub repository is set up with all code
- [ ] `.env` and `.env.production` are in `.gitignore`
- [ ] MongoDB Atlas cluster is running
- [ ] Render backend is deployed and running
- [ ] Frontend is deployed (Vercel or Netlify)
- [ ] `CLIENT_URL` is set correctly in backend
- [ ] Paystack live keys are configured
- [ ] Webhook is registered with Paystack
- [ ] HTTPS is enforced on all domains
- [ ] Database backups are enabled
- [ ] Monitoring/alerts are set up
- [ ] Rate limiting is enabled
- [ ] CSRF protection is active
- [ ] Environment variables are secure and not in code

---

## Support & Next Steps

For issues or questions:
1. Check the project README
2. Review Render logs: `Service` → `Logs`
3. Test API endpoints with curl/Postman
4. Check MongoDB Atlas monitoring

For scaling:
- Monitor Render usage and consider upgrading plan
- Set up database replication on MongoDB
- Consider adding a CDN (Vercel/Netlify do this automatically)
- Implement logging/monitoring (Sentry, LogRocket, etc.)
