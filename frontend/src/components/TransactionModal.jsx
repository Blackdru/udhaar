import React, { useState, useEffect } from 'react';
import { X, Edit2, Ban, ShieldCheck, Clock, Receipt, History } from 'lucide-react';

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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
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
          maxWidth: 580,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0,
          border: '1px solid rgba(99, 102, 241, 0.3)'
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
              {t?.transaction_number || 'Loading...'}
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Transaction Details</h2>
          </div>
          <button id="btn-close-txn-modal" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading transaction...</div>
          ) : error ? (
            <div style={{ color: 'var(--accent-rose)', textAlign: 'center', padding: 20 }}>{error}</div>
          ) : (
            <>
              {/* Amount and Status banner */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(15, 23, 42, 0.85)', borderRadius: 'var(--radius-md)', marginBottom: 20, border: '1px solid var(--border-subtle)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Recorded Credit</span>
                  <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: t.status === 'ACTIVE' ? '#ffffff' : 'var(--text-dim)', textDecoration: t.status === 'VOIDED' ? 'line-through' : 'none' }}>
                    ₹{Number(t.amount).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  {t.status === 'ACTIVE' ? (
                    <span className="badge-active">ACTIVE LEDGER</span>
                  ) : (
                    <span className="badge-voided">VOIDED</span>
                  )}
                </div>
              </div>

              {/* Transaction information / Editable form */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: 20 }}>
                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>Customer Name</label>
                      <input
                        id="input-edit-cust-name"
                        type="text"
                        className="input-field"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>Purchase / Item Note</label>
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
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Customer:</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t.customer_name} (+91 {t.customer_mobile})</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Notes:</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 500, color: t.notes ? 'var(--text-main)' : 'var(--text-dim)' }}>
                        {t.notes || 'None'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Created At:</span>
                      <span style={{ fontSize: '0.85rem' }}>{new Date(t.created_at).toLocaleString('en-IN')}</span>
                    </div>
                    {t.voided_at && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-rose)' }}>
                        <span style={{ fontSize: '0.85rem' }}>Void Reason:</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t.void_reason}</span>
                      </div>
                    )}

                    {t.status === 'ACTIVE' && (
                      <div style={{ display: 'flex', gap: 10, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <button
                          id="btn-edit-txn"
                          onClick={() => setIsEditing(true)}
                          className="btn-secondary"
                          style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }}
                        >
                          <Edit2 size={14} />
                          Edit Details
                        </button>
                        <button
                          id="btn-trigger-void"
                          onClick={() => setIsVoiding(true)}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            fontSize: '0.82rem',
                            background: 'rgba(244, 63, 94, 0.12)',
                            color: '#f43f5e',
                            border: '1px solid rgba(244, 63, 94, 0.3)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                          }}
                        >
                          <Ban size={14} />
                          Void Transaction
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Void Confirmation Form */}
              {isVoiding && (
                <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 20 }}>
                  <h4 style={{ fontSize: '0.9rem', color: '#fca5a5', marginBottom: 6, fontWeight: 700 }}>Void this Udhaar Record?</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                    This transaction will be marked as VOIDED. It will be removed from outstanding totals while preserving the audit record.
                  </p>
                  <input
                    id="input-void-reason"
                    type="text"
                    className="input-field"
                    placeholder="Enter reason (e.g. Customer returned items / paid cash directly)"
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
                      style={{ background: 'var(--accent-rose)', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {voiding ? 'Voiding...' : 'Confirm Void'}
                    </button>
                  </div>
                </div>
              )}

              {/* Attached Bill / Receipt View */}
              {t.receipt_url && (
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Receipt size={16} color="#818cf8" /> Attached Bill Evidence
                  </h4>
                  <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.3)', textAlign: 'center' }}>
                    <img
                      src={t.receipt_url}
                      alt="Receipt bill"
                      style={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain', display: 'block', margin: '0 auto' }}
                    />
                  </div>
                </div>
              )}

              {/* Audit Trail Section */}
              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <History size={16} color="#818cf8" /> Audit Trail (Ledger Integrity)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data?.audits?.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 700, color: '#818cf8', marginRight: 6 }}>{a.action}</span>
                        <span style={{ color: 'var(--text-muted)' }}>by {a.performed_by}</span>
                      </div>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>
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
