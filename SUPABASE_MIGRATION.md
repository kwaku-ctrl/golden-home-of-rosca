# Supabase Database Schema & Migration Guide

## SQL Schema to Create in Supabase

Run these SQL commands in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor → New query):

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  address TEXT,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'member', -- member, admin, super-admin
  created_at TIMESTAMP DEFAULT NOW() WITH TIME ZONE,
  updated_at TIMESTAMP DEFAULT NOW() WITH TIME ZONE
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);

-- Create savings table
CREATE TABLE savings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_type TEXT, -- regular, recurring, etc
  balance DECIMAL(15, 2) DEFAULT 0,
  frequency TEXT, -- daily, weekly, monthly
  amount DECIMAL(15, 2) DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW() WITH TIME ZONE,
  updated_at TIMESTAMP DEFAULT NOW() WITH TIME ZONE
);

CREATE INDEX idx_savings_user_id ON savings(user_id);

-- Create loans table
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) DEFAULT 0,
  duration_months INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, completed
  purpose TEXT,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() WITH TIME ZONE,
  updated_at TIMESTAMP DEFAULT NOW() WITH TIME ZONE
);

CREATE INDEX idx_loans_user_id ON loans(user_id);

-- Create repayments table
CREATE TABLE repayments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  due_date TIMESTAMP,
  paid_date TIMESTAMP,
  status TEXT DEFAULT 'pending', -- pending, completed, overdue
  created_at TIMESTAMP DEFAULT NOW() WITH TIME ZONE,
  updated_at TIMESTAMP DEFAULT NOW() WITH TIME ZONE
);

CREATE INDEX idx_repayments_loan_id ON repayments(loan_id);
CREATE INDEX idx_repayments_user_id ON repayments(user_id);

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- deposit, withdrawal, repayment, interest, fee
  amount DECIMAL(15, 2) NOT NULL,
  status TEXT DEFAULT 'completed', -- pending, completed, failed
  description TEXT,
  reference_id TEXT,
  reference_type TEXT, -- saving_id, loan_id, repayment_id
  created_at TIMESTAMP DEFAULT NOW() WITH TIME ZONE,
  updated_at TIMESTAMP DEFAULT NOW() WITH TIME ZONE
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- Create KYC table
CREATE TABLE kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- id_card, drivers_license, passport, etc
  document_url TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() WITH TIME ZONE,
  updated_at TIMESTAMP DEFAULT NOW() WITH TIME ZONE
);

CREATE INDEX idx_kyc_user_id ON kyc_documents(user_id);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread', -- read, unread
  type TEXT, -- info, warning, error, success
  created_at TIMESTAMP DEFAULT NOW() WITH TIME ZONE,
  updated_at TIMESTAMP DEFAULT NOW() WITH TIME ZONE
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- Create admin users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'admin', -- admin, super-admin
  created_at TIMESTAMP DEFAULT NOW() WITH TIME ZONE,
  updated_at TIMESTAMP DEFAULT NOW() WITH TIME ZONE
);

CREATE INDEX idx_admin_users_email ON admin_users(email);

-- Create blogs table
CREATE TABLE blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  image_url TEXT,
  author TEXT,
  status TEXT DEFAULT 'draft', -- draft, published
  created_at TIMESTAMP DEFAULT NOW() WITH TIME ZONE,
  updated_at TIMESTAMP DEFAULT NOW() WITH TIME ZONE
);

-- Create testimonials table
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  rating INTEGER, -- 1-5 stars
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP DEFAULT NOW() WITH TIME ZONE,
  updated_at TIMESTAMP DEFAULT NOW() WITH TIME ZONE
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

## Steps to Execute

1. Go to https://supabase.com/dashboard
2. Select your project: **dwlyfinisoi**
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the SQL above
6. Click **Run** button
7. Check for any errors

## Important Notes

- **UUIDs**: PostgreSQL uses UUIDs instead of MongoDB ObjectIds
- **Timestamps**: All timestamps are stored with timezone
- **Indexes**: Created for frequently queried fields (email, user_id, created_at)
- **Foreign Keys**: Enforces referential integrity with CASCADE on delete
- **Row Level Security**: Optional but recommended for production (will need policies)

## Next Steps

1. Run this SQL in Supabase
2. Update Node.js models to use Supabase instead of Mongoose
3. Test API endpoints
4. Deploy to production
