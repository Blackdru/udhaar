import React, { useEffect } from 'react';
import { CheckCircle2, Share2, Printer, PlusCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CustomerSuccess({ transaction, business, onRecordAnother, onBackToStore }) {
  useEffect(() => {
    // Joyful celebration confetti!
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899']
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
    <div style={{ maxWidth: 460, margin: '20px auto 60px', padding: '0 16px' }} className="animate-fade-in">
      {/* Success Card / Digital Slip */}
      <div
        className="glass-panel"
        style={{
          padding: '32px 24px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5), 0 0 25px rgba(16, 185, 129, 0.2)',
          border: '1px solid rgba(16, 185, 129, 0.4)'
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(90deg, #10b981, #6366f1)' }} />

        {/* Success Icon */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '2px solid rgba(16, 185, 129, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            animation: 'pulseGlow 2s infinite'
          }}
        >
          <CheckCircle2 size={42} color="#10b981" />
        </div>

        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4 }}>
          Udhaar Recorded Successfully
        </h2>
        <p style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 600, marginBottom: 20 }}>
          {business?.name || transaction?.business_name}
        </p>

        {/* Prominent Amount Box */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            marginBottom: 24
          }}
        >
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 4 }}>
            Recorded Credit Amount
          </span>
          <div style={{ fontSize: '2.8rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-heading)' }}>
            ₹{Number(transaction?.amount || 0).toLocaleString('en-IN')}
          </div>
          {transaction?.notes && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: 8, fontStyle: 'italic' }}>
              "{transaction.notes}"
            </p>
          )}
        </div>

        {/* Transaction Metadata Breakdown */}
        <div style={{ textAlign: 'left', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Transaction ID</span>
            <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 700, color: '#818cf8', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: 4 }}>
              {transaction?.transaction_number}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Date & Time</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{formattedDate}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Customer Name</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{transaction?.customer_name}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Customer Mobile</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>+91 {transaction?.customer_mobile}</span>
          </div>

          {transaction?.receipt_url && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Receipt Evidence</span>
              <a
                href={transaction.receipt_url}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.82rem', color: '#818cf8', textDecoration: 'underline', fontWeight: 600 }}
              >
                View Attached Bill ↗
              </a>
            </div>
          )}
        </div>

        {/* Reassurance text */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 24, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          <ShieldCheck size={16} color="#10b981" />
          <span>The shopkeeper's dashboard has been updated.</span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <button
            id="btn-whatsapp-share"
            onClick={handleWhatsAppShare}
            className="btn-primary"
            style={{ flex: 1, background: '#25D366', color: '#ffffff', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)' }}
          >
            <Share2 size={16} />
            Share WhatsApp
          </button>
          <button
            id="btn-print-receipt"
            onClick={handlePrint}
            className="btn-secondary"
            style={{ padding: '12px 16px' }}
            title="Print or Save PDF"
          >
            <Printer size={16} />
          </button>
        </div>

        <button
          id="btn-record-another"
          onClick={onRecordAnother}
          className="btn-secondary"
          style={{ width: '100%', padding: '12px' }}
        >
          <PlusCircle size={16} />
          Record Another Udhaar
        </button>
      </div>
    </div>
  );
}
