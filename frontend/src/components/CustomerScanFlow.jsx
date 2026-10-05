import React, { useState, useEffect } from 'react';
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
        <div style={{ width: 36, height: 36, border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading store details...</p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (errorBiz) {
    return (
      <div style={{ maxWidth: 440, margin: '40px auto', padding: '32px 24px', textAlign: 'center' }} className="card-surface animate-fade-in">
        <h2 style={{ fontSize: '1.3rem', color: 'var(--ruby-text)', marginBottom: 8 }}>Store Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>{errorBiz}</p>
        <button id="btn-retry-biz" className="btn-primary" onClick={fetchBusiness} style={{ width: '100%' }}>
          Try Again
        </button>
      </div>
    );
  }

  const numericAmount = parseFloat(amount) || 0;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px 60px' }} className="animate-fade-in">
      {/* Top Shop Banner */}
      <div className="card-surface" style={{ padding: '22px 20px', marginBottom: 16, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--emerald-bg)', border: '1px solid var(--emerald-border)', padding: '3px 10px', borderRadius: 'var(--radius-full)', marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--emerald)' }}></span>
          <span style={{ fontSize: '0.74rem', color: 'var(--emerald-text)', fontWeight: 700, letterSpacing: '0.03em' }}>
            VERIFIED MERCHANT
          </span>
        </div>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 2 }}>
          {business?.name}
        </h1>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          {business?.category || 'Retail Store'}{business?.address ? ` • ${business.address}` : ''}
        </p>
      </div>

      {/* Main Entry Form */}
      <form onSubmit={handleSubmit} className="card-surface" style={{ padding: '24px 20px' }}>
        {/* Amount Input */}
        <div style={{ marginBottom: 22, textAlign: 'center' }}>
          <label style={{ display: 'block', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8 }}>
            Udhaar Amount
          </label>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--text-main)', marginRight: 4 }}>₹</span>
            <input
              id="input-udhaar-amount"
              type="number"
              inputMode="decimal"
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 12 }}>
            {quickAmounts.map((q) => (
              <button
                key={q}
                type="button"
                id={`btn-chip-${q}`}
                onClick={() => setAmount(String(q))}
                style={{
                  background: amount === String(q) ? 'var(--primary)' : 'var(--bg-subtle)',
                  borderColor: amount === String(q) ? 'var(--primary)' : 'var(--border-subtle)',
                  borderWidth: 1,
                  borderStyle: 'solid',
                  color: amount === String(q) ? '#FFFFFF' : 'var(--text-secondary)',
                  padding: '6px 13px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.82rem',
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
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
              Your Full Name <span style={{ color: 'var(--ruby)' }}>*</span>
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
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
              10-Digit Mobile Number <span style={{ color: 'var(--ruby)' }}>*</span>
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
                id="input-customer-mobile"
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

          <div>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
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
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
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
                  gap: 8,
                  padding: '14px',
                  background: 'var(--bg-subtle)',
                  border: '1.5px dashed var(--border-strong)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  fontSize: '0.86rem',
                  fontWeight: 600
                }}
              >
                Attach Bill or Receipt Photo
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <img
                  src={receiptPreview}
                  alt="Receipt Preview"
                  style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.84rem', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: 'var(--text-main)' }}>
                    {receiptFile?.name || 'Attached Bill'}
                  </p>
                  <p style={{ fontSize: '0.74rem', color: 'var(--emerald-text)', fontWeight: 600 }}>Ready for upload</p>
                </div>
                <button
                  type="button"
                  id="btn-remove-receipt"
                  onClick={removeReceipt}
                  style={{ background: 'var(--ruby-bg)', border: '1px solid var(--ruby-border)', color: 'var(--ruby-text)', padding: '5px 10px', borderRadius: 'var(--radius-xs)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

        {submitError && (
          <div style={{ background: 'var(--ruby-bg)', border: '1px solid var(--ruby-border)', color: 'var(--ruby-text)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: 16 }}>
            {submitError}
          </div>
        )}

        {/* Submit Button */}
        <button
          id="btn-submit-udhaar"
          type="submit"
          className="btn-primary"
          disabled={submitting}
          style={{ width: '100%', padding: '13px 20px', fontSize: '1rem', fontWeight: 700 }}
        >
          {submitting ? 'Recording Udhaar...' : `Record Udhaar • ₹${numericAmount.toLocaleString('en-IN')}`}
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: 14 }}>
          No login needed. The shop owner receives an instant alert on their register.
        </p>
      </form>

      {/* Switch to Shopkeeper Login link */}
      {onSwitchToOwner && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button
            id="btn-goto-owner-login"
            type="button"
            onClick={onSwitchToOwner}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.84rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Are you the store owner? Open Merchant Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
