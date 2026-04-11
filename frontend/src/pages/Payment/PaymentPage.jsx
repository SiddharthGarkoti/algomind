import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PLAN_META = {
  plus: { color: '#6366F1', label: 'AlgoMind Plus', price: 159 },
  pro:  { color: '#A78BFA', label: 'AlgoMind Pro',  price: 279 },
};

const UPI_ID = 'siddharthgarkoti4545@okicici';

function InputField({ label, placeholder, value, onChange, type = 'text', maxLength, hint, isDark }) {
  const textPri = isDark ? '#f1f0f5' : '#0F172A';
  const textSec = isDark ? '#7c7b8a' : '#64748B';
  const inputBg = isDark ? '#18181c' : '#F8FAFC';
  const border  = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.1)';
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: textSec, letterSpacing: '0.02em' }}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: inputBg,
          border: `1px solid ${focused ? '#6366F1' : border}`,
          borderRadius: '10px', padding: '11px 14px',
          fontSize: '14px', color: textPri, outline: 'none',
          transition: 'border-color 0.2s',
          fontFamily: 'inherit',
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
        }}
      />
      {hint && <p style={{ fontSize: '11px', color: textSec, margin: 0 }}>{hint}</p>}
    </div>
  );
}

function CardForm({ isDark }) {
  const [num, setNum]   = useState('');
  const [name, setName] = useState('');
  const [exp, setExp]   = useState('');
  const [cvv, setCvv]   = useState('');

  const formatCard = (v) => v.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
  const formatExp  = (v) => {
    const d = v.replace(/\D/g, '');
    if (d.length >= 3) return `${d.slice(0, 2)} / ${d.slice(2, 4)}`;
    return d;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <InputField label="Card number" placeholder="1234 5678 9012 3456" value={num}
        onChange={(e) => setNum(formatCard(e.target.value))} maxLength={19} isDark={isDark} />
      <InputField label="Cardholder name" placeholder="Name on card" value={name}
        onChange={(e) => setName(e.target.value)} isDark={isDark} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <InputField label="Expiry" placeholder="MM / YY" value={exp}
          onChange={(e) => setExp(formatExp(e.target.value))} maxLength={7} isDark={isDark} />
        <InputField label="CVV" placeholder="•••" value={cvv} type="password"
          onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} isDark={isDark} />
      </div>
    </div>
  );
}

function BankForm({ isDark }) {
  const textSec  = isDark ? '#7c7b8a' : '#64748B';
  const cardBg   = isDark ? '#111114' : '#F8FAFC';
  const border   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  return (
    <div style={{ borderRadius: '12px', background: cardBg, border: `1px solid ${border}`, padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '28px', marginBottom: '12px' }}>🏦</div>
      <p style={{ fontWeight: 600, fontSize: '14px', color: textSec, marginBottom: '6px' }}>Bank Transfer</p>
      <p style={{ fontSize: '13px', color: textSec, lineHeight: 1.6 }}>
        Net banking and direct bank transfer support is coming soon. Use UPI or Card to complete your payment.
      </p>
    </div>
  );
}

function UPIForm({ isDark, planColor }) {
  const textPri  = isDark ? '#f1f0f5' : '#0F172A';
  const textSec  = isDark ? '#7c7b8a' : '#64748B';
  const cardBg   = isDark ? '#111114' : '#F8FAFC';
  const border   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(UPI_ID).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* QR Code */}
      <div style={{
        borderRadius: '14px', background: cardBg, border: `1px solid ${border}`,
        padding: '1.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
      }}>
        <div style={{
          width: '180px', height: '180px', borderRadius: '12px',
          background: '#ffffff',
          padding: '8px',
          boxShadow: isDark ? '0 0 0 1px rgba(255,255,255,0.08)' : '0 0 0 1px rgba(0,0,0,0.08)',
        }}>
          <img
            src="/upi-gr.png"
            alt="UPI QR Code"
            style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px', display: 'block' }}
          />
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: textSec, marginBottom: '4px' }}>Scan with any UPI app</p>
          <p style={{ fontSize: '11px', color: isDark ? '#4a4958' : '#94A3B8' }}>PhonePe · GPay · Paytm · BHIM</p>
        </div>
      </div>

      {/* UPI ID */}
      <div style={{
        borderRadius: '12px', border: `1px solid ${border}`,
        padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: cardBg,
      }}>
        <div>
          <p style={{ fontSize: '11px', color: textSec, marginBottom: '2px' }}>UPI ID</p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: textPri, letterSpacing: '0.01em' }}>{UPI_ID}</p>
        </div>
        <button onClick={copy} style={{
          background: copied ? `${planColor}18` : isDark ? '#1e1e22' : '#F1F5F9',
          border: `1px solid ${copied ? planColor : border}`,
          borderRadius: '8px', padding: '7px 14px',
          fontSize: '12px', fontWeight: 600,
          color: copied ? planColor : textSec,
          cursor: 'pointer', transition: 'all 0.2s',
        }}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>

      <p style={{ fontSize: '12px', color: isDark ? '#4a4958' : '#94A3B8', textAlign: 'center', lineHeight: 1.5 }}>
        After payment, your plan will be activated within 5–10 minutes.
        <br />Save your transaction ID for reference.
      </p>
    </div>
  );
}

