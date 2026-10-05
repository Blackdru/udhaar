const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../../udhaar.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for high concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS owners (
      id TEXT PRIMARY KEY,
      mobile TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      otp_code TEXT,
      otp_expires_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      category TEXT DEFAULT 'General Store / Kirana',
      address TEXT DEFAULT 'Main Market',
      qr_token TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      UNIQUE(business_id, mobile)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      transaction_number TEXT UNIQUE NOT NULL,
      business_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_mobile TEXT NOT NULL,
      amount REAL NOT NULL,
      notes TEXT,
      receipt_url TEXT,
      status TEXT DEFAULT 'ACTIVE',
      void_reason TEXT,
      voided_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      transaction_id TEXT,
      action TEXT NOT NULL,
      performed_by TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      transaction_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      amount REAL,
      customer_name TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_businesses_qr ON businesses(qr_token);
    CREATE INDEX IF NOT EXISTS idx_customers_biz_mobile ON customers(business_id, mobile);
    CREATE INDEX IF NOT EXISTS idx_transactions_biz ON transactions(business_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
    CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
    CREATE INDEX IF NOT EXISTS idx_notifications_biz ON notifications(business_id, is_read);
  `);

  seedInitialData();
}

function seedInitialData() {
  const existingOwner = db.prepare('SELECT id FROM owners LIMIT 1').get();
  if (existingOwner) return;

  const now = new Date().toISOString();
  const ownerId = 'own_demo_01';
  const bizId = 'biz_demo_01';
  const qrToken = '7XK92P';

  // Seed Owner
  db.prepare(`
    INSERT INTO owners (id, mobile, name, otp_code, otp_expires_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(ownerId, '9876543210', 'Rajesh Sharma', '1234', new Date(Date.now() + 864000000).toISOString(), now, now);

  // Seed Business
  db.prepare(`
    INSERT INTO businesses (id, owner_id, name, owner_name, mobile, category, address, qr_token, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(bizId, ownerId, 'Sharma Kirana & General Store', 'Rajesh Sharma', '9876543210', 'Kirana & Grocery', 'Shop #14, Sector 7 Market, Delhi', qrToken, now, now);

  // Seed Customers
  const customers = [
    { id: 'cust_01', name: 'Ramesh Kumar', mobile: '9811122233' },
    { id: 'cust_02', name: 'Pooja Verma', mobile: '9822233344' },
    { id: 'cust_03', name: 'Anil Gupta', mobile: '9833344455' },
    { id: 'cust_04', name: 'Sunita Devi', mobile: '9844455566' },
    { id: 'cust_05', name: 'Vikram Singh', mobile: '9855566677' }
  ];

  const insertCust = db.prepare(`
    INSERT INTO customers (id, business_id, name, mobile, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  customers.forEach(c => {
    insertCust.run(c.id, bizId, c.name, c.mobile, now, now);
  });

  // Seed sample realistic transactions with timestamps over the past week
  const txns = [
    {
      id: 'tx_01',
      num: 'UDH-20261002-A8F42K9',
      custId: 'cust_01',
      name: 'Ramesh Kumar',
      mobile: '9811122233',
      amount: 750,
      notes: 'Monthly staples & Mustard oil (1L)',
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 mins ago
    },
    {
      id: 'tx_02',
      num: 'UDH-20261002-C3B19M4',
      custId: 'cust_02',
      name: 'Pooja Verma',
      mobile: '9822233344',
      amount: 1250,
      notes: 'Aashirvaad Atta 10kg, Tata Salt, Ghee 500g',
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString() // 2 hours ago
    },
    {
      id: 'tx_03',
      num: 'UDH-20261001-K9X27P1',
      custId: 'cust_03',
      name: 'Anil Gupta',
      mobile: '9833344455',
      amount: 420,
      notes: 'Dairy, bread, eggs',
      created_at: new Date(Date.now() - 26 * 3600 * 1000).toISOString() // yesterday
    },
    {
      id: 'tx_04',
      num: 'UDH-20260930-R4Q88Z2',
      custId: 'cust_01',
      name: 'Ramesh Kumar',
      mobile: '9811122233',
      amount: 500,
      notes: 'Pulses & spices',
      created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
    },
    {
      id: 'tx_05',
      num: 'UDH-20260928-V7T11W6',
      custId: 'cust_04',
      name: 'Sunita Devi',
      mobile: '9844455566',
      amount: 1850,
      notes: 'Basmati Rice 5kg, Sugar 5kg, Tea',
      created_at: new Date(Date.now() - 96 * 3600 * 1000).toISOString()
    },
    {
      id: 'tx_06',
      num: 'UDH-20260925-P2M44L8',
      custId: 'cust_05',
      name: 'Vikram Singh',
      mobile: '9855566677',
      amount: 980,
      notes: 'Cleaning supplies & detergents',
      created_at: new Date(Date.now() - 150 * 3600 * 1000).toISOString()
    }
  ];

  const insertTx = db.prepare(`
    INSERT INTO transactions (id, transaction_number, business_id, customer_id, customer_name, customer_mobile, amount, notes, receipt_url, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
  `);

  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, business_id, transaction_id, action, performed_by, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, business_id, transaction_id, title, message, amount, customer_name, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  txns.forEach((t, idx) => {
    insertTx.run(t.id, t.num, bizId, t.custId, t.name, t.mobile, t.amount, t.notes, null, t.created_at, t.created_at);
    insertAudit.run(`aud_${idx}`, bizId, t.id, 'CREATED', 'CUSTOMER', JSON.stringify({ amount: t.amount, note: t.notes }), t.created_at);
    insertNotif.run(`notif_${idx}`, bizId, t.id, 'New Udhaar Recorded', `₹${t.amount} recorded by ${t.name}`, t.amount, t.name, idx > 1 ? 1 : 0, t.created_at);
  });
}

initDatabase();

module.exports = db;
