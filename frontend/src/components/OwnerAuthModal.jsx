import React, { useState, useEffect, useRef } from 'react';

export default function OwnerAuthModal({ onLoginSuccess }) {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [existingShopName, setExistingShopName] = useState('');
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtpNotice, setDevOtpNotice] = useState('');
  const [countdown, setCountdown] = useState(30);

  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCountdown = () => {
    setCountdown(30);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      setError('Please enter a valid Indian mobile number starting with 6, 7, 8, or 9.');
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
        setIsExistingUser(!!data.exists);
        setExistingShopName(data.shopName || '');
        if (data.devOtp) {
          setDevOtpNotice(`OTP: ${data.devOtp}`);
          setOtp(data.devOtp);
        } else {
          setDevOtpNotice('');
          setOtp('');
        }
        startCountdown();
      } else {
        setError(data.message || 'Failed to send OTP.');
      }
    } catch (e) {
      setError('Network error. Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanMobile = mobile.replace(/\D/g, '');
    const cleanOtp = otp.trim();

    if (!cleanOtp) {
      setError('Please enter the OTP verification code.');
      return;
    }

    if (!isExistingUser) {
      if (!shopName || shopName.trim().length < 2) {
        setError('Please enter your shop or business name (min 2 characters).');
        return;
      }
    }

    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: cleanMobile,
          otp: cleanOtp,
          name: ownerName.trim() || undefined,
          shopName: !isExistingUser ? shopName.trim() : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        onLoginSuccess(data.token, data.owner, data.business);
      } else {
        setError(data.message || 'Invalid OTP code. Please check and try again.');
      }
    } catch (e) {
      setError('Network error. Unable to connect to server.');
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
                  autoFocus
                  required
                />
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
                We will send an OTP. Existing shops log in directly; new stores set up their shop name.
              </p>
            </div>

            <button
              id="btn-send-otp"
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
            >
              {loading ? 'Checking & Sending OTP...' : 'Get OTP Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Status Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: isExistingUser ? 'var(--emerald-bg)' : 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                border: isExistingUser ? '1px solid var(--emerald-border)' : '1px solid var(--border-subtle)'
              }}
            >
              <div>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: isExistingUser ? 'var(--emerald-text)' : 'var(--text-main)' }}>
                  +91 {mobile}
                </span>
                <span style={{ fontSize: '0.75rem', marginLeft: 6, color: 'var(--text-muted)' }}>
                  ({isExistingUser ? (existingShopName ? `Store: ${existingShopName}` : 'Existing Store') : 'New Store'})
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setError('');
                  setOtp('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Change
              </button>
            </div>

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

            {/* OTP Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Enter 4-Digit OTP *
              </label>
              <input
                id="input-owner-otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="input-field"
                placeholder="1234"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                autoFocus
                required
                style={{ letterSpacing: '4px', fontSize: '1.2rem', fontWeight: 700, textAlign: 'center' }}
              />
            </div>

            {/* If NEW USER, require Shop Name */}
            {!isExistingUser && (
              <>
                <div style={{ marginTop: 2 }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Shop / Store Name *
                  </label>
                  <input
                    id="input-owner-shopname"
                    type="text"
                    className="input-field"
                    placeholder="e.g. Sharma Kirana Store"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Owner Name (Optional)
                  </label>
                  <input
                    id="input-owner-name"
                    type="text"
                    className="input-field"
                    placeholder="e.g. Rajesh Sharma"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                  />
                </div>
              </>
            )}

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
                {loading
                  ? 'Verifying...'
                  : isExistingUser
                  ? 'Verify & Login'
                  : 'Verify & Create Shop'}
              </button>
            </div>

            {/* Resend OTP */}
            <div style={{ textAlign: 'center', marginTop: 6 }}>
              {countdown > 0 ? (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Resend code in {countdown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Resend Verification Code
                </button>
              )}
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
