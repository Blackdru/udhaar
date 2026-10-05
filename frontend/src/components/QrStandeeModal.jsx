import React, { useRef, useState } from 'react';

export default function QrStandeeModal({ business, qrData, onClose, onOpenSimulator }) {
  const standeeRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const frontendBase = window.location.origin?.includes('localhost')
    ? window.location.origin
    : 'https://udhaar.store';
  const customerUrl = qrData?.url
    ? qrData.url.replace(/https?:\/\/server\.udhaar\.store(:\d+)?/, 'https://udhaar.store')
    : `${frontendBase}/b/${business?.qr_token}`;

  const copyCustomerLink = () => {
    navigator.clipboard.writeText(customerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQRImage = () => {
    if (!qrData?.qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `${(business?.name || 'udhaar-qr').replace(/\s+/g, '_')}_QR_Code.png`;
    link.href = qrData.qrDataUrl;
    link.click();
  };

  const downloadStandeeImage = () => {
    if (!qrData?.qrDataUrl) return;
    const canvas = document.createElement('canvas');
    const width = 800;
    const height = 1100;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Card background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Card outer border
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 14;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Header Pill
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(width / 2 - 110, 65, 220, 56, 28);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('UDHAAR', width / 2, 104);

    // Store Name
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText(business?.name || 'Store Name', width / 2, 180);

    // Subtitle
    ctx.fillStyle = '#475569';
    ctx.font = '22px sans-serif';
    ctx.fillText('Scan to record customer credit (udhaar)', width / 2, 225);

    // QR Image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const qrSize = 440;
      const qrX = (width - qrSize) / 2;
      const qrY = 270;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrX - 16, qrY - 16, qrSize + 32, qrSize + 32);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4;
      ctx.strokeRect(qrX - 16, qrY - 16, qrSize + 32, qrSize + 32);

      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      // Token ID & Web URL
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 30px monospace';
      ctx.fillText(`ID: ${business?.qr_token || ''}`, width / 2, 770);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(customerUrl, width / 2, 805);

      // Divider line
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, 835);
      ctx.lineTo(width - 80, 835);
      ctx.stroke();

      // Bottom instructions
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('Open phone camera or QR scanner', width / 2, 875);

      ctx.fillStyle = '#64748b';
      ctx.font = '22px sans-serif';
      ctx.fillText('Zero app installation required for customers', width / 2, 920);

      const link = document.createElement('a');
      link.download = `${(business?.name || 'Store').replace(/\s+/g, '_')}_Counter_Standee.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = qrData.qrDataUrl;
  };

  const handlePrintStandee = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)' }}>
          <div>
            <h2 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-main)' }}>Counter QR Standee</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Display at your checkout counter</p>
          </div>
          <button
            id="btn-close-standee"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1, padding: 6 }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: 'var(--bg-page)' }}>
          {/* Printable Kirana Standee Card */}
          <div
            ref={standeeRef}
            id="kirana-printable-standee"
            style={{
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: 16,
              padding: '24px 20px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)',
              border: '2px solid #0f172a',
              position: 'relative'
            }}
          >
            {/* Header Badge */}
            <div
              style={{
                background: '#0f172a',
                color: '#ffffff',
                padding: '5px 16px',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                fontWeight: 800,
                fontSize: '0.84rem',
                letterSpacing: '0.06em',
                marginBottom: 12
              }}
            >
              UDHAAR
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>
              {business?.name || 'Kirana Store'}
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500, marginBottom: 14 }}>
              Scan to record customer credit (udhaar)
            </p>

            {/* QR Code Container */}
            <div
              style={{
                background: '#ffffff',
                padding: 10,
                borderRadius: 12,
                display: 'inline-block',
                border: '1px solid #cbd5e1'
              }}
            >
              {qrData?.qrDataUrl ? (
                <img
                  src={qrData.qrDataUrl}
                  alt="Business Udhaar QR"
                  style={{ width: 190, height: 190, display: 'block', borderRadius: 6 }}
                />
              ) : (
                <div style={{ width: 190, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  Loading QR...
                </div>
              )}
            </div>

            <div style={{ marginTop: 10 }}>
              <p style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 700, fontFamily: 'monospace' }}>
                ID: {business?.qr_token}
              </p>
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {customerUrl}
                </span>
                <button
                  type="button"
                  onClick={copyCustomerLink}
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xs)',
                    padding: '2px 6px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: copied ? 'var(--emerald-text)' : 'var(--text-secondary)'
                  }}
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Bottom Standee instructions */}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #cbd5e1' }}>
              <p style={{ fontSize: '0.76rem', color: '#334155', fontWeight: 600 }}>
                Open phone camera or QR scanner
              </p>
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>
                Instant browser entry • Zero app install
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18 }}>
            <button
              id="btn-print-standee"
              onClick={handlePrintStandee}
              className="btn-primary"
              style={{ width: '100%' }}
            >
              Print / Save PDF Standee
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                id="btn-download-standee-img"
                onClick={downloadStandeeImage}
                className="btn-secondary"
              >
                Standee PNG
              </button>

              <button
                id="btn-download-qr"
                onClick={downloadQRImage}
                className="btn-secondary"
              >
                QR Image
              </button>
            </div>

            <button
              id="btn-test-customer-scan"
              onClick={() => {
                onClose();
                if (onOpenSimulator) onOpenSimulator(business?.qr_token);
              }}
              className="btn-secondary"
              style={{ width: '100%', marginTop: 4 }}
            >
              Test Scan in New Tab
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
