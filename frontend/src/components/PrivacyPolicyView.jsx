import React, { useState } from 'react';

export default function PrivacyPolicyView({ onBack }) {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'mobile' | 'web'

  const lastUpdated = 'October 13, 2026';

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Sticky Header */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <div
          style={{
            maxWidth: 1040,
            margin: '0 auto',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {onBack && (
              <button
                onClick={onBack}
                className="btn-secondary"
                style={{
                  padding: '7px 12px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
              >
                <span>← Back to App</span>
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '1rem',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                उ
              </div>
              <span style={{ fontWeight: 600, fontSize: '1rem', letterSpacing: '-0.2px' }}>
                Udhaar Ledger
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => window.print()}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              title="Print or save as PDF"
            >
              Print Policy
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main style={{ maxWidth: 1040, width: '100%', margin: '0 auto', padding: '32px 16px 80px', flex: 1 }}>
        {/* Hero Section */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--emerald-text)',
                backgroundColor: 'var(--emerald-bg)',
                border: '1px solid var(--emerald-border)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)'
              }}
            >
              Official Policy
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Effective Date: {lastUpdated}
            </span>
          </div>

          <h1
            style={{
              fontSize: '2.1rem',
              fontWeight: 600,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '-0.5px',
              marginBottom: 8,
              color: 'var(--text-main)'
            }}
          >
            Privacy Policy
          </h1>
          <p style={{ fontSize: '0.96rem', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: 760 }}>
            This Privacy Policy governs both the <strong>Udhaar Mobile Application</strong> (Android / iOS) and the <strong>Udhaar Web Application & Customer QR Portal</strong>. It details how we collect, safeguard, and handle merchant and customer credit data with zero data monetization.
          </p>

          {/* Platform Filter Buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveFilter('all')}
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                fontWeight: 500,
                borderRadius: 'var(--radius-full)',
                border: '1px solid',
                borderColor: activeFilter === 'all' ? 'var(--primary)' : 'var(--border-subtle)',
                backgroundColor: activeFilter === 'all' ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                color: activeFilter === 'all' ? 'var(--text-main)' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              All Platforms (Mobile & Web)
            </button>
            <button
              onClick={() => setActiveFilter('mobile')}
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                fontWeight: 500,
                borderRadius: 'var(--radius-full)',
                border: '1px solid',
                borderColor: activeFilter === 'mobile' ? 'var(--primary)' : 'var(--border-subtle)',
                backgroundColor: activeFilter === 'mobile' ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                color: activeFilter === 'mobile' ? 'var(--text-main)' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              📱 Mobile App Specifics (Android / iOS)
            </button>
            <button
              onClick={() => setActiveFilter('web')}
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                fontWeight: 500,
                borderRadius: 'var(--radius-full)',
                border: '1px solid',
                borderColor: activeFilter === 'web' ? 'var(--primary)' : 'var(--border-subtle)',
                backgroundColor: activeFilter === 'web' ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                color: activeFilter === 'web' ? 'var(--text-main)' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              🌐 Web Portal Specifics (QR Scan & Dashboard)
            </button>
          </div>
        </div>

        {/* Quick Summary Highlights Card */}
        <div
          className="card-surface"
          style={{
            padding: '20px 24px',
            marginBottom: 32,
            borderLeft: '4px solid var(--emerald)',
            backgroundColor: 'var(--bg-surface)'
          }}
        >
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>
            At A Glance: Our Core Privacy Commitments
          </h2>
          <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
            <li><strong>Zero Data Selling:</strong> We do not sell, rent, monetize, or broker financial data or customer phone numbers to advertisers.</li>
            <li><strong>Direct Ledger Recordkeeping:</strong> Personal details (names, mobile numbers, amounts) are stored purely to maintain accurate credit balances for merchant and customer reconciliation.</li>
            <li><strong>Audit Integrity:</strong> When a credit entry is modified or voided, the action is transparently tagged with an audit reason, preventing silent manipulation.</li>
            <li><strong>Restricted Device Permissions:</strong> The Mobile App requests Camera and Photo access solely when you actively attach receipt evidence to an entry.</li>
          </ul>
        </div>

        {/* Policy Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Section 1: Scope & Service Identity */}
          <section id="section-scope" className="card-surface" style={{ padding: '24px 28px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 12, color: 'var(--text-main)' }}>
              1. Identity & Scope of this Policy
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
              Udhaar ("we", "our", or "us") provides a digital credit ledger management solution designed for local retail shops, kirana stores, service providers, and their patrons. This policy covers:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              <div style={{ padding: '14px 16px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>📱 Udhaar Mobile App</div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  Used by store owners and staff to record credit, view timelines, capture receipt photos, generate PDF statements, and manage store settings.
                </p>
              </div>
              <div style={{ padding: '14px 16px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>🌐 Udhaar Web Application & QR Portal</div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  Enables customers to scan standee QR codes and record credit entries directly via their mobile browser without downloading an app.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Information We Collect */}
          <section id="section-collection" className="card-surface" style={{ padding: '24px 28px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 12, color: 'var(--text-main)' }}>
              2. Information We Collect
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
              We only collect data strictly necessary to fulfill digital credit ledger bookkeeping. We categorize collected information as follows:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ borderLeft: '3px solid var(--border-strong)', paddingLeft: 14 }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>
                  A. Store & Merchant Information
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Store Name, Owner Name, Registered 10-Digit Mobile Number (verified via One-Time Password), Business Category (e.g., Kirana, Dairy, Hardware), Physical Address / Landmark, and generated Store QR Token.
                </p>
              </div>

              <div style={{ borderLeft: '3px solid var(--border-strong)', paddingLeft: 14 }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>
                  B. Credit Transaction Entries
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Customer Name, Customer 10-Digit Mobile Number, Credit Amount (in INR ₹), Transaction Timestamp, Unique Transaction Identifier (e.g., TXN-XXXXXX), and optional Item / Purchase Notes.
                </p>
              </div>

              <div style={{ borderLeft: '3px solid var(--border-strong)', paddingLeft: 14 }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>
                  C. Receipt & Bill Photographic Evidence (Optional)
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Photographs of paper bills, weighment receipts, or item slips captured or uploaded by the user to serve as proof of purchase. Stored securely on protected media storage and attached to the corresponding ledger entry.
                </p>
              </div>

              <div style={{ borderLeft: '3px solid var(--border-strong)', paddingLeft: 14 }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>
                  D. Technical & Security Logs
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  IP address, request headers, client device platform, and error diagnostics strictly collected to prevent distributed denial-of-service, brute-force OTP attempts, and unauthorized ledger access.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Mobile App Permissions (Android & iOS) */}
          {(activeFilter === 'all' || activeFilter === 'mobile') && (
            <section id="section-mobile-permissions" className="card-surface" style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: '1.1rem' }}>📱</span>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                  3. Mobile App Device Permissions (Android / iOS)
                </h2>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                In accordance with Google Play Developer Policy and Apple App Store Review Guidelines, the Udhaar Mobile App declares and requests only the specific runtime permissions required for operational features:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      Camera (<code style={{ fontSize: '0.78rem' }}>android.permission.CAMERA</code>)
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Runtime Permission</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    <strong>Why it is needed:</strong> Allows store owners to take a photograph of a physical bill or paper slip at the moment of recording credit. We never access the camera in the background or when the app is minimized.
                  </p>
                </div>

                <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      Photo Library / Media Storage (<code style={{ fontSize: '0.78rem' }}>READ_MEDIA_IMAGES</code>)
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Runtime Permission</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    <strong>Why it is needed:</strong> Allows the user to select an existing receipt image from the device gallery. No non-receipt files or unrelated gallery contents are accessed or inspected.
                  </p>
                </div>

                <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      Internet Access (<code style={{ fontSize: '0.78rem' }}>android.permission.INTERNET</code>)
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Standard Normal Permission</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    <strong>Why it is needed:</strong> Synchronizes ledger entries in real time, verifies OTPs, and streams live credit notifications via secure WebSockets.
                  </p>
                </div>

                <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      Audio Feedback & Haptics
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Local Device Feature</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    <strong>Why it is needed:</strong> Plays an audible completion chime and subtle vibration when an Udhaar record is successfully submitted. We <em>do not</em> request microphone permissions and never record ambient audio.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Section 4: Web Application & Customer Scan Portal */}
          {(activeFilter === 'all' || activeFilter === 'web') && (
            <section id="section-web-portal" className="card-surface" style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: '1.1rem' }}>🌐</span>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                  4. Web Application & Customer Scan Portal
                </h2>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                When customers scan a physical store standee QR code, they are directed to a lightweight web application (<code style={{ fontSize: '0.82rem' }}>/b/:token</code>) hosted on the web domain.
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                <li><strong>No Mandatory App Download:</strong> Customers can submit their credit record directly via their standard mobile web browser (Chrome, Safari, Firefox) without creating an account.</li>
                <li><strong>Browser Camera:</strong> If a customer optionally attaches a bill photo through the web interface, the browser's standard file-picker or HTML5 camera capture dialog handles permission control.</li>
                <li><strong>Browser LocalStorage:</strong> Used exclusively to persist session tokens for shop owners logged into the web dashboard. No third-party tracking cookies or persistent advertising identifiers are placed on customer devices.</li>
              </ul>
            </section>
          )}

          {/* Section 5: How We Use the Information */}
          <section id="section-usage" className="card-surface" style={{ padding: '24px 28px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 12, color: 'var(--text-main)' }}>
              5. How We Use & Process Your Information
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
              We process personal and ledger data strictly for the following operational purposes:
            </p>
            <ol style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
              <li><strong>Ledger Calculation:</strong> Computing accurate outstanding credit balances, transaction counts, and settlement summaries for each customer and store.</li>
              <li><strong>Audit Trail & Dispute Prevention:</strong> Maintaining clear transaction numbers, timestamps, and optional bill photos so that merchants and customers can easily reconcile debts.</li>
              <li><strong>Sharing Statements via WhatsApp:</strong> Enabling store owners to launch WhatsApp with pre-formatted balance slips. The transfer occurs exclusively via the user's local WhatsApp application — Udhaar does not share data with Meta/WhatsApp behind the scenes.</li>
              <li><strong>Authentication & Security:</strong> Verifying shop ownership via secure SMS OTP codes to prevent unauthorized ledger access.</li>
            </ol>
          </section>

          {/* Section 6: Data Retention & Audit Transparency */}
          <section id="section-retention" className="card-surface" style={{ padding: '24px 28px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 12, color: 'var(--text-main)' }}>
              6. Data Retention, Voiding & Integrity
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
              In accounting and financial ledger systems, data integrity is paramount:
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
              <li><strong>Voiding Mechanism:</strong> When an entry is voided (e.g. paid in cash, entered by mistake), it is marked as <code style={{ fontSize: '0.82rem' }}>VOIDED</code> along with an explicit reason and timestamp. The amount is subtracted from active balance calculations, but the audit entry remains visible to prevent clandestine balance changes.</li>
              <li><strong>Account Deletion:</strong> If a store owner closes their account, all associated store profiles, customer relationships, and receipt images are permanently queued for deletion within 30 days of verified request.</li>
            </ul>
          </section>

          {/* Section 7: Security & Encryption */}
          <section id="section-security" className="card-surface" style={{ padding: '24px 28px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 12, color: 'var(--text-main)' }}>
              7. Data Security & Storage
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
              We implement industry-standard administrative, physical, and technical controls to safeguard your data:
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
              <li><strong>Transport Layer Security:</strong> All API communications between Mobile App, Web App, and backend servers are encrypted using TLS 1.3 / HTTPS.</li>
              <li><strong>Access Control:</strong> Merchant ledger records are protected by cryptographically signed JWT tokens with expiration controls.</li>
              <li><strong>File Integrity:</strong> Attached bill receipts are stored with secure random hashes, preventing directory traversal and unauthorized indexing.</li>
            </ul>
          </section>

          {/* Section 8: Rights & Compliance */}
          <section id="section-rights" className="card-surface" style={{ padding: '24px 28px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 12, color: 'var(--text-main)' }}>
              8. User Rights & Data Protection (DPDP Act)
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
              In compliance with applicable data protection laws, including the Digital Personal Data Protection (DPDP) Act:
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
              <li><strong>Right to Access:</strong> You can view all recorded credit records, dates, and amounts anytime in the app or statement view.</li>
              <li><strong>Right to Rectification:</strong> Store owners can edit customer names and purchase notes directly through the transaction detail dialog.</li>
              <li><strong>Right to Erasure:</strong> Customers or store owners can request removal of specific receipt images or full account deletion by contacting our grievance channel.</li>
            </ul>
          </section>

          {/* Section 9: Contact & Grievance Officer */}
          <section id="section-contact" className="card-surface" style={{ padding: '24px 28px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 12, color: 'var(--text-main)' }}>
              9. Contact Us & Grievance Redressal
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
              If you have any questions, feedback, or data privacy requests concerning the Udhaar Mobile App or Web Application, please contact our designated privacy desk:
            </p>
            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: 4 }}>Udhaar Privacy & Data Protection Desk</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Email: <a href="mailto:privacy@udhaarledger.in" style={{ color: 'var(--text-main)', fontWeight: 500, textDecoration: 'underline' }}>privacy@udhaarledger.in</a><br />
                Subject Line: <em>Privacy Inquiry / Data Deletion Request</em><br />
                Response Time: Within 48 business hours
              </div>
            </div>
          </section>
        </div>

        {/* Footer info inside Privacy page */}
        <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <p>© {new Date().getFullYear()} Udhaar Digital Credit Ledger. All rights reserved.</p>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                textDecoration: 'underline',
                cursor: 'pointer',
                marginTop: 4
              }}
            >
              Return to Udhaar
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
