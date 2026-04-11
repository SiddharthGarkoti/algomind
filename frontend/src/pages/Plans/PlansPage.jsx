import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PLANS = [
  {
    id:       'basic',
    name:     'Basic',
    price:    0,
    period:   'free forever',
    icon:     '🌱',
    color:    '#22C55E',
    gradient: 'linear-gradient(135deg,#22C55E,#16A34A)',
    shadow:   'rgba(34,197,94,0.25)',
    current:  true,
    cta:      'Current Plan',
    benefits: [],
  },
  {
    id:       'plus',
    name:     'AlgoMind Plus',
    price:    100,
    period:   'per month',
    icon:     '⚡',
    color:    '#6366F1',
    gradient: 'linear-gradient(135deg,#6366F1,#4F46E5)',
    shadow:   'rgba(99,102,241,0.35)',
    popular:  true,
    cta:      'Upgrade to Plus',
    benefits: [],
  },
  {
    id:       'ultimate',
    name:     'Ultimate',
    price:    200,
    period:   'per month',
    icon:     '🏆',
    color:    '#F59E0B',
    gradient: 'linear-gradient(135deg,#F59E0B,#D97706)',
    shadow:   'rgba(245,158,11,0.35)',
    cta:      'Go Ultimate',
    benefits: [],
  },
];

function PlansPage({ isDark, toggleTheme }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('plus');

  const bg      = isDark
    ? 'radial-gradient(ellipse at 0% 0%, rgba(99,102,241,0.12) 0%, transparent 45%), #0A0A0B'
    : 'linear-gradient(180deg,#FAFAFF 0%,#F0EDFF 60%,#F8FAFC 100%)';
  const surface = isDark ? '#1b1c1e' : '#FFFFFF';
  const border  = isDark ? 'rgba(70,69,84,0.2)' : 'rgba(0,0,0,0.08)';
  const textPri = isDark ? '#e3e2e5' : '#0F172A';
  const textSec = isDark ? '#908fa0' : '#475569';

  return (
    <div className="min-h-screen font-body" style={{ background: bg, color: textPri }}>
      {/* Navbar */}
      <nav className="w-full h-16 px-8 sticky top-0 z-50 flex items-center justify-between"
        style={{ background: isDark ? 'rgba(10,10,11,0.9)' : 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${border}` }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#6366F1,#4F46E5)' }}>
            <span className="material-symbols-outlined text-white text-base">hub</span>
          </div>
          <span className="font-headline font-extrabold text-xl tracking-tighter" style={{ color: textPri }}>AlgoMind</span>
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-xs font-semibold flex items-center gap-1 hover:opacity-70" style={{ color: '#6366F1' }}>
            <span className="material-symbols-outlined text-sm">arrow_back</span> Back
          </button>
          <button onClick={toggleTheme}
            className="p-2 rounded-xl hover:opacity-70"
            style={{ background: isDark ? '#1b1c1e' : '#F1F5F9', border: `1px solid ${border}`, color: textPri }}>
            <span className="material-symbols-outlined text-lg">{isDark ? 'dark_mode' : 'light_mode'}</span>
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">

        {/* Hero */}
        <div className="text-center mb-16">
          <span className="inline-block text-[11px] font-bold uppercase tracking-widest mb-4 px-4 py-1.5 rounded-full"
            style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1' }}>
            Choose Your Plan
          </span>
          <h1 className="text-5xl font-headline font-extrabold tracking-tight mb-5" style={{ color: textPri }}>
            Unlock Your Full Potential
          </h1>
          <p className="text-lg max-w-xl mx-auto leading-relaxed" style={{ color: textSec }}>
            Start free, upgrade when you're ready. All plans give you access to AlgoMind's core learning engine.
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan) => {
            const isSelected = selected === plan.id;
            return (
              <div
                key={plan.id}
                className={`rounded-3xl flex flex-col overflow-hidden transition-all duration-300 cursor-pointer hover:scale-[1.02] card-3d
                  ${plan.popular ? 'plan-card-popular' : ''}`}
                style={{
                  background: surface,
                  border: isSelected
                    ? `2px solid ${plan.color}`
                    : `1px solid ${border}`,
                  boxShadow: isSelected
                    ? `0 20px 50px -15px ${plan.shadow}, 0 0 0 1px ${plan.color}22`
                    : isDark ? 'none' : '0 8px 30px -8px rgba(0,0,0,0.08)',
                  transform: isSelected ? 'scale(1.03)' : undefined,
                }}
                onClick={() => setSelected(plan.id)}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="text-center py-2 text-[10px] font-extrabold uppercase tracking-widest text-white"
                    style={{ background: plan.gradient }}>
                    ⭐ Most Popular
                  </div>
                )}

                <div className="p-7 flex flex-col flex-grow">
                  {/* Plan header */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{plan.icon}</span>
                      <div>
                        <h2 className="font-headline font-extrabold text-lg" style={{ color: textPri }}>{plan.name}</h2>
                        {plan.current && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase"
                            style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>
                            Current Plan
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-headline font-extrabold" style={{ color: plan.color }}>
                        {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                      </span>
                      <span className="text-sm mb-1" style={{ color: textSec }}>/ {plan.period}</span>
                    </div>
                  </div>

                  {/* Benefits placeholder */}
                  <div className="flex-grow mb-6">
                    <div className="rounded-2xl p-4 text-center"
                      style={{ background: isDark ? '#292a2c' : '#F8FAFC', border: `1px dashed ${border}` }}>
                      <span className="material-symbols-outlined text-2xl mb-2 block" style={{ color: textSec }}>construction</span>
                      <p className="text-xs" style={{ color: textSec }}>Benefits coming soon</p>
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    className="w-full py-4 rounded-2xl font-headline font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                    style={plan.current ? {
                      background: isDark ? '#292a2c' : '#F1F5F9',
                      color: textSec,
                      cursor: 'default',
                    } : {
                      background: plan.gradient,
                      color: '#FFFFFF',
                      boxShadow: `0 12px 30px -8px ${plan.shadow}`,
                    }}
                    disabled={plan.current}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="text-center mt-12">
          <p className="text-sm" style={{ color: textSec }}>
            🔒 Secure payments · Cancel anytime · No hidden fees
          </p>
          <button className="mt-4 text-xs font-semibold hover:opacity-70" style={{ color: '#6366F1' }} onClick={() => navigate('/support')}>
            Have questions? Contact support →
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlansPage;
