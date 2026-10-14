import React, { useState } from 'react';

const SLIDES = [
  {
    image: '/images/onboarding_1.jpg',
    stepBadgeHi: 'कदम १ : सुरक्षित डिजिटल हिसाब',
    stepBadgeEn: 'STEP 1 : DIGITAL RECORD',
    titleHi: 'कागज़ की पर्ची और\nबहीखाता की झंझट खत्म',
    titleEn: 'No More Lost Paper Slips\nor Forgotten Udhaar',
    descHi:
      'दुकान में डायरी खोजने या पर्ची खोने की चिंता नहीं। आपकी दुकान का हर ग्राहक और उधारी आपके फोन में हमेशा सुरक्षित रहेगी।',
    descEn:
      'Replace torn paper receipts and dusty registers with instant digital records. Every single rupee is tracked safely.',
    highlightHi: '✓ पर्ची फटने या खोने का शून्य जोखिम',
    highlightEn: '✓ Zero risk of lost receipts'
  },
  {
    image: '/images/onboarding_2.jpg',
    stepBadgeHi: 'कदम २ : काउंटर QR स्टैंडी',
    stepBadgeEn: 'STEP 2 : COUNTER QR',
    titleHi: 'काउंटर पर QR लगाएं,\nग्राहक खुद पर्ची जोड़े',
    titleEn: 'Display Counter QR,\nCustomer Logs Credit',
    descHi:
      'भीड़-भाड़ के समय आपको लिखने की फुर्सत न हो, तो ग्राहक काउंटर पर रखा QR स्कैन करके बिल फोटो और उधारी खुद दर्ज करेगा।',
    descEn:
      'During busy rush hours, customers simply scan your counter QR to attach their bill photo and confirm credit amount.',
    highlightHi: '✓ भीड़ के समय दुकान पर समय की बचत',
    highlightEn: '✓ Saves precious counter time'
  },
  {
    image: '/images/onboarding_3.jpg',
    stepBadgeHi: 'कदम ३ : आसान वसूली',
    stepBadgeEn: 'STEP 3 : FAST RECOVERY',
    titleHi: 'समय पर तगादा और\nरिश्तों में भरोसा',
    titleEn: 'Polite SMS Alerts &\nTimely Repayments',
    descHi:
      'हर उधारी पर ग्राहक के फोन पर तुरंत SMS जाता है। कोई बहस या गलतफहमी नहीं होती, और आपका पैसा समय पर वापस आता है।',
    descEn:
      'Customers receive instant SMS receipts for transparency. Keep customer relationships strong and get paid faster.',
    highlightHi: '✓ तुरंत SMS अलर्ट और पक्का मुनाफा',
    highlightEn: '✓ Instant SMS alerts & faster recovery'
  }
];

