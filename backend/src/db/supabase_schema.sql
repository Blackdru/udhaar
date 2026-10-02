-- Udhaar V1 PostgreSQL / Supabase Schema

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Owners Table
CREATE TABLE IF NOT EXISTS owners (
  id TEXT PRIMARY KEY,
  mobile VARCHAR(15) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  otp_code VARCHAR(10),
  otp_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Businesses Table
CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  owner_name VARCHAR(100) NOT NULL,
  mobile VARCHAR(15) NOT NULL,
  category VARCHAR(100) DEFAULT 'General Store / Kirana',
  address TEXT DEFAULT 'Main Market',
  qr_token VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Customers Table (scoped per business)
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  mobile VARCHAR(15) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_business_customer_mobile UNIQUE (business_id, mobile)
);

-- 4. Transactions Table (Core Udhaar Ledger)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  transaction_number VARCHAR(40) UNIQUE NOT NULL,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(100) NOT NULL,
  customer_mobile VARCHAR(15) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  notes TEXT,
  receipt_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'VOIDED')),
  void_reason TEXT,
  voided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Audit Logs (Preserve immutable audit trail)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  transaction_id TEXT,
  action VARCHAR(30) NOT NULL,
  performed_by VARCHAR(50) NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Notifications Table (In-app notification records)
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  transaction_id TEXT,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  amount NUMERIC(12, 2),
  customer_name VARCHAR(100),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for rapid querying
CREATE INDEX IF NOT EXISTS idx_businesses_qr_token ON businesses(qr_token);
CREATE INDEX IF NOT EXISTS idx_customers_biz_mobile ON customers(business_id, mobile);
CREATE INDEX IF NOT EXISTS idx_transactions_biz_status ON transactions(business_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_biz_read ON notifications(business_id, is_read);
