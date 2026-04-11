const TIME_OPTIONS = [
  { id: '1h',  label: '1 hour'   },
  { id: '2h',  label: '2 hours'  },
  { id: '3h+', label: '3+ hours' },
];

function TimeSelector({ selected, onSelect, isDark }) {
  return (
    <section className="w-full max-w-lg flex flex-col gap-6 items-center mb-20">
      <label className="font-label text-xs uppercase tracking-[0.2em] font-bold"
        style={{ color: isDark ? '#908fa0' : '#64748B' }}>
        Daily time commitment (optional)
      </label>
      <div className="flex gap-4 w-full">
        {TIME_OPTIONS.map(({ id, label }) => {
          const isActive = selected === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className="flex-1 py-4 px-2 rounded-xl transition-all duration-300 active:scale-95 text-base font-semibold"
              style={isActive ? {
                border: '2px solid #6366F1',
                background: 'rgba(99,102,241,0.12)',
                color: '#6366F1',
                boxShadow: '0 8px 20px -6px rgba(99,102,241,0.2)',
                fontWeight: '700',
              } : {
                border: isDark ? '1px solid rgba(70,69,84,0.4)' : '1px solid rgba(0,0,0,0.1)',
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)',
                color: isDark ? '#c7c4d7' : '#374151',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default TimeSelector;
