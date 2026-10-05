import React, { useState, useEffect } from 'react';
import { getReceiptUrl } from '../utils/api';

export default function CustomerLedgerModal({ customerId, token, onClose, onTransactionUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customerId) fetchLedger();
  }, [customerId]);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/owner/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.message || 'Unable to fetch customer ledger.');
      }
    } catch (e) {
      setError('Network error while fetching ledger.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoidTxn = async (txnId) => {
    const reason = window.prompt('Please provide a reason to void this transaction:');
    if (reason === null) return;

    try {
      const res = await fetch(`/api/owner/transactions/${txnId}/void`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: reason || 'Voided by owner from customer ledger' })
      });
      const json = await res.json();
      if (json.success) {
        fetchLedger();
        if (onTransactionUpdated) onTransactionUpdated();
      } else {
        alert(json.message || 'Failed to void transaction');
      }
    } catch (err) {
      alert('Error communicating with server.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        {/* Modal Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {data?.customer?.name || 'Customer Statement'}
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              +91 {data?.customer?.mobile}
            </p>
          </div>
          <button
            id="btn-close-ledger"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1, padding: 6 }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: 'var(--bg-page)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading statement...</div>
          ) : error ? (
            <div style={{ color: 'var(--ruby-text)', textAlign: 'center', padding: 20 }}>{error}</div>
          ) : (
            <>
              {/* Customer Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
                <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-xs)' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Outstanding
                  </span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginTop: 2, fontFamily: 'var(--font-heading)' }}>
                    ₹{Number(data?.stats?.total_outstanding || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-xs)' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Active Entries
                  </span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--emerald-text)', marginTop: 2, fontFamily: 'var(--font-heading)' }}>
                    {data?.stats?.active_count || 0}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-xs)' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Voided
                  </span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-dim)', marginTop: 2, fontFamily: 'var(--font-heading)' }}>
                    {data?.stats?.voided_count || 0}
                  </div>
                </div>
              </div>

              {/* Transactions Timeline */}
              <h3 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Ledger History
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data?.transactions?.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', padding: 24 }}>No transactions recorded for this customer yet.</p>
                ) : (
                  data?.transactions?.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: '14px 16px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        opacity: t.status === 'VOIDED' ? 0.65 : 1,
                        boxShadow: 'var(--shadow-xs)'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.76rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                            {t.transaction_number}
                          </span>
                          {t.status === 'ACTIVE' ? (
                            <span className="badge-active">ACTIVE</span>
                          ) : (
                            <span className="badge-voided">VOIDED</span>
                          )}
                        </div>

                        {t.notes && (
                          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: 2 }}>{t.notes}</p>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.74rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                          <span>
                            {new Date(t.created_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>

                          {t.receipt_url && (
                            <a
                              href={getReceiptUrl(t.receipt_url)}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: 'var(--text-main)', textDecoration: 'underline', fontWeight: 600 }}
                            >
                              Bill Image
                            </a>
                          )}

                          {t.void_reason && (
                            <span style={{ color: 'var(--ruby-text)' }}>Void: {t.void_reason}</span>
                          )}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <div
                          style={{
                            fontSize: '1.2rem',
                            fontWeight: 800,
                            fontFamily: 'var(--font-heading)',
                            color: t.status === 'ACTIVE' ? 'var(--text-main)' : 'var(--text-dim)',
                            textDecoration: t.status === 'VOIDED' ? 'line-through' : 'none'
                          }}
                        >
                          ₹{Number(t.amount).toLocaleString('en-IN')}
                        </div>

                        {t.status === 'ACTIVE' && (
                          <button
                            id={`btn-void-txn-${t.id}`}
                            onClick={() => handleVoidTxn(t.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--ruby-text)',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              padding: '2px 0'
                            }}
                          >
                            Void
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
