import { useState, useEffect } from 'react';

const ALL_TOPICS = [
  "Arrays", "Strings", "Linked List", "Stack", "Queue", "Hashing",
  "Recursion", "Backtracking", "Trees", "Binary Search Trees",
  "Heaps / Priority Queue", "Greedy", "Sliding Window", "Two Pointers",
  "Prefix Sum", "Bit Manipulation", "Graphs", "Dynamic Programming",
  "Tries", "Segment Trees", "Fenwick Tree (BIT)", "Disjoint Set Union (DSU)",
  "Topological Sort", "Shortest Path Algorithms", "Pattern Recognition",
  "Optimization Problems", "Simulation", "Mathematical Problems",
  "String Matching", "Game Theory",
];

function TopicsModal({ isOpen, currentSelection, initialTopics, onClose, onApply, isDark }) {
  // Keep selection as a Set for O(1) lookups
  const [selected, setSelected] = useState(new Set(currentSelection));
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelected(new Set(currentSelection));
      setSearch('');
    }
  }, [isOpen]);         // only reset when modal opens

  if (!isOpen) return null;

  const surface    = isDark ? '#1F2022' : '#FFFFFF';
  const surfaceLow = isDark ? '#1b1c1e' : '#F8FAFC';
  const inputBg    = isDark ? '#292a2c' : '#F1F5F9';
  const border     = isDark ? 'rgba(70,69,84,0.25)' : 'rgba(0,0,0,0.08)';
  const textPri    = isDark ? '#e3e2e5' : '#0F172A';
  const textSec    = isDark ? '#908fa0' : '#64748B';

  const toggle = (topic) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(topic)) {
        if (next.size <= 3) return prev;       // keep minimum 3
        next.delete(topic);
      } else {
        next.add(topic);
      }
      return next;
    });
  };

  const handleApply = () => {
    const arr = [...selected];
    onApply(arr, []);  // no "newly added" distinction — all selected look the same
    onClose();
  };

  const handleReset = () => setSelected(new Set(initialTopics));

  const filtered = search.trim()
    ? ALL_TOPICS.filter(t => t.toLowerCase().includes(search.toLowerCase()))
    : ALL_TOPICS;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 200 }}
    >
      <div
        className="w-full max-w-2xl rounded-[2rem] shadow-2xl flex flex-col page-enter"
        style={{ background: surface, border: `1px solid ${border}`, maxHeight: '88vh' }}
      >
        {/* Header */}
        <div className="p-7 pb-4 space-y-5 shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-headline font-extrabold tracking-tight" style={{ color: textPri }}>
                Curriculum Customisation
              </h2>
              <p className="text-xs mt-1" style={{ color: textSec }}>
                {selected.size} topics selected (minimum 3)
              </p>
            </div>
            <button
              className="p-2 rounded-full transition-all hover:opacity-70"
              style={{ background: surfaceLow, color: textSec }}
              onClick={onClose}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg" style={{ color: textSec }}>search</span>
            <input
              type="text"
              placeholder="Search DSA topics..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              className="w-full rounded-2xl py-3.5 pl-12 pr-5 text-sm outline-none"
              style={{ background: inputBg, border: `1px solid ${border}`, color: textPri }}
            />
          </div>
        </div>

        {/* Topics grid */}
        <div className="flex-grow overflow-y-auto px-7 py-2 custom-scrollbar">
          <div className="flex flex-wrap gap-2 pb-4">
            {filtered.map(topic => {
              const active = selected.has(topic);
              return (
                <button
                  key={topic}
                  onClick={() => toggle(topic)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                  style={active ? {
                    background: 'rgba(99,102,241,0.15)',
                    border: '1.5px solid #6366F1',
                    color: '#6366F1',
                    fontWeight: '700',
                  } : {
                    background: surfaceLow,
                    border: `1px solid ${border}`,
                    color: textSec,
                  }}
                >
                  {active && <span className="mr-1">✓</span>}
                  {topic}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-sm py-6 text-center w-full" style={{ color: textSec }}>No topics match your search.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-7 pt-5 flex gap-3 shrink-0" style={{ borderTop: `1px solid ${border}` }}>
          <button
            className="flex-grow py-4 rounded-2xl font-bold text-sm text-white transition-all hover:scale-[1.01] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,#6366F1,#4F46E5)', boxShadow: '0 10px 25px -8px rgba(99,102,241,0.4)' }}
            onClick={handleApply}
          >
            Apply {selected.size} Topics
          </button>
          <button
            className="px-7 rounded-2xl font-bold text-sm transition-all hover:opacity-80"
            style={{ background: surfaceLow, border: `1px solid ${border}`, color: textPri }}
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export default TopicsModal;
