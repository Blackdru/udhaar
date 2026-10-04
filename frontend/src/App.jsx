import React, { useState, useEffect, useRef } from 'react';
import {
  Store,
  QrCode,
  Users,
  CreditCard,
  TrendingUp,
  BarChart3,
  Search,
  Filter,
  Volume2,
  VolumeX,
  LogOut,
  Sparkles,
  ExternalLink,
  Ban,
  Receipt,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Bell,
  RefreshCw,
  Activity
} from 'lucide-react';

import CustomerScanFlow from './components/CustomerScanFlow';
import CustomerSuccess from './components/CustomerSuccess';
import QrStandeeModal from './components/QrStandeeModal';
import CustomerLedgerModal from './components/CustomerLedgerModal';
import TransactionModal from './components/TransactionModal';
import AnalyticsView from './components/AnalyticsView';
import OwnerAuthModal from './components/OwnerAuthModal';
import HealthCheckView from './components/HealthCheckView';
import { playStoreChime } from './utils/audio';
import { getWsUrl, getReceiptUrl } from './utils/api';

export default function App() {
  // Navigation & URL detection
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [customerSuccessTxn, setCustomerSuccessTxn] = useState(null);
  const [customerSuccessBiz, setCustomerSuccessBiz] = useState(null);

  // Owner state
  const [token, setToken] = useState(localStorage.getItem('udhaar_token') || '');
  const [owner, setOwner] = useState(() => {
    try { return JSON.parse(localStorage.getItem('udhaar_owner')); } catch { return null; }
  });
  const [business, setBusiness] = useState(() => {
    try { return JSON.parse(localStorage.getItem('udhaar_business')); } catch { return null; }
  });

  // Active dashboard tab
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'customers' | 'standee' | 'analytics'
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Transactions list state
  const [transactions, setTransactions] = useState([]);
  const [loadingTxns, setLoadingTxns] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [totalOutstanding, setTotalOutstanding] = useState(0);

  // Customers state
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  // Modals
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedTxnId, setSelectedTxnId] = useState(null);
  const [showStandeeModal, setShowStandeeModal] = useState(false);
  const [qrPayload, setQrPayload] = useState(null);

  // Live real-time notification toast
  const [realtimeToast, setRealtimeToast] = useState(null);
  const wsRef = useRef(null);

  // Handle URL changes & back/forward
  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync token & business profile
  useEffect(() => {
    if (token) {
      fetchBusinessProfile();
    }
  }, [token]);

  // Load transactions or customers when tabs change
  useEffect(() => {
    if (token && business) {
      if (activeTab === 'transactions') {
        fetchTransactions();
      } else if (activeTab === 'customers') {
        fetchCustomers();
      } else if (activeTab === 'standee') {
        fetchQrData();
      }
    }
  }, [token, business, activeTab, searchTerm, statusFilter, customerSearch]);

  // Real-time WebSocket connection
  useEffect(() => {
    if (!business?.id) return;

    const wsUrl = getWsUrl();

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'SUBSCRIBE', businessId: business.id }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'NEW_TRANSACTION') {
            // Play Audio alert
            if (soundEnabled) {
              playStoreChime();
            }

            // Display Toast
            setRealtimeToast({
              title: '🔔 New Udhaar Recorded!',
              message: `₹${Number(msg.transaction.amount).toLocaleString('en-IN')} by ${msg.transaction.customer_name}`,
              time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            });

            // Auto-refresh transaction list & customer list
            fetchTransactions();
            if (activeTab === 'customers') fetchCustomers();
          } else if (msg.type === 'TRANSACTION_VOIDED') {
            fetchTransactions();
          }
        } catch (err) {
          // ignore
        }
      };

      return () => {
        if (ws.readyState === 1) ws.close();
      };
    } catch (e) {
      console.warn('WebSocket init warning:', e);
    }
  }, [business?.id, soundEnabled, activeTab]);

  const fetchBusinessProfile = async () => {
    try {
      const res = await fetch('/api/business/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBusiness(data.business);
        localStorage.setItem('udhaar_business', JSON.stringify(data.business));
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchTransactions = async () => {
    if (!token) return;
    try {
      setLoadingTxns(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await fetch(`/api/owner/transactions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions || []);
        setTotalOutstanding(data.totalActiveOutstanding || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTxns(false);
    }
  };

  const fetchCustomers = async () => {
    if (!token) return;
    try {
      setLoadingCustomers(true);
      const params = new URLSearchParams();
      if (customerSearch) params.append('search', customerSearch);

      const res = await fetch(`/api/owner/customers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchQrData = async () => {
    if (!token) return;
    try {
      const frontendOrigin = window.location.origin?.includes('localhost')
        ? window.location.origin
        : 'https://udhaar.store';
      const res = await fetch(`/api/business/me/qr?frontendUrl=${encodeURIComponent(frontendOrigin)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        if (data.url && data.url.includes('server.udhaar.store')) {
          data.url = data.url.replace(/https?:\/\/server\.udhaar\.store(:\d+)?/, 'https://udhaar.store');
        }
        setQrPayload(data);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleLoginSuccess = (newToken, newOwner, newBusiness) => {
    setToken(newToken);
    setOwner(newOwner);
    setBusiness(newBusiness);
    localStorage.setItem('udhaar_token', newToken);
    localStorage.setItem('udhaar_owner', JSON.stringify(newOwner));
    if (newBusiness) localStorage.setItem('udhaar_business', JSON.stringify(newBusiness));
  };

  const handleLogout = () => {
    setToken('');
    setOwner(null);
    setBusiness(null);
    localStorage.removeItem('udhaar_token');
    localStorage.removeItem('udhaar_owner');
    localStorage.removeItem('udhaar_business');
  };

  // Health Check diagnostics route e.g. /health
  if (currentPath === '/health' || currentPath === '/health/') {
    return (
      <HealthCheckView
        onBack={() => {
          window.history.pushState({}, '', '/');
          setCurrentPath('/');
        }}
      />
    );
  }

  // Direct QR token scan route e.g. /b/7XK92P
  const qrMatch = currentPath.match(/^\/b\/([a-zA-Z0-9_-]+)/);
  const scannedQrToken = qrMatch ? qrMatch[1] : null;

  // 1. Customer Scan Flow Screen
  if (scannedQrToken) {
    if (customerSuccessTxn) {
      return (
        <CustomerSuccess
          transaction={customerSuccessTxn}
          business={customerSuccessBiz}
          onRecordAnother={() => setCustomerSuccessTxn(null)}
          onBackToStore={() => setCustomerSuccessTxn(null)}
        />
      );
    }

    return (
      <CustomerScanFlow
        qrToken={scannedQrToken}
        onSuccess={(txn, biz) => {
          setCustomerSuccessTxn(txn);
          setCustomerSuccessBiz(biz);
        }}
        onSwitchToOwner={() => {
          window.history.pushState({}, '', '/');
          setCurrentPath('/');
        }}
      />
    );
  }

  // 2. Owner Auth if not logged in
  if (!token) {
    return <OwnerAuthModal onLoginSuccess={handleLoginSuccess} />;
  }

  // 3. Shopkeeper Dashboard
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Navbar */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(9, 13, 22, 0.85)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          {/* Brand & Store info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'var(--primary-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
              }}
            >
              <Store size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h1 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{business?.name || 'My Store'}</h1>
                <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                  LIVE
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {business?.category || 'Kirana'} • QR: <span style={{ fontFamily: 'monospace', color: '#818cf8', fontWeight: 700 }}>{business?.qr_token}</span>
              </p>
            </div>
          </div>

          {/* Header Action Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Quick Standee Generator Button */}
            <button
              id="btn-nav-standee"
              className="btn-primary"
              onClick={() => {
                fetchQrData();
                setShowStandeeModal(true);
              }}
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              <QrCode size={16} />
              <span className="hide-mobile">Counter QR Standee</span>
            </button>

            {/* Test Customer View in New Tab */}
            <button
              id="btn-test-customer-flow"
              className="btn-secondary"
              onClick={() => {
                window.open(`/b/${business?.qr_token}`, '_blank');
              }}
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              title="Open customer QR submission page"
            >
              <ExternalLink size={15} />
              <span className="hide-mobile">Test Scan</span>
            </button>

            {/* Audio chime toggle */}
            <button
              id="btn-toggle-sound"
              className="btn-secondary"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playStoreChime();
              }}
              style={{ padding: '8px 12px' }}
              title={soundEnabled ? 'Sound alert enabled (Click to mute)' : 'Sound muted (Click to enable)'}
            >
              {soundEnabled ? <Volume2 size={16} color="#10b981" /> : <VolumeX size={16} color="var(--text-dim)" />}
            </button>

            {/* Health Check */}
            <button
              id="btn-nav-health"
              className="btn-secondary"
              onClick={() => {
                window.history.pushState({}, '', '/health');
                setCurrentPath('/health');
              }}
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              title="System Diagnostics & Health Check (/health)"
            >
              <Activity size={15} color="#10b981" />
              <span className="hide-mobile">Health</span>
            </button>

            {/* Logout */}
            <button
              id="btn-logout"
              className="btn-secondary"
              onClick={handleLogout}
              style={{ padding: '8px 12px' }}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', gap: 8, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <button
            id="tab-btn-transactions"
            onClick={() => setActiveTab('transactions')}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'transactions' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'transactions' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <CreditCard size={16} />
            Dashboard & Ledger
          </button>

          <button
            id="tab-btn-customers"
            onClick={() => setActiveTab('customers')}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'customers' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'customers' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Users size={16} />
            Customer Accounts
          </button>

          <button
            id="tab-btn-analytics"
            onClick={() => setActiveTab('analytics')}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'analytics' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'analytics' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <BarChart3 size={16} />
            Analytics & Reports
          </button>
        </div>
      </header>

      {/* Real-time Toast Alert */}
      {realtimeToast && (
        <div
          className="glass-panel animate-slide-down"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            padding: '16px 20px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            maxWidth: 380
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={20} color="#10b981" />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>{realtimeToast.title}</h4>
            <p style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>{realtimeToast.message}</p>
          </div>
          <button
            onClick={() => setRealtimeToast(null)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Container Content */}
      <main style={{ maxWidth: 1200, width: '100%', margin: '0 auto', padding: '24px 20px 60px', flex: 1 }}>
        {/* TAB 1: TRANSACTIONS DASHBOARD */}
        {activeTab === 'transactions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">
            {/* KPI Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div className="glass-panel" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--primary-gradient)' }} />
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
                  Total Outstanding Udhaar
                </span>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', marginTop: 4, fontFamily: 'var(--font-heading)' }}>
                  ₹{Number(totalOutstanding).toLocaleString('en-IN')}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Current uncollected customer credit
                </span>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
                  Total Recorded Records
                </span>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#818cf8', marginTop: 4, fontFamily: 'var(--font-heading)' }}>
                  {transactions.length}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Transactions in active ledger
                </span>
              </div>

              {/* Standee Callout Card */}
              <div
                className="glass-panel glass-panel-interactive"
                onClick={() => {
                  fetchQrData();
                  setShowStandeeModal(true);
                }}
                style={{ padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700, marginBottom: 4 }}>
                    <Sparkles size={12} /> SHOP STANDEE
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Display Your QR</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Print counter acrylic card</p>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode size={24} color="#818cf8" />
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                <Search size={18} color="var(--text-dim)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  id="input-search-txns"
                  type="text"
                  placeholder="Search customer name, mobile, or transaction ID..."
                  className="input-field"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: 42 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
                {['ALL', 'ACTIVE', 'VOIDED'].map((st) => (
                  <button
                    key={st}
                    id={`btn-filter-${st.toLowerCase()}`}
                    onClick={() => setStatusFilter(st)}
                    style={{
                      background: statusFilter === st ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                      borderColor: statusFilter === st ? 'var(--primary)' : 'var(--border-subtle)',
                      borderWidth: 1,
                      borderStyle: 'solid',
                      color: statusFilter === st ? '#818cf8' : 'var(--text-muted)',
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {st}
                  </button>
                ))}

                <button
                  id="btn-refresh-txns"
                  className="btn-secondary"
                  onClick={fetchTransactions}
                  style={{ padding: '8px 12px' }}
                  title="Refresh ledger"
                >
                  <RefreshCw size={15} />
                </button>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              {loadingTxns ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading transactions...</div>
              ) : transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60 }}>
                  <CreditCard size={48} color="var(--text-dim)" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No transactions found</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
                    Scan your shop QR or simulate customer submission to record credit.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                        <th style={{ padding: '14px 20px' }}>Date & Time</th>
                        <th style={{ padding: '14px 20px' }}>Customer</th>
                        <th style={{ padding: '14px 20px' }}>Transaction ID</th>
                        <th style={{ padding: '14px 20px' }}>Amount</th>
                        <th style={{ padding: '14px 20px' }}>Evidence</th>
                        <th style={{ padding: '14px 20px' }}>Status</th>
                        <th style={{ padding: '14px 20px', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t) => (
                        <tr
                          key={t.id}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            transition: 'background 0.15s ease',
                            opacity: t.status === 'VOIDED' ? 0.65 : 1
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                          onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '14px 20px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {new Date(t.created_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                              {new Date(t.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>

                          <td style={{ padding: '14px 20px' }}>
                            <div
                              onClick={() => setSelectedCustomerId(t.customer_id)}
                              style={{ fontWeight: 700, color: '#818cf8', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              {t.customer_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                              +91 {t.customer_mobile}
                            </div>
                            {t.notes && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 2 }}>
                                {t.notes}
                              </div>
                            )}
                          </td>

                          <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {t.transaction_number}
                          </td>

                          <td style={{ padding: '14px 20px' }}>
                            <div
                              style={{
                                fontSize: '1.1rem',
                                fontWeight: 800,
                                fontFamily: 'var(--font-heading)',
                                color: t.status === 'ACTIVE' ? '#ffffff' : 'var(--text-dim)',
                                textDecoration: t.status === 'VOIDED' ? 'line-through' : 'none'
                              }}
                            >
                              ₹{Number(t.amount).toLocaleString('en-IN')}
                            </div>
                          </td>

                          <td style={{ padding: '14px 20px' }}>
                            {t.receipt_url ? (
                              <a
                                href={getReceiptUrl(t.receipt_url)}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#818cf8', fontSize: '0.78rem', background: 'rgba(99,102,241,0.1)', padding: '4px 8px', borderRadius: 4, textDecoration: 'none' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Receipt size={13} /> View Bill
                              </a>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>None</span>
                            )}
                          </td>

                          <td style={{ padding: '14px 20px' }}>
                            {t.status === 'ACTIVE' ? (
                              <span className="badge-active">ACTIVE</span>
                            ) : (
                              <span className="badge-voided" title={t.void_reason || 'Voided'}>VOIDED</span>
                            )}
                          </td>

                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <button
                              id={`btn-open-txn-${t.id}`}
                              onClick={() => setSelectedTxnId(t.id)}
                              className="btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOMER LEDGER */}
        {activeTab === 'customers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade-in">
            {/* Customer Search */}
            <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} color="var(--text-dim)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  id="input-search-customers"
                  type="text"
                  placeholder="Search customer by name or phone number..."
                  className="input-field"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  style={{ paddingLeft: 42 }}
                />
              </div>
            </div>

            {/* Customers Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {loadingCustomers ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading customer accounts...</div>
              ) : customers.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>No customers found.</div>
              ) : (
                customers.map((c) => (
                  <div
                    key={c.id}
                    className="glass-panel glass-panel-interactive"
                    onClick={() => setSelectedCustomerId(c.id)}
                    style={{ padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{c.name}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>+91 {c.mobile}</p>
                      </div>
                      <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-muted)' }}>
                        {c.transaction_count} txns
                      </span>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Outstanding:</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: Number(c.total_outstanding) > 0 ? '#f8fafc' : '#10b981', fontFamily: 'var(--font-heading)' }}>
                        ₹{Number(c.total_outstanding).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ANALYTICS & REPORTS */}
        {activeTab === 'analytics' && (
          <AnalyticsView
            token={token}
            onSelectCustomer={(custId) => setSelectedCustomerId(custId)}
          />
        )}
      </main>

      {/* Customer Ledger Modal */}
      {selectedCustomerId && (
        <CustomerLedgerModal
          customerId={selectedCustomerId}
          token={token}
          onClose={() => setSelectedCustomerId(null)}
          onTransactionUpdated={() => {
            fetchTransactions();
            fetchCustomers();
          }}
        />
      )}

      {/* Single Transaction Detail & Void Modal */}
      {selectedTxnId && (
        <TransactionModal
          transactionId={selectedTxnId}
          token={token}
          onClose={() => setSelectedTxnId(null)}
          onUpdated={() => {
            fetchTransactions();
            if (activeTab === 'customers') fetchCustomers();
          }}
        />
      )}

      {/* QR Standee & Poster Modal */}
      {showStandeeModal && (
        <QrStandeeModal
          business={business}
          qrData={qrPayload}
          onClose={() => setShowStandeeModal(false)}
          onOpenSimulator={(tokenVal) => {
            window.open(`/b/${tokenVal}`, '_blank');
          }}
        />
      )}
    </div>
  );
}
