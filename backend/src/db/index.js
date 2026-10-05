const { createClient } = require('@supabase/supabase-js');
const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hgjuanpwcxdkhrdkvwgd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnanVhbnB3Y3hka2hyZGt2d2dkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDkyNDU0MSwiZXhwIjoyMTA2NTAwNTQxfQ.Q7kLP6e-3tt6z3KH6Sa17rmAq-m0MRqGAZK--rCx7i0';
const DB_MODE = (process.env.DB_MODE || 'supabase').toLowerCase();
const isSupabase = DB_MODE === 'supabase' && !!SUPABASE_URL && !!SUPABASE_SERVICE_ROLE_KEY;

let sqliteDb = null;
let supabaseClient = null;

if (isSupabase) {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });
} else {
  const dbPath = path.resolve(__dirname, '../../udhaar.db');
  sqliteDb = new Database(dbPath);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');
}

// ----------------- SEEDING HELPERS -----------------
async function seedInitialDataIfEmpty() {
  const now = new Date().toISOString();
  const ownerId = 'own_demo_01';
  const bizId = 'biz_demo_01';
  const qrToken = '7XK92P';

  if (isSupabase) {
    try {
      const { data: existingOwner } = await supabaseClient.from('owners').select('id').limit(1);
      if (existingOwner && existingOwner.length > 0) return;

      console.log('🌱 Seeding Supabase with initial Kirana store and sample transactions...');

      await supabaseClient.from('owners').insert({
        id: ownerId,
        mobile: '9876543210',
        name: 'Rajesh Sharma',
        otp_code: '1234',
        otp_expires_at: new Date(Date.now() + 864000000).toISOString(),
        created_at: now,
        updated_at: now
      });

      await supabaseClient.from('businesses').insert({
        id: bizId,
        owner_id: ownerId,
        name: 'Sharma Kirana & General Store',
        owner_name: 'Rajesh Sharma',
        mobile: '9876543210',
        category: 'Kirana & Grocery',
        address: 'Shop #14, Sector 7 Market, Delhi',
        qr_token: qrToken,
        created_at: now,
        updated_at: now
      });

      const customers = [
        { id: 'cust_01', name: 'Ramesh Kumar', mobile: '9811122233' },
        { id: 'cust_02', name: 'Pooja Verma', mobile: '9822233344' },
        { id: 'cust_03', name: 'Anil Gupta', mobile: '9833344455' },
        { id: 'cust_04', name: 'Sunita Devi', mobile: '9844455566' },
        { id: 'cust_05', name: 'Vikram Singh', mobile: '9855566677' }
      ];

      for (const c of customers) {
        await supabaseClient.from('customers').insert({
          id: c.id,
          business_id: bizId,
          name: c.name,
          mobile: c.mobile,
          created_at: now,
          updated_at: now
        });
      }

      const txns = [
        { id: 'tx_01', num: 'UDH-20261002-A8F42K9', custId: 'cust_01', name: 'Ramesh Kumar', mobile: '9811122233', amount: 750, notes: 'Monthly staples & Mustard oil (1L)' },
        { id: 'tx_02', num: 'UDH-20261002-C3B19M4', custId: 'cust_02', name: 'Pooja Verma', mobile: '9822233344', amount: 1250, notes: 'Aashirvaad Atta 10kg, Tata Salt, Ghee 500g' },
        { id: 'tx_03', num: 'UDH-20261001-K9X27P1', custId: 'cust_03', name: 'Anil Gupta', mobile: '9833344455', amount: 420, notes: 'Dairy, bread, eggs' },
        { id: 'tx_04', num: 'UDH-20260930-R4Q88Z2', custId: 'cust_01', name: 'Ramesh Kumar', mobile: '9811122233', amount: 500, notes: 'Pulses & spices' },
        { id: 'tx_05', num: 'UDH-20260928-V7T11W6', custId: 'cust_04', name: 'Sunita Devi', mobile: '9844455566', amount: 1850, notes: 'Basmati Rice 5kg, Sugar 5kg, Tea' },
        { id: 'tx_06', num: 'UDH-20260925-P2M44L8', custId: 'cust_05', name: 'Vikram Singh', mobile: '9855566677', amount: 980, notes: 'Cleaning supplies & detergents' }
      ];

      for (const t of txns) {
        await supabaseClient.from('transactions').insert({
          id: t.id,
          transaction_number: t.num,
          business_id: bizId,
          customer_id: t.custId,
          customer_name: t.name,
          customer_mobile: t.mobile,
          amount: t.amount,
          notes: t.notes,
          status: 'ACTIVE',
          created_at: now,
          updated_at: now
        });
      }

      console.log('✅ Supabase initialized and seeded successfully.');
    } catch (err) {
      console.error('Supabase seed error:', err.message);
    }
  } else {
    // SQLite auto-init
    require('./database');
  }
}

