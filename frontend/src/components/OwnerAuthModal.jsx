import React, { useState } from 'react';

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
      setError('Connection error. Please ensure the backend is running.');
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
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        backgroundColor: 'var(--bg-page)'
      }}
      className="animate-fade-in"
    >
      <div
        className="card-surface"
        style={{
          width: '100%',
          maxWidth: 420,
          padding: '32px 28px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary)',
              color: '#ffffff',
              fontSize: '1.4rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              marginBottom: 12
            }}
          >
            उ
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4 }}>
            Udhaar Merchant Portal
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Digital Credit Ledger & QR Platform
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
            padding: '11px 16px',
            marginBottom: 20,
            background: 'var(--emerald-bg)',
            border: '1px solid var(--emerald-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--emerald-text)',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background 0.15s ease'
          }}
        >
          Quick Demo: Sharma Kirana Store
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0 20px', color: 'var(--text-dim)', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          <span>Or login with mobile</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        </div>

        {error && (
          <div
            style={{
              background: 'var(--ruby-bg)',
              border: '1px solid var(--ruby-border)',
              color: 'var(--ruby-text)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: 16
            }}
          >
            {error}
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Shopkeeper Mobile Number
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 12px',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  +91
                </span>
                <input
                  id="input-owner-mobile"
                  type="tel"
                  inputMode="numeric"
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
              style={{ width: '100%' }}
            >
              {loading ? 'Sending OTP...' : 'Send Login OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {devOtpNotice && (
              <div
                style={{
                  background: 'var(--emerald-bg)',
                  border: '1px solid var(--emerald-border)',
                  color: 'var(--emerald-text)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem',
                  fontWeight: 600
                }}
              >
                {devOtpNotice} (Auto-filled)
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Enter 4-Digit OTP
              </label>
              <input
                id="input-owner-otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="input-field"
                placeholder="1234"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Shop Name (if registering new store)
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
              color: 'var(--text-muted)',
              fontSize: '0.78rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--emerald)' }}></span>
            System Diagnostics (/health)
          </a>
        </div>
      </div>
    </div>
  );
}
