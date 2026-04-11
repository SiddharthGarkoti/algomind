import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';

/* ── Weak-area learning topics ── */
const WEAK_TOPICS = [
  {
    id: 'dp',
    name: 'Dynamic Programming',
    priority: 'Weak Area 1',
    theory: {
      title: 'Breaking Big Problems Into Smaller Ones',
      body: `Dynamic Programming (DP) is a method for solving complex problems by breaking them into overlapping subproblems and storing results to avoid redundant computation.

The two key properties that make DP applicable: **Optimal Substructure** — an optimal solution can be built from optimal solutions of its subproblems, and **Overlapping Subproblems** — the same subproblems are solved multiple times.

**Two approaches:** Top-down (Memoization) adds a cache to your recursive solution. Bottom-up (Tabulation) builds the answer iteratively from the base case upward.

Start by identifying: What is the state? What is the recurrence? What are the base cases?`,
      keyIdeas: ['Identify state variables', 'Write the recurrence relation', 'Handle base cases first', 'Optimize space if needed'],
    },
    compulsory: [
      {
        id: 'dp-1', title: 'Climbing Stairs', difficulty: 'Easy', platform: 'LeetCode', number: 70,
        link: 'https://leetcode.com/problems/climbing-stairs/',
        hint: 'Think about how many ways you can reach step n — it depends on step n-1 and n-2. This is the Fibonacci pattern in disguise.',
        explanation: 'f(n) = f(n-1) + f(n-2) with f(1)=1, f(2)=2. You only need two variables, no full array needed.',
      },
      {
        id: 'dp-2', title: 'House Robber', difficulty: 'Easy', platform: 'LeetCode', number: 198,
        link: 'https://leetcode.com/problems/house-robber/',
        hint: 'At each house, choose: rob it (add its value + skip prev) or skip it. State = max loot up to house i.',
        explanation: 'dp[i] = max(dp[i-1], dp[i-2] + nums[i]). Space-optimise to O(1) using two variables.',
      },
      {
        id: 'dp-3', title: 'Coin Change', difficulty: 'Medium', platform: 'LeetCode', number: 322,
        link: 'https://leetcode.com/problems/coin-change/',
        hint: 'Build dp[0..amount] where dp[i] = min coins needed. For each amount, try every coin denomination.',
        explanation: 'dp[i] = min(dp[i - coin] + 1) for each coin ≤ i. Init dp[0]=0, rest=Infinity.',
      },
    ],
    optional: [
      {
        id: 'dp-4', title: 'Longest Increasing Subsequence', difficulty: 'Hard', platform: 'LeetCode', number: 300,
        link: 'https://leetcode.com/problems/longest-increasing-subsequence/',
      },
      {
        id: 'dp-5', title: 'Edit Distance', difficulty: 'Hard', platform: 'LeetCode', number: 72,
        link: 'https://leetcode.com/problems/edit-distance/',
      },
    ],
  },
  {
    id: 'graphs',
    name: 'Graphs & Search',
    priority: 'Weak Area 2',
    theory: {
      title: 'Navigating Connections — BFS, DFS & Beyond',
      body: `A graph is a set of nodes connected by edges. Graphs model almost anything: social networks, maps, dependency chains, state machines.

**BFS (Breadth-First Search)** explores level by level using a queue. It finds the shortest path in an unweighted graph. **DFS (Depth-First Search)** dives deep using a stack or recursion — great for detecting cycles, topological sort, and connected components.

**Key representations:** Adjacency List (space-efficient for sparse graphs) and Adjacency Matrix (O(1) edge lookup but O(V²) space).

Always track visited nodes to prevent infinite loops. For weighted shortest paths, use Dijkstra's algorithm with a min-heap.`,
      keyIdeas: ['BFS for shortest path', 'DFS for connectivity & cycles', 'Always track visited', 'Adjacency list for sparse graphs'],
    },
    compulsory: [
      {
        id: 'g-1', title: 'Number of Islands', difficulty: 'Easy', platform: 'LeetCode', number: 200,
        link: 'https://leetcode.com/problems/number-of-islands/',
        hint: 'Treat the grid as a graph. When you find land, DFS/BFS to mark the whole island as visited.',
        explanation: 'Iterate grid. On \'1\', increment count and flood-fill all connected \'1\'s by setting them to \'0\'.',
      },
      {
        id: 'g-2', title: 'Flood Fill', difficulty: 'Easy', platform: 'LeetCode', number: 733,
        link: 'https://leetcode.com/problems/flood-fill/',
        hint: 'Classic DFS on a 2D grid. Spread to 4-directional neighbours that match the source color.',
        explanation: 'Recursively paint each matching neighbour. Guard: if source color == new color, return early.',
      },
      {
        id: 'g-3', title: 'Rotting Oranges', difficulty: 'Medium', platform: 'LeetCode', number: 994,
        link: 'https://leetcode.com/problems/rotting-oranges/',
        hint: 'Multi-source BFS from all initially rotten oranges simultaneously. Time = BFS levels.',
        explanation: 'Seed queue with all rotten oranges, then BFS spreading rot each minute. Count fresh at end.',
      },
    ],
    optional: [
      {
        id: 'g-4', title: 'Word Ladder', difficulty: 'Hard', platform: 'LeetCode', number: 127,
        link: 'https://leetcode.com/problems/word-ladder/',
      },
    ],
  },
  {
    id: 'bits',
    name: 'Bit Manipulation',
    priority: 'Weak Area 3',
    theory: {
      title: 'Working Directly With Binary',
      body: `Bit manipulation operates on integers at the binary level using bitwise operators. It's the key to elegant O(1) or O(log n) solutions for problems that seem to need O(n).

**Core operators:** AND (&) masks bits, OR (|) sets bits, XOR (^) toggles bits and cancels duplicates, NOT (~) flips, Left shift (<<) multiplies by 2, Right shift (>>) divides by 2.

**Signature tricks:** n & (n-1) clears the lowest set bit — use this to count set bits or check power of 2. XOR of a number with itself is 0 — use this to find the single non-duplicate in O(n) time and O(1) space.`,
      keyIdeas: ['n & (n-1) clears lowest bit', 'XOR cancels duplicates', 'Shift = multiply/divide by 2', 'Masking extracts specific bits'],
    },
    compulsory: [
      {
        id: 'b-1', title: 'Number of 1 Bits', difficulty: 'Easy', platform: 'LeetCode', number: 191,
        link: 'https://leetcode.com/problems/number-of-1-bits/',
        hint: 'Loop: n & (n-1) removes the lowest set bit. Count iterations until n is zero.',
        explanation: 'while(n) { count++; n = n & (n-1); } — runs in O(number of set bits).',
      },
      {
        id: 'b-2', title: 'Single Number', difficulty: 'Easy', platform: 'LeetCode', number: 136,
        link: 'https://leetcode.com/problems/single-number/',
        hint: 'XOR all elements. Pairs cancel (a ^ a = 0). The lone element remains.',
        explanation: 'return nums.reduce((acc, n) => acc ^ n, 0) — one line, O(n) time, O(1) space.',
      },
      {
        id: 'b-3', title: 'Sum of Two Integers', difficulty: 'Medium', platform: 'LeetCode', number: 371,
        link: 'https://leetcode.com/problems/sum-of-two-integers/',
        hint: 'XOR gives the sum without carry. AND shifted left gives the carry. Repeat until carry is 0.',
        explanation: 'while(b) { carry = (a & b) << 1; a = a ^ b; b = carry; } return a;',
      },
    ],
    optional: [
      {
        id: 'b-4', title: 'Reverse Bits', difficulty: 'Hard', platform: 'LeetCode', number: 190,
        link: 'https://leetcode.com/problems/reverse-bits/',
      },
    ],
  },
];