function PaymentPage({ isDark, toggleTheme }) {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const [tab, setTab] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const planId    = params.get('plan') || 'plus';
  const planMeta  = PLAN_META[planId] || PLAN_META.plus;

  const bg = isDark
    ? 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(99,102,241,0.07) 0%, transparent 60%), #0A0A0B'
    : 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(99,102,241,0.04) 0%, transparent 60%), #FAFAFA';
  const textPri   = isDark ? '#f1f0f5' : '#0F172A';
  const textSec   = isDark ? '#7c7b8a' : '#64748B';
  const surface   = isDark ? '#111114' : '#FFFFFF';
  const border    = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const navBg     = isDark ? 'rgba(10,10,11,0.85)' : 'rgba(250,250,250,0.85)';

  const TABS = [
    { id: 'card', label: 'Card' },
    { id: 'upi',  label: 'UPI' },
    { id: 'bank', label: 'Bank' },
  ];

  const handlePay = () => {
    if (tab === 'upi' || tab === 'bank') return;
    setProcessing(true);
    setTimeout(() => { setProcessing(false); setSuccess(true); }, 2200);
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>
        <style>{`
          @keyframes successPop { 0%{transform:scale(0.7);opacity:0} 70%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
          .success-pop { animation: successPop 0.5s cubic-bezier(0.23,1,0.32,1) both; }
        `}</style>
        <div className="success-pop" style={{
          textAlign: 'center', padding: '3rem 2rem',
          background: surface, borderRadius: '24px',
          border: `1px solid ${border}`, maxWidth: '380px', width: '100%',
          boxShadow: isDark ? '0 40px 80px rgba(0,0,0,0.4)' : '0 40px 80px rgba(0,0,0,0.1)',
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: `${planMeta.color}18`, margin: '0 auto 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="28" height="22" viewBox="0 0 28 22" fill="none">
              <path d="M2 11L10 19L26 3" stroke={planMeta.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 style={{ fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.03em', color: textPri, marginBottom: '8px' }}>Payment successful</h2>
          <p style={{ fontSize: '14px', color: textSec, marginBottom: '28px', lineHeight: 1.6 }}>
            Welcome to {planMeta.label}. Your account has been upgraded.
          </p>
          <button onClick={() => navigate('/dashboard')} style={{
            background: planMeta.color, color: '#fff', border: 'none',
            borderRadius: '12px', padding: '12px 28px', fontSize: '14px',
            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: 'inherit' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .pay-in { animation: fadeIn 0.35s ease both; }
      `}</style>

      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50, height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2rem', background: navBg,
        backdropFilter: 'blur(20px)', borderBottom: `1px solid ${border}`,
      }}>
        <button onClick={() => navigate(-1)} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '8px',
            background: 'linear-gradient(135deg,#6366F1,#4F46E5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1L11 6L6 11M1 6H11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '-0.03em', color: textPri }}>AlgoMind</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate(-1)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600, color: '#6366F1',
          }}>
            ← Back to Plans
          </button>
          <button onClick={toggleTheme} style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: isDark ? '#1a1a1e' : '#F1F5F9',
            border: `1px solid ${border}`, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: textSec, fontSize: '14px',
          }}>
            {isDark ? '☀' : '◑'}
          </button>
        </div>
      </nav>

      {/* Layout */}
      <div style={{
        maxWidth: '760px', margin: '0 auto', padding: '3rem 1.5rem 5rem',
        display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start',
      }}
        className="pay-layout"
      >
        <style>{`
          @media (max-width: 640px) { .pay-layout { grid-template-columns: 1fr !important; } }
        `}</style>

        {/* Left — Payment form */}
        <div style={{ background: surface, borderRadius: '20px', border: `1px solid ${border}`, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '1.5rem 1.75rem', borderBottom: `1px solid ${border}` }}>
            <h1 style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', color: textPri, margin: 0 }}>
              Complete payment
            </h1>
            <p style={{ fontSize: '13px', color: textSec, margin: '4px 0 0' }}>
              Secure checkout — your info is always encrypted
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${border}` }}>
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, padding: '14px', fontSize: '13px', fontWeight: 600,
                background: 'none', border: 'none', cursor: 'pointer',
                color: tab === t.id ? planMeta.color : textSec,
                borderBottom: tab === t.id ? `2px solid ${planMeta.color}` : '2px solid transparent',
                marginBottom: '-1px', transition: 'color 0.15s',
                fontFamily: 'inherit',
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Form body */}
          <div style={{ padding: '1.75rem' }} key={tab} className="pay-in">
            {tab === 'card' && <CardForm isDark={isDark} />}
            {tab === 'upi'  && <UPIForm  isDark={isDark} planColor={planMeta.color} />}
            {tab === 'bank' && <BankForm isDark={isDark} />}

            {/* Pay button */}
            {tab === 'card' && (
              <button onClick={handlePay} disabled={processing} style={{
                marginTop: '24px', width: '100%',
                background: processing ? `${planMeta.color}88` : planMeta.color,
                color: '#fff', border: 'none', borderRadius: '12px',
                padding: '14px', fontSize: '14px', fontWeight: 700,
                cursor: processing ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', letterSpacing: '0.01em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'opacity 0.2s',
                boxShadow: `0 8px 24px -6px ${planMeta.color}55`,
              }}>
                {processing ? (
                  <>
                    <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                    Processing…
                  </>
                ) : (
                  <>Pay ₹{planMeta.price}</>
                )}
              </button>
            )}
          </div>

          {/* Security footer */}
          <div style={{ padding: '1rem 1.75rem', borderTop: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            {['256-bit SSL', 'PCI DSS', 'Encrypted'].map((s) => (
              <span key={s} style={{ fontSize: '11px', color: isDark ? '#4a4958' : '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
                  <rect x="1" y="5" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M3 5V3.5a2 2 0 114 0V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Right — Order summary */}
        <div style={{ background: surface, borderRadius: '20px', border: `1px solid ${border}`, padding: '1.5rem', position: 'sticky', top: '72px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: textSec, marginBottom: '16px' }}>
            Order summary
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: textPri }}>{planMeta.label}</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: textPri }}>₹{planMeta.price}</span>
          </div>
          <p style={{ fontSize: '12px', color: textSec, marginBottom: '20px' }}>per month · billed monthly</p>

          <div style={{ height: '1px', background: border, marginBottom: '16px' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', color: textSec }}>Subtotal</span>
            <span style={{ fontSize: '13px', color: textSec }}>₹{planMeta.price}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', color: textSec }}>Tax (GST 18%)</span>
            <span style={{ fontSize: '13px', color: textSec }}>Incl.</span>
          </div>

          <div style={{ height: '1px', background: border, marginBottom: '16px' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: textPri }}>Total</span>
            <span style={{ fontSize: '20px', fontWeight: 800, color: planMeta.color, letterSpacing: '-0.03em' }}>₹{planMeta.price}</span>
          </div>

          {/* Plan accent */}
          <div style={{
            marginTop: '20px', borderRadius: '10px',
            background: `${planMeta.color}10`,
            border: `1px solid ${planMeta.color}22`,
            padding: '10px 14px',
          }}>
            <p style={{ fontSize: '12px', color: planMeta.color, fontWeight: 600, marginBottom: '2px' }}>{planMeta.label} unlocks</p>
            <p style={{ fontSize: '11px', color: textSec, lineHeight: 1.5 }}>
              {planId === 'plus'
                ? 'AI mentor · Study materials · Contest entries'
                : 'Full AI access · Mock tests · Unlimited challenges'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;
