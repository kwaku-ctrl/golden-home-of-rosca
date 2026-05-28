# Supabase Migration - Quick Start Guide

## ⚠️ IMPORTANT - BEFORE YOU START

You have Supabase credentials configured. Here's what you need to do:

### Step 1: Fix PowerShell Execution Issue (Windows)
Your PowerShell is blocking npm execution. Run this in PowerShell as Administrator:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try npm install again:
```bash
npm install
```

### Step 2: Create Supabase Database Schema
1. Go to: https://supabase.com/dashboard
2. Select your project: **dwlyfinisoi**
3. Click **SQL Editor** → **New Query**
4. Copy all SQL from [SUPABASE_MIGRATION.md](./SUPABASE_MIGRATION.md)
5. Click **Run**

This creates all tables: users, savings, loans, transactions, kyc_documents, notifications, etc.

### Step 3: Update Backend Code (Already Prepared)
The following files have been created for Supabase:

- ✅ `config/supabase.js` - Supabase client initialization
- ✅ `SUPABASE_MIGRATION.md` - Complete SQL schema
- ✅ `.env` - Updated with Supabase credentials

### Step 4: Install Dependencies Locally
After fixing PowerShell, run:
```bash
npm install
```

This will install @supabase/supabase-js and all dependencies.

### Step 5: Test Locally
```bash
npm run dev
```

Open http://localhost:5000

### Step 6: Deploy to Render
Push to GitHub and Render will auto-deploy with the new Supabase configuration.

---

## Your Supabase Credentials

- **URL**: https://dwlyfinisoi.supabase.co
- **Project Ref**: dwlyfinisoi
- **Anon Key**: Available in .env (SUPABASE_ANON_KEY)
- **Secret Key**: Available in .env (SUPABASE_SECRET_KEY)

---

## What Happens Next?

Once the schema is created, the backend code will automatically:
1. Connect to Supabase instead of MongoDB
2. Use SQL queries via Supabase client
3. Maintain all existing API endpoints
4. Frontend code needs NO changes

---

## Rollback Plan

If needed, you can revert to MongoDB:
- Uncomment MONGO_URI in .env
- Restore MongoDB connection in server.js
- Old controllers still support Mongoose (though new ones will be Supabase-only)

---

## Need Help?

- Supabase Docs: https://supabase.com/docs
- JavaScript Client: https://supabase.com/docs/reference/javascript/introduction
- Contact Supabase Support: https://supabase.com/support