const DIFF_COLOR = { Easy: '#22C55E', Medium: '#F59E0B', Hard: '#EF4444' };

/* ── Single problem row ── */
function ProblemRow({ problem, isDone, onToggle, isDark, border, textPri, textSec, onAsk }) {
  const [drawer, setDrawer] = useState(null); // 'hint' | 'explain' | null

  const diffColor = DIFF_COLOR[problem.difficulty];

  return (
    <div
      className="rounded-2xl overflow-hidden transition-colors"
      style={{
        background: isDone
          ? (isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.04)')
          : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
        border: `1px solid ${isDone ? 'rgba(99,102,241,0.2)' : border}`,
      }}
    >
      {/* Row */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{
            background: isDone ? '#6366F1' : 'transparent',
            border: `2px solid ${isDone ? '#6366F1' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)')}`,
          }}
        >
          {isDone && (
            <span
              className="material-symbols-outlined text-white"
              style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}
            >
              check
            </span>
          )}
        </button>

        {/* Info */}
        <div className="flex-grow min-w-0">
          <p
            className="text-sm font-semibold"
            style={{
              color: isDone ? textSec : textPri,
              textDecoration: isDone ? 'line-through' : 'none',
            }}
          >
            {problem.number ? `#${problem.number} · ` : ''}{problem.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-bold" style={{ color: diffColor }}>{problem.difficulty}</span>
            <span style={{ color: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)' }}>·</span>
            <span className="text-[10px]" style={{ color: textSec }}>{problem.platform}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {problem.hint && (
            <button
              onClick={() => setDrawer(drawer === 'hint' ? null : 'hint')}
              className="text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: drawer === 'hint'
                  ? 'rgba(99,102,241,0.15)'
                  : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                color: drawer === 'hint' ? '#6366F1' : textSec,
                border: `1px solid ${drawer === 'hint' ? 'rgba(99,102,241,0.3)' : border}`,
              }}
            >
              Hint
            </button>
          )}
          <button
            onClick={onAsk}
            className="text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            style={{
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              color: textSec,
              border: `1px solid ${border}`,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
            Ask
          </button>
          <a
            href={problem.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-75 flex items-center gap-1"
            style={{
              background: 'rgba(99,102,241,0.1)',
              color: '#6366F1',
              border: '1px solid rgba(99,102,241,0.25)',
            }}
          >
            Solve
            <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>open_in_new</span>
          </a>
        </div>
      </div>

      {/* Drawer */}
      {drawer && (
        <div
          className="px-5 pb-4"
          style={{ borderTop: `1px solid ${border}` }}
        >
          <div
            className="rounded-xl px-4 py-3 mt-3"
            style={{
              background: isDark ? 'rgba(99,102,241,0.07)' : 'rgba(99,102,241,0.05)',
              border: '1px solid rgba(99,102,241,0.15)',
            }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: '#6366F1' }}
            >
              {drawer === 'hint' ? 'Hint' : 'Explanation'}
            </p>
            <p className="text-[12px] leading-relaxed" style={{ color: textSec }}>
              {drawer === 'hint' ? problem.hint : problem.explanation}
            </p>
            {drawer === 'hint' && problem.explanation && (
              <button
                onClick={() => setDrawer('explain')}
                className="mt-2.5 text-[10px] font-bold hover:opacity-75 transition-opacity"
                style={{ color: '#6366F1' }}
              >
                Show full explanation →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */

function PlanViewPage({ theme, toggleTheme }) {
  const isDark   = theme === 'dark';
  const navigate = useNavigate();

  const [topicIdx, setTopicIdx] = useState(0);
  const [done,     setDone]     = useState(new Set());

  const topic  = WEAK_TOPICS[topicIdx];
  const isLast = topicIdx === WEAK_TOPICS.length - 1;

  const textPri = isDark ? '#e3e2e5' : '#0F172A';
  const textSec = isDark ? '#908fa0' : '#64748B';
  const border  = isDark ? 'rgba(70,69,84,0.18)' : 'rgba(0,0,0,0.07)';
  const surface = isDark ? '#1b1c1e' : '#FFFFFF';

  const toggleDone = (id) =>
    setDone(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const compDone    = topic.compulsory.filter(p => done.has(p.id)).length;
  const allCompDone = compDone === topic.compulsory.length;

  const goNext = () => {
    if (!isLast) {
      setTopicIdx(i => i + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/dashboard');
    }
  };

  const rowProps = { isDark, border, textPri, textSec, onAsk: () => navigate('/chatbot') };

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="max-w-3xl mx-auto pb-20">

        {/* ── Topic strip ── */}
        <div className="flex items-center gap-2 mb-10 flex-wrap">
          {WEAK_TOPICS.map((t, i) => {
            const isActive = i === topicIdx;
            const isPast   = i < topicIdx;
            return (
              <button
                key={t.id}
                onClick={() => setTopicIdx(i)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all"
                style={{
                  background: isActive
                    ? '#6366F1'
                    : isPast
                      ? (isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)')
                      : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
                  color: isActive ? '#fff' : isPast ? '#6366F1' : textSec,
                  border: `1px solid ${isActive ? 'transparent' : isPast ? 'rgba(99,102,241,0.25)' : border}`,
                  boxShadow: isActive ? '0 4px 14px -4px rgba(99,102,241,0.55)' : 'none',
                }}
              >
                {isPast && (
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1", color: '#6366F1' }}
                  >
                    check_circle
                  </span>
                )}
                <span className="opacity-50 mr-0.5">{t.priority} ·</span>
                {t.name}
              </button>
            );
          })}
        </div>

        {/* ── Theory ── */}
        <section className="mb-12">
          <div className="flex items-start gap-4 mb-6">
            <div
              className="shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center mt-0.5"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(99,102,241,0.06))'
                  : 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(99,102,241,0.04))',
                border: '1px solid rgba(99,102,241,0.22)',
                boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.06)' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
              }}
            >
              <span className="material-symbols-outlined" style={{ color: '#6366F1', fontSize: '18px' }}>
                menu_book
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#6366F1' }}>
                Core Concept
              </p>
              <h2
                className="text-2xl font-headline font-extrabold tracking-tight"
                style={{ color: textPri }}
              >
                {topic.theory.title}
              </h2>
            </div>
          </div>

          {/* Theory body */}
          <div
            className="rounded-2xl p-6 mb-5"
            style={{
              background: surface,
              border: `1px solid ${border}`,
              boxShadow: isDark
                ? '0 8px 24px -8px rgba(0,0,0,0.35)'
                : '0 8px 24px -8px rgba(99,102,241,0.07)',
            }}
          >
            <p
              className="text-sm leading-[1.95] whitespace-pre-line"
              style={{ color: textSec }}
              dangerouslySetInnerHTML={{
                __html: topic.theory.body.replace(
                  /\*\*(.*?)\*\*/g,
                  `<strong style="color:${textPri};font-weight:700">$1</strong>`
                ),
              }}
            />

            {/* Key ideas */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {topic.theory.keyIdeas.map((idea, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{
                    background: isDark ? 'rgba(99,102,241,0.07)' : 'rgba(99,102,241,0.05)',
                    border: '1px solid rgba(99,102,241,0.14)',
                  }}
                >
                  <span
                    className="material-symbols-outlined shrink-0"
                    style={{ fontSize: '14px', color: '#6366F1', fontVariationSettings: "'FILL' 1" }}
                  >
                    lightbulb
                  </span>
                  <span className="text-[11px] font-medium" style={{ color: textPri }}>{idea}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Explore More */}
          <button
            onClick={() => navigate('/chatbot')}
            className="flex items-center gap-2 text-sm font-bold transition-opacity hover:opacity-70"
            style={{ color: '#6366F1' }}
          >
            <span
              className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.2)',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '15px', fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
            </span>
            Explore more with AI Mentor
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
          </button>
        </section>

        {/* ── Compulsory problems ── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: textSec }}>
                Compulsory
              </p>
              <h3 className="text-lg font-headline font-extrabold" style={{ color: textPri }}>
                Practice Problems
              </h3>
            </div>
            <span
              className="text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors"
              style={{
                background: allCompDone
                  ? 'rgba(34,197,94,0.1)'
                  : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                color: allCompDone ? '#22C55E' : textSec,
                border: `1px solid ${allCompDone ? 'rgba(34,197,94,0.25)' : border}`,
              }}
            >
              {compDone}/{topic.compulsory.length} done
            </span>
          </div>

          <div className="space-y-3">
            {topic.compulsory.map(p => (
              <ProblemRow
                key={p.id}
                problem={p}
                isDone={done.has(p.id)}
                onToggle={() => toggleDone(p.id)}
                {...rowProps}
              />
            ))}
          </div>

          <p className="mt-3 text-[11px]" style={{ color: textSec }}>
            Click the circle to mark complete · Hint for a nudge · Ask for AI guidance
          </p>
        </section>

        {/* ── Optional problems ── */}
        {topic.optional.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-grow h-px" style={{ background: border }} />
              <p
                className="text-[10px] font-bold uppercase tracking-widest shrink-0"
                style={{ color: textSec }}
              >
                Optional — Push Further
              </p>
              <div className="flex-grow h-px" style={{ background: border }} />
            </div>

            <div className="space-y-3">
              {topic.optional.map(p => (
                <ProblemRow
                  key={p.id}
                  problem={p}
                  isDone={done.has(p.id)}
                  onToggle={() => toggleDone(p.id)}
                  {...rowProps}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Next CTA ── */}
        <div
          className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(99,102,241,0.04) 100%)'
              : 'linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(99,102,241,0.02) 100%)',
            border: '1px solid rgba(99,102,241,0.2)',
            boxShadow: isDark
              ? 'inset 0 1px 0 rgba(255,255,255,0.04)'
              : 'inset 0 1px 0 rgba(255,255,255,0.9)',
          }}
        >
          <div>
            {!allCompDone && (
              <p className="text-[10px] font-bold mb-1" style={{ color: '#F59E0B' }}>
                Complete all required problems to continue
              </p>
            )}
            <p className="text-sm font-bold" style={{ color: textPri }}>
              {isLast
                ? 'All weak areas covered — well done!'
                : `Up next: ${WEAK_TOPICS[topicIdx + 1].name}`}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: textSec }}>
              {isLast
                ? 'Head back to your dashboard and start applying'
                : WEAK_TOPICS[topicIdx + 1].priority}
            </p>
          </div>

          <button
            onClick={goNext}
            disabled={!allCompDone}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              boxShadow: allCompDone ? '0 8px 20px -6px rgba(99,102,241,0.5)' : 'none',
              opacity: allCompDone ? 1 : 0.4,
              cursor: allCompDone ? 'pointer' : 'not-allowed',
            }}
          >
            {isLast ? 'Finish Plan' : 'Next Topic'}
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {isLast ? 'check_circle' : 'arrow_forward'}
            </span>
          </button>
        </div>

      </div>
    </DashboardLayout>
  );
}

export default PlanViewPage;
