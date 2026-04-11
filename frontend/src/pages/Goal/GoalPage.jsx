import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import GoalNavbar    from '../../components/goal/GoalNavbar.jsx';
import GoalCard      from '../../components/goal/GoalCard.jsx';
import TimeSelector  from '../../components/goal/TimeSelector.jsx';

const GOALS = [
  {
    goalId:      'crack-placements',
    icon:        'rocket_launch',
    iconFilled:  false,
    title:       'Crack placements',
    description: 'Focus on high-frequency interview problems to land your dream role.',
  },
  {
    goalId:      'improve-solving',
    icon:        'psychology',
    iconFilled:  true,
    title:       'Improve problem solving',
    description: 'Strengthen your algorithmic thinking and master complex problems.',
  },
  {
    goalId:      'master-fundamentals',
    icon:        'architecture',
    iconFilled:  false,
    title:       'Master fundamentals',
    description: 'Build strong basics and understand data structures deeply from scratch.',
  },
];

function GoalPage({ isDark, toggleTheme }) {
  const navigate = useNavigate();
  const [selectedGoal, setSelectedGoal] = useState('improve-solving');
  const [selectedTime, setSelectedTime] = useState('2h');

  const handleContinue = () => {
    navigate('/plan', { state: { goal: selectedGoal, time: selectedTime } });
  };

  return (
    <div className="goal-page min-h-screen flex flex-col items-center justify-center font-body transition-colors duration-300"
      style={{ background: isDark
        ? 'radial-gradient(circle at 0% 0%, rgba(99,102,241,0.12) 0%, transparent 45%), radial-gradient(circle at 100% 100%, rgba(99,102,241,0.12) 0%, transparent 45%), radial-gradient(circle at 50% 50%, rgba(99,102,241,0.06) 0%, #0A0A0B 85%)'
        : 'linear-gradient(180deg, #FAFAFF 0%, #F0EDFF 50%, #F5F3FF 100%)'
      }}
    >
      <GoalNavbar isDark={isDark} toggleTheme={toggleTheme} />

      <main className="w-full max-w-[1200px] px-8 pt-40 pb-20 flex flex-col items-center">

        <header className="text-center mb-20 max-w-2xl">
          <h1 className="font-headline text-5xl font-extrabold tracking-tight mb-5 leading-tight"
            style={{ color: isDark ? '#e3e2e5' : '#0F172A' }}>
            Choose your goal
          </h1>
          <p className="text-lg opacity-90 leading-relaxed"
            style={{ color: isDark ? '#c7c4d7' : '#475569' }}>
            Tell us what you want to achieve — we'll build your personalized learning plan around it.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mb-24">
          {GOALS.map(goal => (
            <GoalCard
              key={goal.goalId}
              {...goal}
              isDark={isDark}
              isActive={selectedGoal === goal.goalId}
              onSelect={setSelectedGoal}
            />
          ))}
        </div>

        <TimeSelector selected={selectedTime} onSelect={setSelectedTime} isDark={isDark} />

        <div className="w-full max-w-sm">
          <button
            id="continue-btn"
            disabled={!selectedGoal}
            onClick={handleContinue}
            className={`w-full py-5 rounded-2xl font-headline font-extrabold text-lg tracking-tight transition-all shadow-xl active:scale-[0.98]
              ${!selectedGoal ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:brightness-110 hover:shadow-purple-500/40'}`}
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              color: '#FFFFFF',
              boxShadow: '0 20px 40px -10px rgba(99,102,241,0.4)'
            }}
          >
            Continue →
          </button>
        </div>

      </main>
    </div>
  );
}

export default GoalPage;
