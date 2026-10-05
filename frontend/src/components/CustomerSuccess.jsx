import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { getReceiptUrl } from '../utils/api';

export default function CustomerSuccess({ transaction, business, onRecordAnother, onBackToStore }) {
  useEffect(() => {
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#059669', '#0F172A', '#D97706']
      });
    } catch (e) {
      // ignore
    }
  }, []);

  const formattedDate = transaction?.created_at
    ? new Date(transaction.created_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    : new Date().toLocaleString('en-IN');

  const shareText = `*Udhaar Recorded Successfully*%0A%0A*Store:* ${business?.name || transaction?.business_name}%0A*Amount:* ₹${Number(transaction?.amount || 0).toLocaleString('en-IN')}%0A*Transaction ID:* ${transaction?.transaction_number}%0A*Customer:* ${transaction?.customer_name}%0A*Date:* ${formattedDate}%0A%0ARecorded via Udhaar Digital Ledger.`;

  const handleWhatsAppShare = () => {
    window.open(`https://api.whatsapp.com/send?text=${shareText}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ maxWidth: 480, margin: '24px auto 60px', padding: '0 16px' }} className="animate-fade-in">
      <div
        className="card-surface"
        style={{
          padding: '32px 24px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        {/* Success Icon */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--emerald-bg)',
            border: '2px solid var(--emerald-border)',
            color: 'var(--emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '1.8rem',
            fontWeight: 800
          }}
        >
          ✓
        </div>

        <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4 }}>
          Udhaar Recorded Successfully
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 20 }}>
          {business?.name || transaction?.business_name}
        </p>

        {/* Prominent Amount Box */}
        <div
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            marginBottom: 20
          }}
        >
          <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 4 }}>
            Recorded Credit Amount
          </span>
          <div style={{ fontSize: '2.6rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
            ₹{Number(transaction?.amount || 0).toLocaleString('en-IN')}
          </div>
          {transaction?.notes && (
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: 6, fontStyle: 'italic' }}>
              "{transaction.notes}"
            </p>
          )}
        </div>

        {/* Transaction Metadata Breakdown */}
        <div style={{ textAlign: 'left', background: 'var(--bg-page)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Transaction ID</span>
            <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-main)', background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
              {transaction?.transaction_number}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Date & Time</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>{formattedDate}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Customer Name</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>{transaction?.customer_name}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Mobile Number</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>+91 {transaction?.customer_mobile}</span>
          </div>

          {transaction?.receipt_url && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Attached Receipt</span>
              <a
                href={getReceiptUrl(transaction.receipt_url)}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.82rem', color: 'var(--text-main)', textDecoration: 'underline', fontWeight: 600 }}
              >
                View Bill Image
              </a>
            </div>
          )}
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 20 }}>
          The merchant register has been updated with this entry.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <button
            id="btn-whatsapp-share"
            onClick={handleWhatsAppShare}
            className="btn-primary"
            style={{ flex: 1, background: '#16A34A', color: '#ffffff' }}
          >
            Share on WhatsApp
          </button>
          <button
            id="btn-print-receipt"
            onClick={handlePrint}
            className="btn-secondary"
            style={{ padding: '10px 16px' }}
          >
            Print
          </button>
        </div>

        <button
          id="btn-record-another"
          onClick={onRecordAnother}
          className="btn-secondary"
          style={{ width: '100%', padding: '11px' }}
        >
          Record Another Entry
        </button>
      </div>
    </div>
  );
}
