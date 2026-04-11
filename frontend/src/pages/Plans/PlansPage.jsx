import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 0,
    label: 'Free forever',
    cta: 'Current Plan',
    current: true,
    accentColor: '#64748B',
    features: [
      { text: 'Chat with friends', included: true },
      { text: 'Basic AI mentor', included: true },
      { text: 'Limited challenge set', included: true },
      { text: 'Limited personalization', included: true },
      { text: 'Study material access', included: false },
      { text: 'Contest free entries', included: false },
      { text: 'Media sharing in chat', included: false },
      { text: 'Advanced AI models', included: false },
    ],
  },
  {
    id: 'plus',
    name: 'AlgoMind Plus',
    price: 159,
    label: 'per month',
    cta: 'Get Plus',
    popular: true,
    accentColor: '#6366F1',
    features: [
      { text: 'Everything in Basic', included: true },
      { text: 'Media sharing up to 3 MB', included: true },
      { text: 'Advanced AI mentor (limited)', included: true },
      { text: 'Study material access', included: true },
      { text: 'Increased challenge tokens', included: true },
      { text: '2 free contest entries / month', included: true, note: 'Weekly contests only' },
      { text: 'Monthly contest entries', included: false },
      { text: 'Mock & amplitude tests', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'AlgoMind Pro',
    price: 279,
    label: 'per month',
    cta: 'Get Pro',
    accentColor: '#A78BFA',
    features: [
      { text: 'Everything in Plus', included: true },
      { text: 'Media sharing 20+ MB', included: true, note: 'Better quality' },
      { text: 'Full advanced AI access', included: true, note: 'More tokens' },
      { text: 'Mock & amplitude tests', included: true },
      { text: 'Unlimited challenges', included: true },
      { text: 'All affiliated contest entries', included: true, note: 'Monthly cap applies' },
      { text: 'Priority support', included: true },
      { text: 'Early feature access', included: true },
    ],
  },
];

function PlanCard({ plan, isDark, isHighlighted, onSelect }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, shine: { x: 50, y: 50 } });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    const shineX = ((e.clientX - rect.left) / rect.width) * 100;
    const shineY = ((e.clientY - rect.top) / rect.height) * 100;
    setTilt({ x: dy * -8, y: dx * 8, shine: { x: shineX, y: shineY } });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, shine: { x: 50, y: 50 } });
    setHovered(false);
  };

  const surface = isDark ? '#111114' : '#FFFFFF';
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const textPri = isDark ? '#f1f0f5' : '#0F172A';
  const textSec = isDark ? '#7c7b8a' : '#64748B';
  const textMuted = isDark ? '#4a4958' : '#94A3B8';
  const divider = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  return (
    <div
      ref={cardRef}
      onMouseMove={(e) => { setHovered(true); handleMouseMove(e); }}
      onMouseLeave={handleMouseLeave}
      onClick={() => !plan.current && onSelect(plan)}
      style={{
        background: surface,
        border: isHighlighted ? `1.5px solid ${plan.accentColor}` : `1px solid ${border}`,
        borderRadius: '20px',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
        cursor: plan.current ? 'default' : 'pointer',
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${hovered && !plan.current ? 'translateY(-4px)' : 'translateY(0)'}`,
        transition: hovered ? 'box-shadow 0.15s ease' : 'transform 0.5s cubic-bezier(0.23,1,0.32,1), box-shadow 0.5s ease',
        boxShadow: isHighlighted
          ? `0 0 0 1px ${plan.accentColor}22, 0 24px 48px -12px ${plan.accentColor}33`
          : hovered
            ? isDark ? '0 20px 40px -12px rgba(0,0,0,0.6)' : '0 20px 40px -12px rgba(0,0,0,0.12)'
            : isDark ? '0 1px 3px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Shine overlay */}
      {hovered && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '20px', pointerEvents: 'none',
          background: `radial-gradient(circle at ${tilt.shine.x}% ${tilt.shine.y}%, rgba(255,255,255,${isDark ? '0.04' : '0.12'}) 0%, transparent 60%)`,
          transition: 'background 0.1s',
        }} />
      )}

      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px',
        background: `linear-gradient(90deg, transparent, ${plan.accentColor}88, transparent)`,
        opacity: isHighlighted ? 1 : 0.3,
      }} />

      {/* Popular badge */}
      {plan.popular && (
        <div style={{
          position: 'absolute', top: '1.25rem', right: '1.25rem',
          background: `${plan.accentColor}18`,
          color: plan.accentColor,
          fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
          padding: '3px 10px', borderRadius: '20px',
          border: `1px solid ${plan.accentColor}30`,
          textTransform: 'uppercase',
        }}>
          Popular
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: plan.accentColor, marginBottom: '6px', letterSpacing: '0.02em' }}>
          {plan.name}
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontSize: '2.75rem', fontWeight: 800, color: textPri, lineHeight: 1, letterSpacing: '-0.03em', fontFamily: 'inherit' }}>
            {plan.price === 0 ? 'Free' : `₹${plan.price}`}
          </span>
          {plan.price > 0 && (
            <span style={{ fontSize: '13px', color: textSec }}>{plan.label}</span>
          )}
        </div>
        {plan.current && (
          <span style={{ fontSize: '11px', color: textMuted, marginTop: '4px', display: 'block' }}>Your current plan</span>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: divider, marginBottom: '1.5rem' }} />

      {/* Features */}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        {plan.features.map((f, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{
              flexShrink: 0, width: '16px', height: '16px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px',
              background: f.included ? `${plan.accentColor}18` : 'transparent',
            }}>
              {f.included ? (
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                  <path d="M1 3.5L3.5 6L8 1" stroke={plan.accentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1 1l6 6M7 1L1 7" stroke={textMuted} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
            </span>
            <span style={{ fontSize: '13.5px', lineHeight: '1.4' }}>
              <span style={{ color: f.included ? textPri : textMuted }}>{f.text}</span>
              {f.note && (
                <span style={{ display: 'block', fontSize: '11px', color: textMuted, marginTop: '1px' }}>{f.note}</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        disabled={plan.current}
        onClick={(e) => { e.stopPropagation(); !plan.current && onSelect(plan); }}
        style={{
          marginTop: '2rem', width: '100%', padding: '12px',
          borderRadius: '12px', fontSize: '14px', fontWeight: 600,
          cursor: plan.current ? 'default' : 'pointer',
          border: 'none', outline: 'none',
          background: plan.current
            ? isDark ? '#1e1e22' : '#F1F5F9'
            : plan.id === 'pro'
              ? `linear-gradient(135deg, ${plan.accentColor}, #7C3AED)`
              : plan.accentColor,
          color: plan.current ? textMuted : '#ffffff',
          transition: 'opacity 0.2s, transform 0.1s',
          boxShadow: plan.current ? 'none' : `0 8px 20px -6px ${plan.accentColor}55`,
        }}
        onMouseEnter={(e) => { if (!plan.current) e.currentTarget.style.opacity = '0.88'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
      >
        {plan.cta}
      </button>
    </div>
  );
}

function PlansPage({ isDark, toggleTheme }) {
  const navigate = useNavigate();
  const [highlighted, setHighlighted] = useState('plus');

  const bg = isDark
    ? 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.08) 0%, transparent 70%), #0A0A0B'
    : 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.05) 0%, transparent 70%), #FAFAFA';
  const textPri = isDark ? '#f1f0f5' : '#0F172A';
  const textSec = isDark ? '#7c7b8a' : '#64748B';
  const navBg = isDark ? 'rgba(10,10,11,0.85)' : 'rgba(250,250,250,0.85)';
  const navBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  const handleSelect = (plan) => {
    navigate(`/payment?plan=${plan.id}&name=${encodeURIComponent(plan.name)}&price=${plan.price}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textPri, fontFamily: 'inherit' }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .plan-fade-up { animation: fadeUp 0.5s cubic-bezier(0.23,1,0.32,1) both; }
        .plan-fade-up:nth-child(1) { animation-delay: 0.05s; }
        .plan-fade-up:nth-child(2) { animation-delay: 0.12s; }
        .plan-fade-up:nth-child(3) { animation-delay: 0.19s; }
      `}</style>

      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50, height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2rem', background: navBg,
        backdropFilter: 'blur(20px)', borderBottom: `1px solid ${navBorder}`,
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
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            ← Back
          </button>
          <button onClick={toggleTheme} style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: isDark ? '#1a1a1e' : '#F1F5F9',
            border: `1px solid ${navBorder}`,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: textSec, fontSize: '14px',
          }}>
            {isDark ? '☀' : '◑'}
          </button>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '4rem 1.5rem 6rem' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6366F1', marginBottom: '12px' }}>
            Pricing
          </p>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800,
            letterSpacing: '-0.04em', lineHeight: 1.1, color: textPri, margin: '0 0 14px',
          }}>
            Simple, transparent pricing
          </h1>
          <p style={{ fontSize: '16px', color: textSec, maxWidth: '440px', margin: '0 auto', lineHeight: 1.6 }}>
            Start free. Upgrade when you need more. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Plan cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          alignItems: 'start',
        }}>
          {PLANS.map((plan) => (
            <div key={plan.id} className="plan-fade-up">
              <PlanCard
                plan={plan}
                isDark={isDark}
                isHighlighted={highlighted === plan.id}
                onSelect={handleSelect}
              />
            </div>
          ))}
        </div>

        {/* Footnote */}
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <p style={{ fontSize: '13px', color: textSec }}>
            All prices in INR · Secure payments · Cancel anytime
          </p>
          <button
            onClick={() => navigate('/support')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: '8px', fontSize: '13px', color: '#6366F1', fontWeight: 600 }}
          >
            Questions? Contact support →
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlansPage;
