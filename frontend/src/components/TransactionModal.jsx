import React, { useState, useEffect } from 'react';
import { getReceiptUrl } from '../utils/api';

export default function TransactionModal({ transactionId, token, onClose, onUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [isVoiding, setIsVoiding] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);

  useEffect(() => {
    if (transactionId) fetchDetails();
  }, [transactionId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/owner/transactions/${transactionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setData(json);
        setCustomerName(json.transaction.customer_name);
        setNotes(json.transaction.notes || '');
      } else {
        setError(json.message || 'Unable to load transaction details.');
      }
    } catch (e) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/owner/transactions/${transactionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ customer_name: customerName, notes })
      });
      const json = await res.json();
      if (json.success) {
        setIsEditing(false);
        fetchDetails();
        if (onUpdated) onUpdated();
      } else {
        alert(json.message || 'Failed to update transaction');
      }
    } catch (e) {
      alert('Network error.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmVoid = async () => {
    try {
      setVoiding(true);
      const res = await fetch(`/api/owner/transactions/${transactionId}/void`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: voidReason || 'Voided by store owner' })
      });
      const json = await res.json();
      if (json.success) {
        setIsVoiding(false);
        fetchDetails();
        if (onUpdated) onUpdated();
      } else {
        alert(json.message || 'Failed to void transaction');
      }
    } catch (e) {
      alert('Network error.');
    } finally {
      setVoiding(false);
    }
  };

  const t = data?.transaction;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)' }}>
          <div>
            <span style={{ fontSize: '0.74rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
              {t?.transaction_number || 'Loading...'}
            </span>
            <h2 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>
              Transaction Details
            </h2>
          </div>
          <button
            id="btn-close-txn-modal"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1, padding: 6 }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: 'var(--bg-page)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading transaction...</div>
          ) : error ? (
            <div style={{ color: 'var(--ruby-text)', textAlign: 'center', padding: 20 }}>{error}</div>
          ) : (
            <>
              {/* Amount and Status banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 18px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 16,
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Credit Amount
                  </span>
                  <div
                    style={{
                      fontSize: '2rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-heading)',
                      color: t.status === 'ACTIVE' ? 'var(--text-main)' : 'var(--text-dim)',
                      textDecoration: t.status === 'VOIDED' ? 'line-through' : 'none'
                    }}
                  >
                    ₹{Number(t.amount).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  {t.status === 'ACTIVE' ? (
                    <span className="badge-active">ACTIVE</span>
                  ) : (
                    <span className="badge-voided">VOIDED</span>
                  )}
                </div>
              </div>

              {/* Transaction information / Editable form */}
              <div style={{ background: 'var(--bg-surface)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: 16, boxShadow: 'var(--shadow-xs)' }}>
                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Customer Name</label>
                      <input
                        id="input-edit-cust-name"
                        type="text"
                        className="input-field"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Purchase Note</label>
                      <input
                        id="input-edit-notes"
                        type="text"
                        className="input-field"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                      <button id="btn-cancel-edit" className="btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                      <button id="btn-save-edit" className="btn-primary" disabled={saving} onClick={handleSaveEdit}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Customer:</span>
                      <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>{t.customer_name} (+91 {t.customer_mobile})</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Notes:</span>
                      <span style={{ fontSize: '0.84rem', fontWeight: 500, color: t.notes ? 'var(--text-main)' : 'var(--text-dim)' }}>
                        {t.notes || 'None'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Created At:</span>
                      <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>{new Date(t.created_at).toLocaleString('en-IN')}</span>
                    </div>
                    {t.voided_at && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ruby-text)' }}>
                        <span style={{ fontSize: '0.84rem' }}>Void Reason:</span>
                        <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>{t.void_reason}</span>
                      </div>
                    )}

                    {t.status === 'ACTIVE' && (
                      <div style={{ display: 'flex', gap: 10, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                        <button
                          id="btn-edit-txn"
                          onClick={() => setIsEditing(true)}
                          className="btn-secondary"
                          style={{ flex: 1, padding: '7px 12px', fontSize: '0.82rem' }}
                        >
                          Edit Details
                        </button>
                        <button
                          id="btn-trigger-void"
                          onClick={() => setIsVoiding(true)}
                          className="btn-danger"
                          style={{ flex: 1, padding: '7px 12px', fontSize: '0.82rem' }}
                        >
                          Void Transaction
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Void Confirmation Form */}
              {isVoiding && (
                <div style={{ background: 'var(--ruby-bg)', border: '1px solid var(--ruby-border)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 16 }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--ruby-text)', marginBottom: 6, fontWeight: 700 }}>Void this Udhaar Record?</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
                    This transaction will be marked as VOIDED and removed from outstanding totals while preserving the audit record.
                  </p>
                  <input
                    id="input-void-reason"
                    type="text"
                    className="input-field"
                    placeholder="Enter reason (e.g. Paid cash directly / return)"
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    style={{ marginBottom: 10 }}
                  />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button id="btn-cancel-void" className="btn-secondary" onClick={() => setIsVoiding(false)}>Cancel</button>
                    <button
                      id="btn-confirm-void"
                      onClick={handleConfirmVoid}
                      disabled={voiding}
                      className="btn-danger"
                      style={{ background: 'var(--ruby)', color: '#ffffff' }}
                    >
                      {voiding ? 'Voiding...' : 'Confirm Void'}
                    </button>
                  </div>
                </div>
              )}

              {/* Attached Bill / Receipt View */}
              {t.receipt_url && (
                <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                      Attached Bill
                    </h4>
                    <a
                      href={getReceiptUrl(t.receipt_url)}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '0.78rem', color: 'var(--text-main)', textDecoration: 'underline', fontWeight: 600 }}
                    >
                      Open Full Size
                    </a>
                  </div>
                  <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', textAlign: 'center' }}>
                    <a href={getReceiptUrl(t.receipt_url)} target="_blank" rel="noreferrer">
                      <img
                        src={getReceiptUrl(t.receipt_url)}
                        alt="Receipt bill"
                        style={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain', display: 'block', margin: '0 auto' }}
                      />
                    </a>
                  </div>
                </div>
              )}

              {/* Audit Trail Section */}
              <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, fontWeight: 700 }}>
                  Audit Trail
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data?.audits?.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        padding: '8px 12px',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)', marginRight: 6 }}>{a.action}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>by {a.performed_by}</span>
                      </div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                        {new Date(a.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
