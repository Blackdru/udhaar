import React, { useState, useEffect } from 'react';
import { Store, CheckCircle, Camera, Upload, Trash2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { compressReceiptImage } from '../utils/imageCompress';

export default function CustomerScanFlow({ qrToken, onSuccess, onSwitchToOwner }) {
  const [business, setBusiness] = useState(null);
  const [loadingBiz, setLoadingBiz] = useState(true);
  const [errorBiz, setErrorBiz] = useState('');

  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const quickAmounts = [100, 250, 500, 1000, 2000];

  useEffect(() => {
    fetchBusiness();
  }, [qrToken]);

  const fetchBusiness = async () => {
    try {
      setLoadingBiz(true);
      setErrorBiz('');
      const res = await fetch(`/api/public/business/${qrToken}`);
      const data = await res.json();
      if (data.success) {
        setBusiness(data.business);
      } else {
        setErrorBiz(data.message || 'Unable to resolve store QR.');
      }
    } catch (e) {
      setErrorBiz('Failed to connect to Udhaar server.');
    } finally {
      setLoadingBiz(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressed = await compressReceiptImage(file);
      setReceiptFile(compressed);
      setReceiptPreview(URL.createObjectURL(compressed));
    } catch (err) {
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setReceiptPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!amount || parseFloat(amount) <= 0) {
      setSubmitError('Please enter a valid Udhaar amount.');
      return;
    }

    if (!name.trim()) {
      setSubmitError('Please enter your full name.');
      return;
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setSubmitError('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('qrToken', qrToken);
      formData.append('amount', amount);
      formData.append('name', name.trim());
      formData.append('mobile', cleanMobile);
      if (notes.trim()) formData.append('notes', notes.trim());
      if (receiptFile) formData.append('receipt', receiptFile);

      const res = await fetch('/api/public/transactions', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.transaction, business);
      } else {
        setSubmitError(data.message || 'Failed to record Udhaar.');
      }
    } catch (err) {
      setSubmitError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingBiz) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)' }}>Identifying Merchant Store...</p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (errorBiz) {
    return (
      <div style={{ maxWidth: 440, margin: '40px auto', padding: 24, textAlign: 'center' }} className="glass-panel animate-fade-in">
        <AlertCircle size={48} color="#f43f5e" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '1.4rem', marginBottom: 8 }}>Store Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>{errorBiz}</p>
        <button id="btn-retry-biz" className="btn-primary" onClick={fetchBusiness} style={{ width: '100%' }}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 460, margin: '0 auto', padding: '16px 12px 60px' }} className="animate-fade-in">
      {/* Top Shop Banner */}
      <div className="glass-panel" style={{ padding: '20px 20px', marginBottom: 20, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #6366f1, #10b981)' }} />
        <div style={{ display: 'inline-flex', padding: 10, background: 'rgba(99, 102, 241, 0.12)', borderRadius: 14, marginBottom: 12 }}>
          <Store size={28} color="#818cf8" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700 }}>{business?.name}</h1>
          <CheckCircle size={18} color="#10b981" />
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {business?.category} • {business?.address}
        </p>
        <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16, 185, 129, 0.1)', padding: '4px 12px', borderRadius: 9999, border: '1px solid rgba(16,185,129,0.2)' }}>
          <ShieldCheck size={14} color="#10b981" />
          <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>Udhaar Verified Merchant QR</span>
        </div>
      </div>

      {/* Main Entry Card */}
      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '24px 20px' }}>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <label style={{ display: 'block', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8 }}>
            Enter Udhaar Amount
          </label>
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--primary)', marginRight: 4 }}>₹</span>
            <input
              id="input-udhaar-amount"
              type="number"
              min="1"
              max="100000"
              step="any"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                fontSize: '2.8rem',
                fontWeight: 800,
                width: 180,
                textAlign: 'left',
                outline: 'none',
                fontFamily: 'var(--font-heading)'
              }}
            />
          </div>

          {/* Quick Amount Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 14 }}>
            {quickAmounts.map((q) => (
              <button
                key={q}
                type="button"
                id={`btn-chip-${q}`}
                onClick={() => setAmount(String(q))}
                style={{
                  background: amount === String(q) ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  borderColor: amount === String(q) ? 'var(--primary)' : 'var(--border-subtle)',
                  borderWidth: 1,
                  borderStyle: 'solid',
                  color: amount === String(q) ? '#818cf8' : 'var(--text-main)',
                  padding: '6px 14px',
                  borderRadius: 9999,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                +₹{q}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Details Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-main)' }}>
              Your Full Name <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <input
              id="input-customer-name"
              type="text"
              className="input-field"
              placeholder="e.g. Ramesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-main)' }}>
              10-Digit Mobile Number <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, border: '1px solid var(--border-subtle)' }}>
                +91
              </span>
              <input
                id="input-customer-mobile"
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

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-main)' }}>
              Items / Purchase Note (Optional)
            </label>
            <input
              id="input-customer-notes"
              type="text"
              className="input-field"
              placeholder="e.g. 5kg Basmati Rice, Oil, Tea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Photo / Receipt Attachment */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-main)' }}>
              Bill / Receipt Photo (Optional)
            </label>

            {!receiptPreview ? (
              <label
                id="label-receipt-upload"
                htmlFor="input-receipt-file"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1.5px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  color: 'var(--text-muted)'
                }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
              >
                <Camera size={20} color="#818cf8" />
                <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>Take Photo or Upload Bill</span>
                <input
                  id="input-receipt-file"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
            ) : (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <img
                  src={receiptPreview}
                  alt="Receipt Preview"
                  style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {receiptFile?.name || 'Attached Bill'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>✓ Optimized for instant upload</p>
                </div>
                <button
                  type="button"
                  id="btn-remove-receipt"
                  onClick={removeReceipt}
                  style={{ background: 'rgba(244,63,94,0.15)', border: 'none', color: '#f43f5e', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {submitError && (
          <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: 16 }}>
            {submitError}
          </div>
        )}

        {/* Submit Button */}
        <button
          id="btn-submit-udhaar"
          type="submit"
          className="btn-primary"
          disabled={submitting}
          style={{ width: '100%', padding: '14px 20px', fontSize: '1.05rem', fontWeight: 700 }}
        >
          {submitting ? (
            'Recording Udhaar...'
          ) : (
            <>
              Submit Udhaar (₹{amount ? Number(amount).toLocaleString('en-IN') : '0'})
              <ArrowRight size={18} />
            </>
          )}
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 14 }}>
          No account or sign up required. The merchant will receive immediate notification.
        </p>
      </form>

      {/* Switch to Shopkeeper Login link */}
      {onSwitchToOwner && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button
            id="btn-goto-owner-login"
            type="button"
            onClick={onSwitchToOwner}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Are you the shop owner? Open Merchant Portal →
          </button>
        </div>
      )}
    </div>
  );
}