export default function OnboardingModal({ onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHindi, setIsHindi] = useState(false); // Default: English, Secondary: Hindi

  const handleFinish = () => {
    try {
      localStorage.setItem('udhaar_seen_onboarding', 'true');
    } catch (_) {}
    onFinish();
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const slide = SLIDES[currentIndex];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-page, #f8fafc)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="card-surface"
        style={{
          width: '100%',
          maxWidth: 440,
          borderRadius: 'var(--radius-lg, 20px)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.08))',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-subtle, #e2e8f0)'
        }}
      >
        {/* Header Bar: Logo, Language Toggle & Skip */}
        <div
          style={{
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
            backgroundColor: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/logo.png"
              alt="Udhaar"
              style={{
                width: 36,
                height: 36,
                objectFit: 'contain',
                borderRadius: 8
              }}
            />
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', lineHeight: 1.2 }}>
                Udhaar
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', fontWeight: 500 }}>
                {isHindi ? 'दुकानदार बहीखाता' : 'Digital Credit Khata'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Language Segmented Selector (Default: English, Secondary: Hindi) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-subtle, #f1f5f9)',
                borderRadius: 20,
                padding: '2px',
                border: '1px solid var(--border-subtle, #e2e8f0)'
              }}
            >
              <button
                type="button"
                onClick={() => setIsHindi(false)}
                style={{
                  border: 'none',
                  background: !isHindi ? '#ffffff' : 'transparent',
                  color: !isHindi ? 'var(--primary, #e11d48)' : 'var(--text-secondary, #475569)',
                  fontWeight: !isHindi ? 700 : 500,
                  fontSize: '0.74rem',
                  padding: '3px 8px',
                  borderRadius: 14,
                  cursor: 'pointer',
                  boxShadow: !isHindi ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setIsHindi(true)}
                style={{
                  border: 'none',
                  background: isHindi ? '#ffffff' : 'transparent',
                  color: isHindi ? 'var(--primary, #e11d48)' : 'var(--text-secondary, #475569)',
                  fontWeight: isHindi ? 700 : 500,
                  fontSize: '0.74rem',
                  padding: '3px 8px',
                  borderRadius: 14,
                  cursor: 'pointer',
                  boxShadow: isHindi ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                हिंदी
              </button>
            </div>

            {/* Skip Button */}
            <button
              onClick={handleFinish}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--text-muted, #94a3b8)',
                cursor: 'pointer',
                padding: '4px 6px'
              }}
            >
              {isHindi ? 'छोड़ें' : 'Skip'}
            </button>
          </div>
        </div>

        {/* Slide Visual Illustration */}
        <div style={{ padding: '16px 18px 8px' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              paddingTop: '75%',
              borderRadius: 16,
              overflow: 'hidden',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
            }}
          >
            <img
              src={slide.image}
              alt={slide.titleEn}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: '8px'
              }}
            />
          </div>
        </div>

        {/* Slide Content */}
        <div style={{ padding: '12px 20px 20px', textAlign: 'center' }}>
          {/* Step Pill */}
          <span
            style={{
              display: 'inline-block',
              padding: '3px 10px',
              borderRadius: 16,
              backgroundColor: '#ffe4e6',
              color: '#9f1239',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              marginBottom: 10
            }}
          >
            {isHindi ? slide.stepBadgeHi : slide.stepBadgeEn}
          </span>

          {/* Title */}
          <h2
            style={{
              fontSize: '1.22rem',
              fontWeight: 800,
              color: 'var(--text-main, #0f172a)',
              lineHeight: 1.3,
              marginBottom: 8,
              whiteSpace: 'pre-line'
            }}
          >
            {isHindi ? slide.titleHi : slide.titleEn}
          </h2>

          {/* Description */}
          <p
            style={{
              fontSize: '0.86rem',
              color: 'var(--text-secondary, #475569)',
              lineHeight: 1.5,
              marginBottom: 14,
              minHeight: 58
            }}
          >
            {isHindi ? slide.descHi : slide.descEn}
          </p>

          {/* Key Benefit Highlight */}
          <div
            style={{
              display: 'inline-block',
              padding: '5px 12px',
              borderRadius: 8,
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              color: 'var(--primary, #e11d48)',
              fontSize: '0.78rem',
              fontWeight: 700
            }}
          >
            {isHindi ? slide.highlightHi : slide.highlightEn}
          </div>
        </div>

        {/* Footer: Indicator Dots & Navigation Buttons */}
        <div
          style={{
            padding: '14px 20px 18px',
            borderTop: '1px solid var(--border-subtle, #e2e8f0)',
            backgroundColor: '#ffffff'
          }}
        >
          {/* Progress Indicators */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 14 }}>
            {SLIDES.map((_, idx) => (
              <div
                key={idx}
                style={{
                  height: 6,
                  width: currentIndex === idx ? 24 : 6,
                  borderRadius: 4,
                  backgroundColor: currentIndex === idx ? 'var(--primary, #e11d48)' : '#cbd5e1',
                  transition: 'all 0.25s ease'
                }}
              />
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 10 }}>
            {currentIndex > 0 && (
              <button
                className="btn-secondary"
                onClick={handlePrev}
                style={{
                  padding: '11px 18px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  borderRadius: 10
                }}
              >
                {isHindi ? 'पीछे' : 'Back'}
              </button>
            )}

            <button
              id="btn-onboarding-next"
              className="btn-primary"
              onClick={handleNext}
              style={{
                flex: 1,
                padding: '11px 18px',
                fontSize: '0.92rem',
                fontWeight: 700,
                borderRadius: 10,
                backgroundColor: 'var(--primary, #e11d48)'
              }}
            >
              {currentIndex === SLIDES.length - 1
                ? (isHindi ? 'दुकान शुरू करें ➔' : 'Get Started ➔')
                : (isHindi ? 'आगे बढ़ें ➔' : 'Next ➔')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
