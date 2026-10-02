import React, { useState, useEffect } from 'react';
import { X, User, Phone, FileText, Ban, CheckCircle, Clock } from 'lucide-react';

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
    if (reason === null) return; // user cancelled

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
          maxWidth: 620,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0,
          border: '1px solid rgba(99, 102, 241, 0.3)'
        }}
      >
        {/* Modal Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={22} color="#818cf8" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{data?.customer?.name || 'Customer Statement'}</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Phone size={13} /> +91 {data?.customer?.mobile}
              </p>
            </div>
          </div>
          <button
            id="btn-close-ledger"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 6 }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading statement...</div>
          ) : error ? (
            <div style={{ color: 'var(--accent-rose)', textAlign: 'center', padding: 20 }}>{error}</div>
          ) : (
            <>
              {/* Customer Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Total Outstanding
                  </span>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc', marginTop: 2, fontFamily: 'var(--font-heading)' }}>
                    ₹{Number(data?.stats?.total_outstanding || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Active Entries
                  </span>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10b981', marginTop: 2, fontFamily: 'var(--font-heading)' }}>
                    {data?.stats?.active_count || 0}
                  </div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Voided
                  </span>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-dim)', marginTop: 2, fontFamily: 'var(--font-heading)' }}>
                    {data?.stats?.voided_count || 0}
                  </div>
                </div>
              </div>

              {/* Transactions Timeline */}
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Recorded Udhaar History
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data?.transactions?.length === 0 ? (
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', textAlign: 'center', padding: 24 }}>No transactions recorded for this customer yet.</p>
                ) : (
                  data?.transactions?.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: '14px 16px',
                        background: t.status === 'VOIDED' ? 'rgba(244,63,94,0.03)' : 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        opacity: t.status === 'VOIDED' ? 0.65 : 1
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                            {t.transaction_number}
                          </span>
                          {t.status === 'ACTIVE' ? (
                            <span className="badge-active">ACTIVE</span>
                          ) : (
                            <span className="badge-voided">VOIDED</span>
                          )}
                        </div>

                        {t.notes && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: 2 }}>{t.notes}</p>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Clock size={12} />
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
                              href={t.receipt_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#818cf8', textDecoration: 'underline' }}
                            >
                              View Bill ↗
                            </a>
                          )}

                          {t.void_reason && (
                            <span style={{ color: 'var(--accent-rose)' }}>Reason: {t.void_reason}</span>
                          )}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <div
                          style={{
                            fontSize: '1.25rem',
                            fontWeight: 800,
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
                              color: 'var(--accent-rose)',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <Ban size={12} />
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
