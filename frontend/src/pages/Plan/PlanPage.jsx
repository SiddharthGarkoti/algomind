import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PlanNavbar     from '../../components/plan/PlanNavbar.jsx';
import StatsCard      from '../../components/plan/StatsCard.jsx';
import PlanCustomizer from '../../components/plan/PlanCustomizer.jsx';
import TopicsModal    from '../../components/plan/TopicsModal.jsx';

const INITIAL_TOPICS = ['Graphs', 'Dynamic Programming', 'Arrays', 'Trees', 'Strings'];

function PlanPage({ isDark, toggleTheme }) {
  const navigate = useNavigate();

  const [platform,         setPlatform]         = useState('lc');
  const [intensity,        setIntensity]        = useState('Balanced');
  const [currentSelection, setCurrentSelection] = useState([...INITIAL_TOPICS]);
  const [isModalOpen,      setIsModalOpen]      = useState(false);

  const handleTopicClick = (topicName) => {
    setCurrentSelection(prev => {
      if (prev.length <= 3) return prev;
      return prev.filter(t => t !== topicName);
    });
  };

  // From modal: receive flat array, no recentlyAdded distinction
  const handleApply = (newSelection) => {
    setCurrentSelection(newSelection);
  };

  const handleUsePlan = () => {
    const el = document.querySelector('main');
    if (el) { el.style.transition = 'opacity 0.45s ease'; el.style.opacity = '0'; }
    setTimeout(() => navigate('/dashboard'), 450);
  };

  return (
    <div
      className="plan-page min-h-screen flex flex-col transition-colors duration-300"
      style={{
        background: isDark
          ? 'radial-gradient(ellipse at 0% 0%, rgba(99,102,241,0.1) 0%, transparent 40%), radial-gradient(ellipse at 100% 100%, rgba(139,92,246,0.08) 0%, transparent 40%), #0A0A0B'
          : 'linear-gradient(180deg, #FAFAFF 0%, #F0EDFF 50%, #F5F3FF 100%)',
      }}
    >
      <PlanNavbar isDark={isDark} toggleTheme={toggleTheme} />

      <main className="flex-grow w-full max-w-[1100px] mx-auto flex flex-col space-y-12 px-6 py-10 lg:px-12">
        <header className="space-y-3">
          <h1
            className="font-headline text-4xl lg:text-5xl font-extrabold tracking-tighter"
            style={{ color: isDark ? '#e3e2e5' : '#0F172A' }}
          >
            Your Personalized Plan.
          </h1>
          <p className="max-w-xl text-lg font-light leading-relaxed" style={{ color: isDark ? '#908fa0' : '#475569' }}>
            We've analyzed your performance to calibrate a curriculum focused on high-growth potential areas.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <StatsCard platform={platform} onSwitch={setPlatform} isDark={isDark} />
          <PlanCustomizer
            intensity={intensity}
            onIntensity={setIntensity}
            currentSelection={currentSelection}
            onTopicClick={handleTopicClick}
            onOpenModal={() => setIsModalOpen(true)}
            onUsePlan={handleUsePlan}
            onCustomize={() => setIsModalOpen(true)}
            isDark={isDark}
          />
        </div>
      </main>

      <TopicsModal
        isOpen={isModalOpen}
        currentSelection={currentSelection}
        initialTopics={INITIAL_TOPICS}
        onClose={() => setIsModalOpen(false)}
        onApply={handleApply}
        isDark={isDark}
      />
    </div>
  );
}

export default PlanPage;
