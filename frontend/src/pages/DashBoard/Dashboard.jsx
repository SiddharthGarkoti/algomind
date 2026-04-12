import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Sidebar    from '../../components/Sidebar.jsx';
import Header     from '../../components/Header.jsx';
import TaskCard   from '../../components/TaskCard.jsx';
import RightPanel from '../../components/RightPanel.jsx';
import ChatDrawer from '../../components/chat/ChatDrawer.jsx';
import api from '../../utils/api.js';

/* ── Curated LeetCode problems per topic slug ─────────────────────── */
const TOPIC_PROBLEMS = {
  'array': [
    { title: 'Two Sum', difficulty: 'easy',   url: 'https://leetcode.com/problems/two-sum/', platform: 'leetcode' },
    { title: 'Best Time to Buy and Sell Stock', difficulty: 'easy', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', platform: 'leetcode' },
    { title: 'Container With Most Water', difficulty: 'medium', url: 'https://leetcode.com/problems/container-with-most-water/', platform: 'leetcode' },
  ],
  'arrays': [
    { title: 'Two Sum', difficulty: 'easy',   url: 'https://leetcode.com/problems/two-sum/', platform: 'leetcode' },
    { title: 'Maximum Subarray', difficulty: 'medium', url: 'https://leetcode.com/problems/maximum-subarray/', platform: 'leetcode' },
    { title: 'Product of Array Except Self', difficulty: 'medium', url: 'https://leetcode.com/problems/product-of-array-except-self/', platform: 'leetcode' },
  ],
  'string': [
    { title: 'Valid Anagram', difficulty: 'easy', url: 'https://leetcode.com/problems/valid-anagram/', platform: 'leetcode' },
    { title: 'Longest Substring Without Repeating Characters', difficulty: 'medium', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', platform: 'leetcode' },
    { title: 'Longest Palindromic Substring', difficulty: 'medium', url: 'https://leetcode.com/problems/longest-palindromic-substring/', platform: 'leetcode' },
  ],
  'strings': [
    { title: 'Valid Anagram', difficulty: 'easy', url: 'https://leetcode.com/problems/valid-anagram/', platform: 'leetcode' },
    { title: 'Longest Substring Without Repeating Characters', difficulty: 'medium', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', platform: 'leetcode' },
    { title: 'Group Anagrams', difficulty: 'medium', url: 'https://leetcode.com/problems/group-anagrams/', platform: 'leetcode' },
  ],
  'dynamic-programming': [
    { title: 'Climbing Stairs', difficulty: 'easy', url: 'https://leetcode.com/problems/climbing-stairs/', platform: 'leetcode' },
    { title: 'Coin Change', difficulty: 'medium', url: 'https://leetcode.com/problems/coin-change/', platform: 'leetcode' },
    { title: 'Longest Common Subsequence', difficulty: 'medium', url: 'https://leetcode.com/problems/longest-common-subsequence/', platform: 'leetcode' },
  ],
  'dp': [
    { title: 'Climbing Stairs', difficulty: 'easy', url: 'https://leetcode.com/problems/climbing-stairs/', platform: 'leetcode' },
    { title: 'House Robber', difficulty: 'medium', url: 'https://leetcode.com/problems/house-robber/', platform: 'leetcode' },
    { title: 'Unique Paths', difficulty: 'medium', url: 'https://leetcode.com/problems/unique-paths/', platform: 'leetcode' },
  ],
  'graph': [
    { title: 'Number of Islands', difficulty: 'medium', url: 'https://leetcode.com/problems/number-of-islands/', platform: 'leetcode' },
    { title: 'Clone Graph', difficulty: 'medium', url: 'https://leetcode.com/problems/clone-graph/', platform: 'leetcode' },
    { title: 'Course Schedule', difficulty: 'medium', url: 'https://leetcode.com/problems/course-schedule/', platform: 'leetcode' },
  ],
  'graphs': [
    { title: 'Number of Islands', difficulty: 'medium', url: 'https://leetcode.com/problems/number-of-islands/', platform: 'leetcode' },
    { title: 'Course Schedule', difficulty: 'medium', url: 'https://leetcode.com/problems/course-schedule/', platform: 'leetcode' },
    { title: 'Pacific Atlantic Water Flow', difficulty: 'medium', url: 'https://leetcode.com/problems/pacific-atlantic-water-flow/', platform: 'leetcode' },
  ],
  'tree': [
    { title: 'Maximum Depth of Binary Tree', difficulty: 'easy', url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', platform: 'leetcode' },
    { title: 'Invert Binary Tree', difficulty: 'easy', url: 'https://leetcode.com/problems/invert-binary-tree/', platform: 'leetcode' },
    { title: 'Binary Tree Level Order Traversal', difficulty: 'medium', url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', platform: 'leetcode' },
  ],
  'trees': [
    { title: 'Maximum Depth of Binary Tree', difficulty: 'easy', url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', platform: 'leetcode' },
    { title: 'Lowest Common Ancestor of BST', difficulty: 'medium', url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/', platform: 'leetcode' },
    { title: 'Construct Binary Tree from Preorder and Inorder', difficulty: 'medium', url: 'https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/', platform: 'leetcode' },
  ],
  'linked-list': [
    { title: 'Reverse Linked List', difficulty: 'easy', url: 'https://leetcode.com/problems/reverse-linked-list/', platform: 'leetcode' },
    { title: 'Merge Two Sorted Lists', difficulty: 'easy', url: 'https://leetcode.com/problems/merge-two-sorted-lists/', platform: 'leetcode' },
    { title: 'Linked List Cycle', difficulty: 'easy', url: 'https://leetcode.com/problems/linked-list-cycle/', platform: 'leetcode' },
  ],
  'hash-table': [
    { title: 'Two Sum', difficulty: 'easy', url: 'https://leetcode.com/problems/two-sum/', platform: 'leetcode' },
    { title: 'Group Anagrams', difficulty: 'medium', url: 'https://leetcode.com/problems/group-anagrams/', platform: 'leetcode' },
    { title: 'Top K Frequent Elements', difficulty: 'medium', url: 'https://leetcode.com/problems/top-k-frequent-elements/', platform: 'leetcode' },
  ],
  'binary-search': [
    { title: 'Binary Search', difficulty: 'easy', url: 'https://leetcode.com/problems/binary-search/', platform: 'leetcode' },
    { title: 'Search in Rotated Sorted Array', difficulty: 'medium', url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/', platform: 'leetcode' },
    { title: 'Find Minimum in Rotated Sorted Array', difficulty: 'medium', url: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/', platform: 'leetcode' },
  ],
  'stack': [
    { title: 'Valid Parentheses', difficulty: 'easy', url: 'https://leetcode.com/problems/valid-parentheses/', platform: 'leetcode' },
    { title: 'Min Stack', difficulty: 'medium', url: 'https://leetcode.com/problems/min-stack/', platform: 'leetcode' },
    { title: 'Daily Temperatures', difficulty: 'medium', url: 'https://leetcode.com/problems/daily-temperatures/', platform: 'leetcode' },
  ],
  'queue': [
    { title: 'Implement Queue using Stacks', difficulty: 'easy', url: 'https://leetcode.com/problems/implement-queue-using-stacks/', platform: 'leetcode' },
    { title: 'Design Circular Queue', difficulty: 'medium', url: 'https://leetcode.com/problems/design-circular-queue/', platform: 'leetcode' },
    { title: 'Sliding Window Maximum', difficulty: 'hard', url: 'https://leetcode.com/problems/sliding-window-maximum/', platform: 'leetcode' },
  ],
  'sorting': [
    { title: 'Sort Colors', difficulty: 'medium', url: 'https://leetcode.com/problems/sort-colors/', platform: 'leetcode' },
    { title: 'Merge Intervals', difficulty: 'medium', url: 'https://leetcode.com/problems/merge-intervals/', platform: 'leetcode' },
    { title: 'Kth Largest Element in an Array', difficulty: 'medium', url: 'https://leetcode.com/problems/kth-largest-element-in-an-array/', platform: 'leetcode' },
  ],
  'greedy': [
    { title: 'Jump Game', difficulty: 'medium', url: 'https://leetcode.com/problems/jump-game/', platform: 'leetcode' },
    { title: 'Gas Station', difficulty: 'medium', url: 'https://leetcode.com/problems/gas-station/', platform: 'leetcode' },
    { title: 'Task Scheduler', difficulty: 'medium', url: 'https://leetcode.com/problems/task-scheduler/', platform: 'leetcode' },
  ],
  'backtracking': [
    { title: 'Subsets', difficulty: 'medium', url: 'https://leetcode.com/problems/subsets/', platform: 'leetcode' },
    { title: 'Permutations', difficulty: 'medium', url: 'https://leetcode.com/problems/permutations/', platform: 'leetcode' },
    { title: 'Combination Sum', difficulty: 'medium', url: 'https://leetcode.com/problems/combination-sum/', platform: 'leetcode' },
  ],
  'heap': [
    { title: 'Kth Largest Element in a Stream', difficulty: 'easy', url: 'https://leetcode.com/problems/kth-largest-element-in-a-stream/', platform: 'leetcode' },
    { title: 'Find Median from Data Stream', difficulty: 'hard', url: 'https://leetcode.com/problems/find-median-from-data-stream/', platform: 'leetcode' },
    { title: 'Top K Frequent Elements', difficulty: 'medium', url: 'https://leetcode.com/problems/top-k-frequent-elements/', platform: 'leetcode' },
  ],
  'trie': [
    { title: 'Implement Trie (Prefix Tree)', difficulty: 'medium', url: 'https://leetcode.com/problems/implement-trie-prefix-tree/', platform: 'leetcode' },
    { title: 'Word Search II', difficulty: 'hard', url: 'https://leetcode.com/problems/word-search-ii/', platform: 'leetcode' },
    { title: 'Design Add and Search Words Data Structure', difficulty: 'medium', url: 'https://leetcode.com/problems/design-add-and-search-words-data-structure/', platform: 'leetcode' },
  ],
  'sliding-window': [
    { title: 'Longest Substring Without Repeating Characters', difficulty: 'medium', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', platform: 'leetcode' },
    { title: 'Minimum Window Substring', difficulty: 'hard', url: 'https://leetcode.com/problems/minimum-window-substring/', platform: 'leetcode' },
    { title: 'Sliding Window Maximum', difficulty: 'hard', url: 'https://leetcode.com/problems/sliding-window-maximum/', platform: 'leetcode' },
  ],
  'two-pointers': [
    { title: '3Sum', difficulty: 'medium', url: 'https://leetcode.com/problems/3sum/', platform: 'leetcode' },
    { title: 'Container With Most Water', difficulty: 'medium', url: 'https://leetcode.com/problems/container-with-most-water/', platform: 'leetcode' },
    { title: 'Trapping Rain Water', difficulty: 'hard', url: 'https://leetcode.com/problems/trapping-rain-water/', platform: 'leetcode' },
  ],
  'recursion': [
    { title: 'Climbing Stairs', difficulty: 'easy', url: 'https://leetcode.com/problems/climbing-stairs/', platform: 'leetcode' },
    { title: 'Flatten Nested List Iterator', difficulty: 'medium', url: 'https://leetcode.com/problems/flatten-nested-list-iterator/', platform: 'leetcode' },
    { title: 'Merge Sort', difficulty: 'medium', url: 'https://leetcode.com/problems/sort-an-array/', platform: 'leetcode' },
  ],
  'math': [
    { title: 'Palindrome Number', difficulty: 'easy', url: 'https://leetcode.com/problems/palindrome-number/', platform: 'leetcode' },
    { title: 'Reverse Integer', difficulty: 'medium', url: 'https://leetcode.com/problems/reverse-integer/', platform: 'leetcode' },
    { title: 'Pow(x, n)', difficulty: 'medium', url: 'https://leetcode.com/problems/powx-n/', platform: 'leetcode' },
  ],
  'bit-manipulation': [
    { title: 'Single Number', difficulty: 'easy', url: 'https://leetcode.com/problems/single-number/', platform: 'leetcode' },
    { title: 'Number of 1 Bits', difficulty: 'easy', url: 'https://leetcode.com/problems/number-of-1-bits/', platform: 'leetcode' },
    { title: 'Counting Bits', difficulty: 'easy', url: 'https://leetcode.com/problems/counting-bits/', platform: 'leetcode' },
  ],
  'matrix': [
    { title: 'Rotate Image', difficulty: 'medium', url: 'https://leetcode.com/problems/rotate-image/', platform: 'leetcode' },
    { title: 'Spiral Matrix', difficulty: 'medium', url: 'https://leetcode.com/problems/spiral-matrix/', platform: 'leetcode' },
    { title: 'Set Matrix Zeroes', difficulty: 'medium', url: 'https://leetcode.com/problems/set-matrix-zeroes/', platform: 'leetcode' },
  ],
  // Codeforces-style tags
  'implementation': [
    { title: 'Watermelon', difficulty: 'easy', url: 'https://codeforces.com/problemset/problem/4/A', platform: 'codeforces' },
    { title: 'Way Too Long Words', difficulty: 'easy', url: 'https://codeforces.com/problemset/problem/71/A', platform: 'codeforces' },
    { title: 'Anton and Danik', difficulty: 'easy', url: 'https://codeforces.com/problemset/problem/734/A', platform: 'codeforces' },
  ],
  'brute-force': [
    { title: 'Helpful Maths', difficulty: 'easy', url: 'https://codeforces.com/problemset/problem/339/A', platform: 'codeforces' },
    { title: 'Team', difficulty: 'easy', url: 'https://codeforces.com/problemset/problem/231/A', platform: 'codeforces' },
    { title: 'Next Round', difficulty: 'easy', url: 'https://codeforces.com/problemset/problem/158/A', platform: 'codeforces' },
  ],
  'expression-parsing': [
    { title: 'Basic Calculator', difficulty: 'hard', url: 'https://leetcode.com/problems/basic-calculator/', platform: 'leetcode' },
    { title: 'Basic Calculator II', difficulty: 'medium', url: 'https://leetcode.com/problems/basic-calculator-ii/', platform: 'leetcode' },
    { title: 'Evaluate Reverse Polish Notation', difficulty: 'medium', url: 'https://leetcode.com/problems/evaluate-reverse-polish-notation/', platform: 'leetcode' },
  ],
  'brainteaser': [
    { title: 'Nim Game', difficulty: 'easy', url: 'https://leetcode.com/problems/nim-game/', platform: 'leetcode' },
    { title: 'Bulb Switcher', difficulty: 'medium', url: 'https://leetcode.com/problems/bulb-switcher/', platform: 'leetcode' },
    { title: 'Flip Game II', difficulty: 'medium', url: 'https://leetcode.com/problems/flip-game-ii/', platform: 'leetcode' },
  ],
};

/* Get problems for a topic slug — tries exact match, then partial match */
function getProblemsForTopic(slug) {
  const clean = slug.toLowerCase().replace(/\s+/g, '-');
  if (TOPIC_PROBLEMS[clean]) return TOPIC_PROBLEMS[clean];
  // Partial match
  const key = Object.keys(TOPIC_PROBLEMS).find(k => clean.includes(k) || k.includes(clean));
  if (key) return TOPIC_PROBLEMS[key];
  // Fallback: link to LeetCode topic search
  return [{
    title: `Practice ${slug} problems`,
    difficulty: 'medium',
    url: `https://leetcode.com/tag/${clean}/`,
    platform: 'leetcode',
  }];
}

const DIFF_ICON  = { easy: 'account_tree', medium: 'route', hard: 'psychology' };
const DIFF_COLOR = { easy: '#22C55E', medium: '#6366F1', hard: '#EF4444' };

function Dashboard({ theme, toggleTheme }) {
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [chatFriend, setChatFriend] = useState(null);
  const [weakAreas,  setWeakAreas]  = useState([]);
  const [platforms,  setPlatforms]  = useState([]);
  const [summary,    setSummary]    = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [analyticsData, weakData] = await Promise.allSettled([
          api.get('/analytics/dashboard/'),
          api.get('/analytics/weak-areas/'),
        ]);

        if (analyticsData.status === 'fulfilled') {
          setPlatforms(analyticsData.value?.platforms ?? []);
          setSummary(analyticsData.value?.summary ?? null);
        }
        if (weakData.status === 'fulfilled') {
          setWeakAreas(weakData.value?.weak_areas ?? []);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleOpenChat = (friend) => setChatFriend(friend);

  const topWeak = weakAreas.find(t => t.status === 'weak');
  const hasWeak = !!topWeak;

  /* Build recommended tasks from the top weak areas, with real LeetCode/CF links */
  const recommendedTasks = (() => {
    const weakTopics = weakAreas.filter(t => t.status === 'weak' || t.status === 'improving').slice(0, 3);
    if (weakTopics.length === 0) {
      // Default curated problems when no platforms connected
      return [
        { title: 'Two Sum', difficulty: 'easy', category: 'Arrays', icon: 'account_tree', iconColor: '#22C55E', diffColor: '#22C55E', href: 'https://leetcode.com/problems/two-sum/', platform: 'leetcode' },
        { title: 'Longest Substring Without Repeating Characters', difficulty: 'medium', category: 'Sliding Window', icon: 'route', iconColor: '#6366F1', diffColor: '#6366F1', href: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', platform: 'leetcode' },
        { title: 'Maximum Depth of Binary Tree', difficulty: 'easy', category: 'Trees', icon: 'account_tree', iconColor: '#22C55E', diffColor: '#22C55E', href: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', platform: 'leetcode' },
      ];
    }
    // Pick one problem from each weak topic
    const tasks = [];
    for (const topic of weakTopics) {
      const probs = getProblemsForTopic(topic.topic_slug);
      if (probs.length > 0) {
        const p = probs[0];
        const diff = p.difficulty;
        tasks.push({
          title:     p.title,
          difficulty: diff.charAt(0).toUpperCase() + diff.slice(1),
          category:  topic.topic_name,
          icon:      DIFF_ICON[diff] ?? 'code',
          iconColor: DIFF_COLOR[diff] ?? '#6366F1',
          diffColor: DIFF_COLOR[diff] ?? '#6366F1',
          href:      p.url,
          platform:  p.platform,
        });
      }
      if (tasks.length >= 3) break;
    }
    return tasks;
  })();

  const bg       = isDark
    ? 'radial-gradient(ellipse at 10% 10%, rgba(99,102,241,0.08) 0%, transparent 40%), #0A0A0B'
    : 'linear-gradient(180deg,#EEF2FF 0%,#F8FAFC 100%)';
  const surface   = isDark ? '#1b1c1e' : '#FFFFFF';
  const surfaceLo = isDark ? '#1F2022' : '#F8FAFC';
  const border    = isDark ? 'rgba(70,69,84,0.12)' : 'rgba(0,0,0,0.07)';
  const textPri   = isDark ? '#e3e2e5' : '#0F172A';
  const textSec   = isDark ? '#908fa0' : '#64748B';

  /* Mastery overview — filter out any residual *broken tags */
  const skills = weakAreas
    .filter(t => !t.topic_name.startsWith('*') && !t.topic_slug.startsWith('*'))
    .slice(0, 6)
    .map((t, i) => {
      const max = Math.max(...weakAreas.map(x => x.problems_solved), 1);
      const pct = Math.max(5, Math.round((t.problems_solved / max) * 100));
      const isWeak     = t.status === 'weak';
      const isStrength = t.status === 'strength';
      return {
        id:         i,
        name:       t.topic_name,
        badge:      isStrength ? 'Strong' : isWeak ? 'Weak' : 'Improving',
        badgeColor: isStrength ? '#22C55E' : isWeak ? '#EF4444' : '#6366F1',
        subtitle:   `${t.problems_solved} problem${t.problems_solved !== 1 ? 's' : ''} solved`,
        barColor:   isStrength ? '#22C55E' : isWeak ? '#EF4444' : '#6366F1',
        progress:   `${pct}%`,
        topicSlug:  t.topic_slug,
      };
    });

  return (
    <div className="dashboard-layout min-h-screen flex" style={{ background: bg, color: textPri }}>
      <Sidebar isDark={isDark} navigate={navigate} onOpenChat={handleOpenChat} />

      <div className="flex-grow flex flex-col min-h-screen overflow-x-hidden">
        <div className="main-container flex flex-col flex-grow">
          <Header theme={theme} toggleTheme={toggleTheme} onOpenChat={handleOpenChat} />

          <main className="w-full px-6 py-5 flex gap-6 flex-grow">

            {/* Left Column */}
            <div className="flex-grow flex flex-col gap-6 min-w-0">

              {/* Summary Stats Bar — only when platforms connected or loading */}
              {(loading || (summary && summary.platforms_connected > 0)) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
                  {[
                    { label: 'Problems Solved', value: summary?.total_problems_solved ?? 0, icon: 'check_circle', color: '#22C55E' },
                    { label: 'Contests',         value: summary?.total_contests ?? 0,        icon: 'emoji_events',  color: '#F59E0B' },
                    { label: 'Avg Rating',       value: summary?.average_rating ?? 0,        icon: 'star',          color: '#6366F1' },
                    { label: 'Platforms',        value: summary?.platforms_connected ?? 0,   icon: 'link',          color: '#A855F7' },
                  ].map(({ label, value, icon, color }) => (
                    <div key={label} className="rounded-xl p-4 flex items-center gap-3"
                      style={{ background: surface, border: `1px solid ${border}`,
                        boxShadow: isDark ? 'none' : '0 2px 12px -4px rgba(0,0,0,0.06)' }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${color}18`, color }}>
                        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-wider truncate" style={{ color: textSec }}>{label}</p>
                        {loading
                          ? <div className="h-5 w-12 rounded animate-pulse mt-0.5" style={{ background: surfaceLo }} />
                          : <p className="text-base font-bold leading-tight" style={{ color: textPri }}>
                              {value > 0 ? value.toLocaleString() : (label === 'Avg Rating' ? '—' : value)}
                            </p>
                        }
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Priority Action Point */}
              <section className="insight-banner relative overflow-hidden rounded-2xl p-7 shrink-0"
                style={{ background: isDark ? surfaceLo : '#FFFFFF', border: `1px solid ${border}`,
                  boxShadow: isDark ? 'none' : '0 4px 20px -4px rgba(0,0,0,0.06)' }}>
                <div className="accent-line" />
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-50"
                  style={{ background: 'radial-gradient(circle at 100% 50%, rgba(99,102,241,0.15) 0%, transparent 60%)' }} />

                <div className="relative z-10 pl-4">
                  {loading ? (
                    <div className="space-y-3">
                      <div className="h-4 rounded-full w-32 animate-pulse" style={{ background: surfaceLo }} />
                      <div className="h-6 rounded-full w-3/4 animate-pulse" style={{ background: surfaceLo }} />
                    </div>
                  ) : hasWeak ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-label uppercase tracking-widest mb-3 px-3 py-1 rounded-full insight-slide"
                        style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1', animationDelay: '0.1s' }}>
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings:"'FILL' 1" }}>bolt</span>
                        Priority Action Point
                      </span>
                      <h1 className="font-headline font-bold leading-snug max-w-2xl insight-slide"
                        style={{ fontSize: '1.25rem', color: textPri, animationDelay: '0.2s' }}>
                        Your weakest area is{' '}
                        <span className="px-1.5 py-0.5 rounded-lg" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1' }}>
                          {topWeak.topic_name}
                        </span>
                        {' '}— only{' '}
                        <span style={{ color: '#EF4444', fontWeight: 800 }}>{topWeak.problems_solved} problem{topWeak.problems_solved !== 1 ? 's' : ''}</span>
                        {' '}solved.
                      </h1>
                      <div className="flex items-center gap-3 mt-4 insight-slide" style={{ animationDelay: '0.3s' }}>
                        <button
                          className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all hover:scale-[1.03] active:scale-95"
                          style={{ background: '#6366F1', color: '#fff' }}
                          onClick={() => window.open(`https://leetcode.com/tag/${topWeak.topic_slug}/`, '_blank', 'noopener noreferrer')}>
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                          Practice {topWeak.topic_name} on LeetCode
                        </button>
                        <button
                          className="px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-70"
                          style={{ background: isDark ? '#292a2c' : '#F1F5F9', color: textSec, border: `1px solid ${border}` }}
                          onClick={() => navigate('/analytics')}>
                          View Full Analysis
                        </button>
                      </div>
                    </>
                  ) : platforms.length === 0 ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-label uppercase tracking-widest mb-3 px-3 py-1 rounded-full"
                        style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1' }}>
                        <span className="material-symbols-outlined text-sm">link</span>
                        Get Started
                      </span>
                      <h1 className="font-headline font-bold leading-snug max-w-2xl"
                        style={{ fontSize: '1.25rem', color: textPri }}>
                        Connect your LeetCode or Codeforces account to get personalised insights.
                      </h1>
                      <div className="flex items-center gap-3 mt-4">
                        <button
                          className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all hover:scale-[1.03]"
                          style={{ background: '#6366F1', color: '#fff' }}
                          onClick={() => navigate('/settings')}>
                          <span className="material-symbols-outlined text-sm">settings</span>
                          Connect Platforms
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-label uppercase tracking-widest mb-3 px-3 py-1 rounded-full"
                        style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings:"'FILL' 1" }}>check_circle</span>
                        Looking Good
                      </span>
                      <h1 className="font-headline font-bold leading-snug max-w-2xl"
                        style={{ fontSize: '1.25rem', color: textPri }}>
                        Solid progress! Keep solving problems to unlock detailed weak-area analysis.
                      </h1>
                      <div className="flex items-center gap-3 mt-4">
                        <button
                          className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all hover:scale-[1.03]"
                          style={{ background: '#6366F1', color: '#fff' }}
                          onClick={() => window.open('https://leetcode.com/problemset/', '_blank', 'noopener noreferrer')}>
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                          Solve on LeetCode
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* Recommended Tasks */}
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-base font-headline font-bold" style={{ color: textPri }}>Recommended Tasks</h2>
                    <p className="text-xs font-normal mt-0.5" style={{ color: textSec }}>
                      {hasWeak
                        ? `Focused on your weak areas — click to solve on LeetCode / Codeforces`
                        : 'Top problems to get you started — click to solve'}
                    </p>
                  </div>
                  <button
                    className="px-5 py-2.5 rounded-xl font-label text-xs font-bold transition-all hover:scale-[1.03] active:scale-95 flex items-center gap-2"
                    style={{ background: '#6366F1', color: '#FFFFFF', boxShadow: '0 8px 20px -6px rgba(99,102,241,0.35)' }}
                    onClick={() => navigate('/plan-view')}>
                    Start Daily Plan
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>

                {loading ? (
                  <div className="space-y-2.5">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: surface }} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {recommendedTasks.map((task, i) => (
                      <div key={i} className={`task-card-anim stagger-${i + 1}`}>
                        <TaskCard
                          title={task.title}
                          difficulty={task.difficulty}
                          category={task.category}
                          icon={task.icon}
                          iconColor={task.iconColor}
                          diffBg={`${task.diffColor}18`}
                          diffColor={task.diffColor}
                          href={task.href}
                          platform={task.platform}
                          isDark={isDark}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mastery Overview */}
              {skills.length > 0 && (
                <div className="p-6 rounded-2xl"
                  style={{ background: surface, border: `1px solid ${border}`, boxShadow: isDark ? 'none' : '0 4px 16px -4px rgba(0,0,0,0.06)' }}>
                  <h3 className="text-xs font-label uppercase tracking-widest mb-6" style={{ color: textSec }}>Mastery Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-7 max-w-4xl">
                    {skills.map((skill, i) => (
                      <div key={skill.id}
                        className={`space-y-3 page-enter stagger-${i + 1} cursor-pointer group`}
                        onClick={() => window.open(`https://leetcode.com/tag/${skill.topicSlug}/`, '_blank', 'noopener noreferrer')}
                        title={`Practice ${skill.name} on LeetCode`}>
                        <div className="flex justify-between items-end">
                          <div>
                            <span className="text-sm font-headline font-bold flex items-center gap-2 group-hover:underline" style={{ color: textPri }}>
                              {skill.name}
                              <span className="text-[9px] font-label uppercase" style={{ color: skill.badgeColor }}>
                                ({skill.badge})
                              </span>
                            </span>
                            <p className="text-[10px] mt-0.5" style={{ color: textSec }}>{skill.subtitle}</p>
                          </div>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: isDark ? '#292a2c' : '#E2E8F0' }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: skill.progress, background: skill.barColor }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fallback when no topic data yet */}
              {!loading && skills.length === 0 && platforms.length > 0 && (
                <div className="p-6 rounded-2xl text-center"
                  style={{ background: surface, border: `1px solid ${border}` }}>
                  <p className="text-sm" style={{ color: textSec }}>
                    Topic analysis loading — refresh analytics after connecting platforms.
                  </p>
                </div>
              )}

            </div>

            {/* Right Panel */}
            <RightPanel isDark={isDark} summary={summary} weakAreas={weakAreas} loading={loading} />
          </main>
        </div>
      </div>

      {/* Chat Drawer */}
      {chatFriend && (
        <>
          <div className="fixed inset-0 z-[299] bg-black/30 backdrop-blur-sm"
            onClick={() => setChatFriend(null)} />
          <ChatDrawer
            friend={chatFriend}
            onClose={() => setChatFriend(null)}
            isDark={isDark}
          />
        </>
      )}
    </div>
  );
}

export default Dashboard;