// ----------------- UNIFIED DATA ACCESS REPOSITORY -----------------
const dbRepo = {
  isSupabase,
  supabaseClient,
  sqliteDb,

  async init() {
    await seedInitialDataIfEmpty();
  },

  // --- OWNERS ---
  async getOwnerByMobile(mobile) {
    if (isSupabase) {
      const { data } = await supabaseClient.from('owners').select('*').eq('mobile', mobile).maybeSingle();
      return data;
    }
    return sqliteDb.prepare('SELECT * FROM owners WHERE mobile = ?').get(mobile);
  },

  async getOwnerById(id) {
    if (isSupabase) {
      const { data } = await supabaseClient.from('owners').select('id, mobile, name').eq('id', id).maybeSingle();
      return data;
    }
    return sqliteDb.prepare('SELECT id, mobile, name FROM owners WHERE id = ?').get(id);
  },

  async createOwner({ id, mobile, name, otp, expiresAt }) {
    const now = new Date().toISOString();
    if (isSupabase) {
      const { data, error } = await supabaseClient.from('owners').insert({
        id, mobile, name, otp_code: otp, otp_expires_at: expiresAt, created_at: now, updated_at: now
      }).select().single();
      if (error) throw error;
      return data;
    }
    sqliteDb.prepare(`
      INSERT INTO owners (id, mobile, name, otp_code, otp_expires_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, mobile, name, otp, expiresAt, now, now);
    return this.getOwnerById(id);
  },

  async updateOwnerOtp(id, otp, expiresAt) {
    const now = new Date().toISOString();
    if (isSupabase) {
      await supabaseClient.from('owners').update({ otp_code: otp, otp_expires_at: expiresAt, updated_at: now }).eq('id', id);
      return;
    }
    sqliteDb.prepare('UPDATE owners SET otp_code = ?, otp_expires_at = ?, updated_at = ? WHERE id = ?').run(otp, expiresAt, now, id);
  },

  async updateOwnerName(id, name) {
    const now = new Date().toISOString();
    if (isSupabase) {
      await supabaseClient.from('owners').update({ name, updated_at: now }).eq('id', id);
      return;
    }
    sqliteDb.prepare('UPDATE owners SET name = ?, updated_at = ? WHERE id = ?').run(name, now, id);
  },

  // --- BUSINESSES ---
  async getBusinessByOwnerId(ownerId) {
    if (isSupabase) {
      const { data } = await supabaseClient.from('businesses').select('*').eq('owner_id', ownerId).maybeSingle();
      return data;
    }
    return sqliteDb.prepare('SELECT * FROM businesses WHERE owner_id = ?').get(ownerId);
  },

  async getBusinessById(id) {
    if (isSupabase) {
      const { data } = await supabaseClient.from('businesses').select('*').eq('id', id).maybeSingle();
      return data;
    }
    return sqliteDb.prepare('SELECT * FROM businesses WHERE id = ?').get(id);
  },

  async getBusinessByQrToken(qrToken) {
    if (isSupabase) {
      const { data } = await supabaseClient.from('businesses').select('id, name, owner_name, category, address, qr_token').eq('qr_token', qrToken).maybeSingle();
      return data;
    }
    return sqliteDb.prepare('SELECT id, name, owner_name, category, address, qr_token FROM businesses WHERE qr_token = ?').get(qrToken);
  },

  async createBusiness({ id, ownerId, name, ownerName, mobile, category, address, qrToken }) {
    const now = new Date().toISOString();
    if (isSupabase) {
      const { data, error } = await supabaseClient.from('businesses').insert({
        id, owner_id: ownerId, name, owner_name: ownerName, mobile,
        category: category || 'Kirana & Grocery',
        address: address || 'Main Market',
        qr_token: qrToken,
        created_at: now, updated_at: now
      }).select().single();
      if (error) throw error;
      return data;
    }
    sqliteDb.prepare(`
      INSERT INTO businesses (id, owner_id, name, owner_name, mobile, category, address, qr_token, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, ownerId, name, ownerName, mobile, category || 'Kirana & Grocery', address || 'Main Market', qrToken, now, now);
    return this.getBusinessById(id);
  },

  async updateBusiness(id, { name, category, address }) {
    const now = new Date().toISOString();
    if (isSupabase) {
      const { data, error } = await supabaseClient.from('businesses').update({
        name, category, address, updated_at: now
      }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    sqliteDb.prepare(`
      UPDATE businesses SET name = ?, category = ?, address = ?, updated_at = ? WHERE id = ?
    `).run(name, category, address, now, id);
    return this.getBusinessById(id);
  },

  // --- CUSTOMERS ---
  async getCustomerByBizAndMobile(businessId, mobile) {
    if (isSupabase) {
      const { data } = await supabaseClient.from('customers').select('*').eq('business_id', businessId).eq('mobile', mobile).maybeSingle();
      return data;
    }
    return sqliteDb.prepare('SELECT * FROM customers WHERE business_id = ? AND mobile = ?').get(businessId, mobile);
  },

  async getCustomerById(id, businessId) {
    if (isSupabase) {
      const { data } = await supabaseClient.from('customers').select('*').eq('id', id).eq('business_id', businessId).maybeSingle();
      return data;
    }
    return sqliteDb.prepare('SELECT * FROM customers WHERE id = ? AND business_id = ?').get(id, businessId);
  },

  async createCustomer({ id, businessId, name, mobile }) {
    const now = new Date().toISOString();
    if (isSupabase) {
      const { data, error } = await supabaseClient.from('customers').insert({
        id, business_id: businessId, name, mobile, created_at: now, updated_at: now
      }).select().single();
      if (error) throw error;
      return data;
    }
    sqliteDb.prepare(`
      INSERT INTO customers (id, business_id, name, mobile, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, businessId, name, mobile, now, now);
    return { id, business_id: businessId, name, mobile };
  },

  async updateCustomerName(id, name) {
    const now = new Date().toISOString();
    if (isSupabase) {
      await supabaseClient.from('customers').update({ name, updated_at: now }).eq('id', id);
      return;
    }
    sqliteDb.prepare('UPDATE customers SET name = ?, updated_at = ? WHERE id = ?').run(name, now, id);
  },

  async getCustomersWithTotals(businessId, search) {
    if (isSupabase) {
      let query = supabaseClient.from('customers').select(`
        id, business_id, name, mobile, created_at,
        transactions ( id, amount, status, created_at )
      `).eq('business_id', businessId);

      if (search && search.trim()) {
        const term = search.trim();
        query = query.or(`name.ilike.%${term}%,mobile.ilike.%${term}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(c => {
        const txs = c.transactions || [];
        const activeTxs = txs.filter(t => t.status === 'ACTIVE');
        const totalOutstanding = activeTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
        return {
          id: c.id,
          business_id: c.business_id,
          name: c.name,
          mobile: c.mobile,
          created_at: c.created_at,
          total_outstanding: totalOutstanding,
          transaction_count: txs.length,
          last_transaction_at: txs.length > 0 ? txs[txs.length - 1].created_at : null
        };
      }).sort((a, b) => b.total_outstanding - a.total_outstanding);
    }

    let query = `
      SELECT 
        c.id, c.business_id, c.name, c.mobile, c.created_at,
        COALESCE(SUM(CASE WHEN t.status = 'ACTIVE' THEN t.amount ELSE 0 END), 0) as total_outstanding,
        COUNT(t.id) as transaction_count,
        MAX(t.created_at) as last_transaction_at
      FROM customers c
      LEFT JOIN transactions t ON c.id = t.customer_id
      WHERE c.business_id = ?
    `;
    const params = [businessId];
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query += ' AND (c.name LIKE ? OR c.mobile LIKE ?)';
      params.push(term, term);
    }
    query += ' GROUP BY c.id ORDER BY total_outstanding DESC, c.name ASC';
    return sqliteDb.prepare(query).all(...params);
  },

  // --- TRANSACTIONS ---
  async createTransaction({ id, transactionNumber, businessId, customerId, customerName, customerMobile, amount, notes, receiptUrl }) {
    const now = new Date().toISOString();
    if (isSupabase) {
      const { data, error } = await supabaseClient.from('transactions').insert({
        id, transaction_number: transactionNumber, business_id: businessId, customer_id: customerId,
        customer_name: customerName, customer_mobile: customerMobile, amount, notes, receipt_url: receiptUrl,
        status: 'ACTIVE', created_at: now, updated_at: now
      }).select().single();
      if (error) throw error;
      return data;
    }
    sqliteDb.prepare(`
      INSERT INTO transactions (
        id, transaction_number, business_id, customer_id, customer_name,
        customer_mobile, amount, notes, receipt_url, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
    `).run(id, transactionNumber, businessId, customerId, customerName, customerMobile, amount, notes, receiptUrl, now, now);

    return this.getTransactionById(id, businessId);
  },

  async getTransactions({ businessId, search, status, limit = 50, offset = 0, startDate, endDate }) {
    if (isSupabase) {
      let query = supabaseClient.from('transactions').select('*', { count: 'exact' }).eq('business_id', businessId);

      if (status && status !== 'ALL') {
        query = query.eq('status', status);
      }
      if (search && search.trim()) {
        const term = search.trim();
        query = query.or(`transaction_number.ilike.%${term}%,customer_name.ilike.%${term}%,customer_mobile.ilike.%${term}%`);
      }
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);

      query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
      const { data, count, error } = await query;
      if (error) throw error;

      // Active sum
      const { data: sumData } = await supabaseClient.from('transactions').select('amount').eq('business_id', businessId).eq('status', 'ACTIVE');
      const totalActiveOutstanding = (sumData || []).reduce((acc, t) => acc + Number(t.amount || 0), 0);

      return {
        transactions: data || [],
        total: count || 0,
        totalActiveOutstanding
      };
    }

    let sql = 'SELECT * FROM transactions WHERE business_id = ?';
    const params = [businessId];

    if (status && status !== 'ALL') {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ' AND (transaction_number LIKE ? OR customer_name LIKE ? OR customer_mobile LIKE ?)';
      params.push(term, term, term);
    }
    if (startDate) { sql += ' AND created_at >= ?'; params.push(startDate); }
    if (endDate) { sql += ' AND created_at <= ?'; params.push(endDate); }

    const countRow = sqliteDb.prepare(`SELECT count(*) as total FROM (${sql})`).get(...params);
    const sumRow = sqliteDb.prepare(`SELECT COALESCE(SUM(amount), 0) as total_active FROM transactions WHERE business_id = ? AND status = 'ACTIVE'`).get(businessId);

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const transactions = sqliteDb.prepare(sql).all(...params);

    return {
      transactions,
      total: countRow ? countRow.total : 0,
      totalActiveOutstanding: sumRow.total_active
    };
  },

  async getTransactionById(id, businessId) {
    if (isSupabase) {
      const { data } = await supabaseClient.from('transactions').select('*').eq('id', id).eq('business_id', businessId).maybeSingle();
      return data;
    }
    return sqliteDb.prepare('SELECT * FROM transactions WHERE id = ? AND business_id = ?').get(id, businessId);
  },

  async updateTransaction(id, businessId, { customerName, notes }) {
    const now = new Date().toISOString();
    if (isSupabase) {
      const { data, error } = await supabaseClient.from('transactions').update({
        customer_name: customerName, notes, updated_at: now
      }).eq('id', id).eq('business_id', businessId).select().single();
      if (error) throw error;
      return data;
    }
    sqliteDb.prepare('UPDATE transactions SET customer_name = ?, notes = ?, updated_at = ? WHERE id = ? AND business_id = ?')
      .run(customerName, notes, now, id, businessId);
    return this.getTransactionById(id, businessId);
  },

  async voidTransaction(id, businessId, reason) {
    const now = new Date().toISOString();
    if (isSupabase) {
      const { data, error } = await supabaseClient.from('transactions').update({
        status: 'VOIDED', void_reason: reason, voided_at: now, updated_at: now
      }).eq('id', id).eq('business_id', businessId).select().single();
      if (error) throw error;
      return data;
    }
    sqliteDb.prepare("UPDATE transactions SET status = 'VOIDED', void_reason = ?, voided_at = ?, updated_at = ? WHERE id = ? AND business_id = ?")
      .run(reason, now, now, id, businessId);
    return this.getTransactionById(id, businessId);
  },

  async getCustomerTransactions(customerId, businessId) {
    if (isSupabase) {
      const { data } = await supabaseClient.from('transactions').select('*').eq('customer_id', customerId).eq('business_id', businessId).order('created_at', { ascending: false });
      return data || [];
    }
    return sqliteDb.prepare('SELECT * FROM transactions WHERE customer_id = ? AND business_id = ? ORDER BY created_at DESC').all(customerId, businessId);
  },

  // --- AUDIT LOGS ---
  async createAuditLog({ id, businessId, transactionId, action, performedBy, details }) {
    const now = new Date().toISOString();
    if (isSupabase) {
      await supabaseClient.from('audit_logs').insert({
        id, business_id: businessId, transaction_id: transactionId, action, performed_by: performedBy, details, created_at: now
      });
      return;
    }
    sqliteDb.prepare(`
      INSERT INTO audit_logs (id, business_id, transaction_id, action, performed_by, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, businessId, transactionId, action, performedBy, JSON.stringify(details), now);
  },

  async getAuditLogs(transactionId) {
    if (isSupabase) {
      const { data } = await supabaseClient.from('audit_logs').select('*').eq('transaction_id', transactionId).order('created_at', { ascending: false });
      return data || [];
    }
    return sqliteDb.prepare('SELECT * FROM audit_logs WHERE transaction_id = ? ORDER BY created_at DESC').all(transactionId);
  },

  // --- NOTIFICATIONS ---
  async createNotification({ id, businessId, transactionId, title, message, amount, customerName }) {
    const now = new Date().toISOString();
    if (isSupabase) {
      await supabaseClient.from('notifications').insert({
        id, business_id: businessId, transaction_id: transactionId, title, message, amount, customer_name: customerName, is_read: false, created_at: now
      });
      return;
    }
    sqliteDb.prepare(`
      INSERT INTO notifications (id, business_id, transaction_id, title, message, amount, customer_name, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(id, businessId, transactionId, title, message, amount, customerName, now);
  },

  async getNotifications(businessId) {
    if (isSupabase) {
      const { data } = await supabaseClient.from('notifications').select('*').eq('business_id', businessId).order('created_at', { ascending: false }).limit(30);
      const unreadCount = (data || []).filter(n => !n.is_read).length;
      return { notifications: data || [], unreadCount };
    }
    const notifs = sqliteDb.prepare('SELECT * FROM notifications WHERE business_id = ? ORDER BY created_at DESC LIMIT 30').all(businessId);
    const unread = sqliteDb.prepare('SELECT COUNT(*) as count FROM notifications WHERE business_id = ? AND is_read = 0').get(businessId);
    return { notifications: notifs, unreadCount: unread ? unread.count : 0 };
  },

  async markNotificationRead(id, businessId) {
    if (isSupabase) {
      await supabaseClient.from('notifications').update({ is_read: true }).eq('id', id).eq('business_id', businessId);
      return;
    }
    sqliteDb.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND business_id = ?').run(id, businessId);
  },

  async markAllNotificationsRead(businessId) {
    if (isSupabase) {
      await supabaseClient.from('notifications').update({ is_read: true }).eq('business_id', businessId);
      return;
    }
    sqliteDb.prepare('UPDATE notifications SET is_read = 1 WHERE business_id = ?').run(businessId);
  },

  // --- ANALYTICS ---
  async getAnalytics(businessId) {
    if (isSupabase) {
      const { data: allTxns } = await supabaseClient.from('transactions').select('*').eq('business_id', businessId);
      const { count: customerCount } = await supabaseClient.from('customers').select('*', { count: 'exact', head: true }).eq('business_id', businessId);

      const activeTxns = (allTxns || []).filter(t => t.status === 'ACTIVE');
      const totalOutstanding = activeTxns.reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const todayStr = new Date().toISOString().slice(0, 10);
      const todayTxns = activeTxns.filter(t => (t.created_at || '').slice(0, 10) === todayStr);
      const todayUdhaar = todayTxns.reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const monthStr = todayStr.slice(0, 7);
      const monthTxns = activeTxns.filter(t => (t.created_at || '').slice(0, 7) === monthStr);
      const thisMonthUdhaar = monthTxns.reduce((sum, t) => sum + Number(t.amount || 0), 0);

      // Daily trend (last 7 days)
      const dayMap = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        dayMap[d] = { day: d, amount: 0, count: 0 };
      }
      activeTxns.forEach(t => {
        const d = (t.created_at || '').slice(0, 10);
        if (dayMap[d]) {
          dayMap[d].amount += Number(t.amount || 0);
          dayMap[d].count += 1;
        }
      });
      const dailyTrend = Object.values(dayMap);

      // Top Debtors
      const custMap = {};
      activeTxns.forEach(t => {
        if (!custMap[t.customer_id]) {
          custMap[t.customer_id] = { id: t.customer_id, name: t.customer_name, mobile: t.customer_mobile, outstanding: 0, txn_count: 0 };
        }
        custMap[t.customer_id].outstanding += Number(t.amount || 0);
        custMap[t.customer_id].txn_count += 1;
      });
      const topDebtors = Object.values(custMap).sort((a, b) => b.outstanding - a.outstanding).slice(0, 5);

      return {
        summary: {
          totalOutstanding,
          totalActiveTransactions: activeTxns.length,
          todayUdhaar,
          todayCount: todayTxns.length,
          thisMonthUdhaar,
          thisMonthCount: monthTxns.length,
          totalCustomers: customerCount || 0,
          averageTicketSize: activeTxns.length > 0 ? Math.round(totalOutstanding / activeTxns.length) : 0
        },
        dailyTrend,
        topDebtors
      };
    }

    // SQLite
    const totalOut = sqliteDb.prepare("SELECT COALESCE(SUM(amount), 0) as total, COUNT(id) as count FROM transactions WHERE business_id = ? AND status = 'ACTIVE'").get(businessId);
    const today = sqliteDb.prepare("SELECT COALESCE(SUM(amount), 0) as total, COUNT(id) as count FROM transactions WHERE business_id = ? AND status = 'ACTIVE' AND date(created_at) = date('now')").get(businessId);
    const thisMonth = sqliteDb.prepare("SELECT COALESCE(SUM(amount), 0) as total, COUNT(id) as count FROM transactions WHERE business_id = ? AND status = 'ACTIVE' AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')").get(businessId);
    const custCount = sqliteDb.prepare('SELECT COUNT(id) as total FROM customers WHERE business_id = ?').get(businessId);
    const dailyTrend = sqliteDb.prepare("SELECT date(created_at) as day, COALESCE(SUM(amount), 0) as amount, COUNT(id) as count FROM transactions WHERE business_id = ? AND status = 'ACTIVE' AND created_at >= date('now', '-7 days') GROUP BY date(created_at) ORDER BY day ASC").all(businessId);
    const topDebtors = sqliteDb.prepare("SELECT c.id, c.name, c.mobile, COALESCE(SUM(t.amount), 0) as outstanding, COUNT(t.id) as txn_count FROM customers c JOIN transactions t ON c.id = t.customer_id WHERE c.business_id = ? AND t.status = 'ACTIVE' GROUP BY c.id ORDER BY outstanding DESC LIMIT 5").all(businessId);

    return {
      summary: {
        totalOutstanding: totalOut.total,
        totalActiveTransactions: totalOut.count,
        todayUdhaar: today.total,
        todayCount: today.count,
        thisMonthUdhaar: thisMonth.total,
        thisMonthCount: thisMonth.count,
        totalCustomers: custCount.total,
        averageTicketSize: totalOut.count > 0 ? Math.round(totalOut.total / totalOut.count) : 0
      },
      dailyTrend,
      topDebtors
    };
  }
};

module.exports = dbRepo;
