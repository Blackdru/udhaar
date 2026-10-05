import React, { useState } from 'react';
import { Store, KeyRound, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export default function OwnerAuthModal({ onLoginSuccess }) {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtpNotice, setDevOtpNotice] = useState('');

  // 1-Click Demo Login as Sharma Kirana Store
  const handleQuickDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: '9876543210',
          otp: '1234'
        })
      });
      const data = await res.json();
      if (data.success) {
        onLoginSuccess(data.token, data.owner, data.business);
      } else {
        setError(data.message || 'Demo login failed.');
      }
    } catch (e) {
      setError('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setError('Please enter a 10-digit mobile number.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: cleanMobile })
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setDevOtpNotice(`OTP: ${data.devOtp || '1234'}`);
        setOtp(data.devOtp || '1234');
      } else {
        setError(data.message || 'Failed to send OTP.');
      }
    } catch (e) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanMobile = mobile.replace(/\D/g, '');

    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: cleanMobile,
          otp,
          name: ownerName,
          shopName: shopName
        })
      });
      const data = await res.json();
      if (data.success) {
        onLoginSuccess(data.token, data.owner, data.business);
      } else {
        setError(data.message || 'Invalid OTP code.');
      }
    } catch (e) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      className="animate-fade-in"
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 440,
          padding: '32px 24px',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'var(--primary-gradient)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
              boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)'
            }}
          >
            <Store size={28} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Udhaar Merchant Portal</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Digital Credit Ledger & QR Dashboard for Local Businesses
          </p>
        </div>

        {/* 1-Click Quick Demo Button */}
        <button
          id="btn-quick-demo-login"
          type="button"
          onClick={handleQuickDemoLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: 20,
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: 'var(--radius-md)',
            color: '#a5b4fc',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(99, 102, 241, 0.22)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)')}
        >
          <Sparkles size={16} color="#818cf8" />
          Quick Test Demo (Sharma Kirana Store)
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          <span>Or sign in with mobile</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        </div>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                Shopkeeper Mobile Number
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, border: '1px solid var(--border-subtle)' }}>
                  +91
                </span>
                <input
                  id="input-owner-mobile"
                  type="tel"
                  maxLength={10}
                  className="input-field"
                  placeholder="98765 43210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
            </div>

            <button
              id="btn-send-otp"
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '12px' }}
            >
              {loading ? 'Sending OTP...' : 'Send Login OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {devOtpNotice && (
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#6ee7b7', padding: '8px 12px', borderRadius: 'var(--radius-md)', fontSize: '0.82rem' }}>
                ✓ {devOtpNotice} (Auto-filled for demo)
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                Enter Verification OTP
              </label>
              <input
                id="input-owner-otp"
                type="text"
                maxLength={6}
                className="input-field"
                placeholder="1234"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                Shop / Business Name (if new)
              </label>
              <input
                id="input-owner-shopname"
                type="text"
                className="input-field"
                placeholder="e.g. Verma Kirana Store"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setOtpSent(false)}
                style={{ flex: 1 }}
              >
                Back
              </button>
              <button
                id="btn-verify-otp"
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ flex: 2 }}
              >
                {loading ? 'Verifying...' : 'Verify & Enter'}
              </button>
            </div>
          </form>
        )}

        <div style={{ marginTop: 24, textAlign: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
          <a
            href="/health"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState({}, '', '/health');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            style={{
              color: 'var(--text-dim)',
              fontSize: '0.78rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#10b981'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            System Status & Health Diagnostics (/health)
          </a>
        </div>
      </div>
    </div>
  );
}
