import React, { useRef } from 'react';
import { X, Download, Printer, ExternalLink, QrCode, Sparkles } from 'lucide-react';

export default function QrStandeeModal({ business, qrData, onClose, onOpenSimulator }) {
  const standeeRef = useRef(null);

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

      // Token ID
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 30px monospace';
      ctx.fillText(`ID: ${business?.qr_token || ''}`, width / 2, 785);

      // Divider line
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, 825);
      ctx.lineTo(width - 80, 825);
      ctx.stroke();

      // Bottom instructions
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('Open phone camera or Udhaar app to scan', width / 2, 875);

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
          maxWidth: 480,
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '24px',
          position: 'relative',
          border: '1px solid rgba(99, 102, 241, 0.3)'
        }}
      >
        <button
          id="btn-close-standee"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: 'var(--text-muted)',
            width: 36,
            height: 36,
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Store QR Standee</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Place this counter standee at your shop counter for customers to scan
          </p>
        </div>

        {/* The Printable Kirana Standee Card */}
        <div
          ref={standeeRef}
          id="kirana-printable-standee"
          style={{
            background: '#ffffff',
            color: '#0f172a',
            borderRadius: 20,
            padding: '28px 24px',
            textAlign: 'center',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
            border: '4px solid #4338ca',
            position: 'relative'
          }}
        >
          {/* Header Badge */}
          <div
            style={{
              background: '#4338ca',
              color: '#ffffff',
              padding: '6px 18px',
              borderRadius: 9999,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 800,
              fontSize: '0.88rem',
              letterSpacing: '0.06em',
              marginBottom: 14
            }}
          >
            <Sparkles size={14} />
            UDHAAR
          </div>

          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e1b4b', marginBottom: 4 }}>
            {business?.name || 'Kirana Store'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 600, marginBottom: 16 }}>
            Scan to record customer credit (udhaar)
          </p>

          {/* QR Code Container */}
          <div
            style={{
              background: '#ffffff',
              padding: 12,
              borderRadius: 16,
              display: 'inline-block',
              border: '2px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
            }}
          >
            {qrData?.qrDataUrl ? (
              <img
                src={qrData.qrDataUrl}
                alt="Business Udhaar QR"
                style={{ width: 220, height: 220, display: 'block', borderRadius: 8 }}
              />
            ) : (
              <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <QrCode size={64} color="#94a3b8" />
              </div>
            )}
          </div>

          <p style={{ fontSize: '0.8rem', color: '#4338ca', fontWeight: 700, marginTop: 12, fontFamily: 'monospace' }}>
            ID: {business?.qr_token}
          </p>

          {/* Bottom Standee instructions */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed #cbd5e1' }}>
            <p style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
              📸 Open your phone camera or QR scanner
            </p>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
              Zero app install needed • Enter amount & submit
            </p>
          </div>
        </div>

        {/* Actions Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginTop: 20 }}>
          <button
            id="btn-print-standee"
            onClick={handlePrintStandee}
            className="btn-primary"
            style={{ padding: '12px 14px', fontSize: '0.92rem' }}
          >
            <Printer size={16} />
            Print / Save as PDF
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <button
            id="btn-download-standee-img"
            onClick={downloadStandeeImage}
            className="btn-secondary"
            style={{ padding: '10px 14px', fontSize: '0.85rem' }}
          >
            <Download size={15} />
            Standee Image (PNG)
          </button>

          <button
            id="btn-download-qr"
            onClick={downloadQRImage}
            className="btn-secondary"
            style={{ padding: '10px 14px', fontSize: '0.85rem' }}
          >
            <Download size={15} />
            QR Code Only (PNG)
          </button>
        </div>

        <button
          id="btn-test-customer-scan"
          onClick={() => {
            onClose();
            if (onOpenSimulator) onOpenSimulator(business?.qr_token);
          }}
          style={{
            width: '100%',
            marginTop: 12,
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            color: '#a5b4fc',
            padding: '10px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}
        >
          <ExternalLink size={15} />
          Simulate Customer Scan Flow
        </button>
      </div>
    </div>
  );
}
