import DashboardLayout from '../../components/layout/DashboardLayout.jsx';

const RESOURCES = [
  { category: 'Syntax Sheets', items: [
    { title: 'C++ STL Cheatsheet',        desc: 'All containers, iterators, algorithms with examples', icon: 'code', color: '#6366F1' },
    { title: 'Java Collections Guide',     desc: 'HashMap, TreeMap, PriorityQueue & more',             icon: 'coffee', color: '#F59E0B' },
    { title: 'Python DSA Syntax',          desc: 'List, dict, heapq, deque — quick reference',         icon: 'terminal', color: '#22C55E' },
  ]},
  { category: 'Algorithm Guides', items: [
    { title: 'Graph Algorithms PDF',       desc: 'BFS, DFS, Dijkstra, Bellman-Ford, Floyd-Warshall',   icon: 'account_tree', color: '#8B5CF6' },
    { title: 'Dynamic Programming Patterns', desc: '15 DP patterns with examples & code',              icon: 'psychology', color: '#EC4899' },
    { title: 'Binary Search Variants',     desc: 'All search space variations and templates',           icon: 'search', color: '#06B6D4' },
  ]},
  { category: 'Data Structures', items: [
    { title: 'Tree Structures Deep Dive',  desc: 'BST, AVL, Segment Tree, Fenwick Tree',               icon: 'park', color: '#22C55E' },
    { title: 'Hash Tables Internals',      desc: 'Collision resolution, open addressing, load factor', icon: 'grid_4x4', color: '#F59E0B' },
    { title: 'Heap & Priority Queue',      desc: 'Min-heap, max-heap, heapify operations',             icon: 'layers', color: '#EF4444' },
  ]},
];

function ResourcesPage({ theme, toggleTheme }) {
  const isDark  = theme === 'dark';
  const surface = isDark ? '#1b1c1e' : '#FFFFFF';
  const surfLow = isDark ? '#292a2c' : '#F8FAFC';
  const border  = isDark ? 'rgba(70,69,84,0.15)' : 'rgba(0,0,0,0.08)';
  const textPri = isDark ? '#e3e2e5' : '#0F172A';
  const textSec = isDark ? '#908fa0' : '#64748B';

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="space-y-10 max-w-5xl mx-auto">

        <div>
          <h1 className="text-3xl font-headline font-extrabold tracking-tight" style={{ color: textPri }}>Resources</h1>
          <p className="text-sm mt-1" style={{ color: textSec }}>PDFs, cheatsheets & guides for DSA preparation</p>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg" style={{ color: textSec }}>search</span>
          <input placeholder="Search resources..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl text-sm outline-none"
            style={{ background: surface, border: `1px solid ${border}`, color: textPri }} />
        </div>

        {RESOURCES.map(({ category, items }) => (
          <div key={category}>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: textSec }}>{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {items.map(({ title, desc, icon, color }) => (
                <div key={title}
                  className="resource-card rounded-2xl p-6 flex flex-col gap-4 cursor-pointer card-3d"
                  style={{ background: surface, border: `1px solid ${border}`, boxShadow: isDark ? 'none' : '0 4px 16px -4px rgba(0,0,0,0.06)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `${color}15` }}>
                    <span className="material-symbols-outlined text-2xl" style={{ color }}>{icon}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-headline font-bold mb-1" style={{ color: textPri }}>{title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: textSec }}>{desc}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-auto">
                    <div className="flex-grow h-1 rounded-full" style={{ background: `${color}20` }}>
                      <div className="h-full rounded-full w-full" style={{ background: `${color}40` }} />
                    </div>
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full"
                      style={{ background: `${color}15`, color }}>
                      Coming Soon
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* CTA */}
        <div className="rounded-2xl p-8 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))', border: '1px solid rgba(99,102,241,0.2)' }}>
          <span className="material-symbols-outlined text-4xl mb-3 block" style={{ color: '#6366F1' }}>upload_file</span>
          <h3 className="font-headline font-bold text-lg mb-2" style={{ color: textPri }}>Have a great resource?</h3>
          <p className="text-sm mb-4" style={{ color: textSec }}>Share it with the community and help others learn.</p>
          <button className="px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6366F1, #A855F7)' }}>
            Submit Resource
          </button>
        </div>

      </div>
    </DashboardLayout>
  );
}

export default ResourcesPage;
