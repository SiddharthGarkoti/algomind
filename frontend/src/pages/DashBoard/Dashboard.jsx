import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Sidebar from '../../components/Sidebar.jsx';
import Header from '../../components/Header.jsx';
import TaskCard from '../../components/TaskCard.jsx';
import RightPanel from '../../components/RightPanel.jsx';
import ChatDrawer from '../../components/chat/ChatDrawer.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../utils/api.js';

/* ── Curated LeetCode problems per topic slug ─────────────────────── */
const TOPIC_PROBLEMS = {
  'array': [
    { title: 'Two Sum', difficulty: 'easy', url: 'https://leetcode.com/problems/two-sum/', platform: 'leetcode' },
    { title: 'Best Time to Buy and Sell Stock', difficulty: 'easy', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', platform: 'leetcode' },
    { title: 'Container With Most Water', difficulty: 'medium', url: 'https://leetcode.com/problems/container-with-most-water/', platform: 'leetcode' },
  ],
  'arrays': [
    { title: 'Two Sum', difficulty: 'easy', url: 'https://leetcode.com/problems/two-sum/', platform: 'leetcode' },
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

const DIFF_ICON = { easy: 'account_tree', medium: 'route', hard: 'psychology' };
const DIFF_COLOR = { easy: '#22C55E', medium: '#6366F1', hard: '#EF4444' };

function getTimeOfDayGreeting(username) {
  let displayName = 'Engineer';
  if (username) {
    const raw = username.split('_')[0].split('.')[0];
    displayName = raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  const hour = new Date().getHours();

  if (hour >= 23 || hour < 5) {
    return {
      title: `Still up, ${displayName}?`,
      quote: 'The world sleeps. Engineers like you use the quiet to get ahead.',
    };
  }
  if (hour >= 5 && hour < 9) {
    return {
      title: `Early start, ${displayName}?`,
      quote: 'The morning is calm and clear. Perfect for tackling the hardest problem on your list.',
    };
  }
  if (hour >= 9 && hour < 12) {
    return {
      title: `Good morning, ${displayName}.`,
      quote: 'High focus, high momentum. Keep breaking down complex patterns into simple steps.',
    };
  }
  if (hour >= 12 && hour < 17) {
    return {
      title: `Good afternoon, ${displayName}.`,
      quote: 'Stay sharp. One clean solution at a time — quality and invariant thinking over speed.',
    };
  }
  return {
    title: `Good evening, ${displayName}.`,
    quote: 'Wrap up your day with a solid win. Review edge cases and refine your algorithmic intuition.',
  };
}

function Dashboard({ theme, toggleTheme }) {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const isDark = theme === 'dark';
  const greeting = getTimeOfDayGreeting(user?.username);

  const [chatFriend, setChatFriend] = useState(null);
  const [weakAreas, setWeakAreas] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [analyticsData, weakData] = await Promise.allSettled([
          api.get('/analytics/dashboard/'),
          api.get('/analytics/weak-areas/'),
        ]);

        if (analyticsData.status === 'fulfilled') {
          const platList = analyticsData.value?.platforms ?? [];
          const summ = analyticsData.value?.summary ?? null;
          setPlatforms(platList);
          setSummary(summ);
        }
        if (weakData.status === 'fulfilled') {
          setWeakAreas(weakData.value?.weak_areas ?? []);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user?.streak, updateUser]);

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
          title: p.title,
          difficulty: diff.charAt(0).toUpperCase() + diff.slice(1),
          category: topic.topic_name,
          icon: DIFF_ICON[diff] ?? 'code',
          iconColor: DIFF_COLOR[diff] ?? '#6366F1',
          diffColor: DIFF_COLOR[diff] ?? '#6366F1',
          href: p.url,
          platform: p.platform,
        });
      }
      if (tasks.length >= 3) break;
    }
    return tasks;
  })();

  const bg = isDark
    ? 'radial-gradient(ellipse at 15% 15%, rgba(99,102,241,0.06) 0%, transparent 45%), #0A0A0C'
    : 'linear-gradient(180deg,#F8FAFC 0%,#EEF2FF 100%)';
  const surface = isDark ? 'rgba(255, 255, 255, 0.035)' : 'rgba(255, 255, 255, 0.85)';
  const surfaceLo = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(241, 245, 249, 0.6)';
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)';
  const textPri = isDark ? '#F8FAFC' : '#0F172A';
  const textSec = isDark ? '#94A3B8' : '#64748B';



  return (
    <div className="dashboard-layout min-h-screen flex" style={{ background: bg, color: textPri }}>
      <Sidebar isDark={isDark} navigate={navigate} onOpenChat={handleOpenChat} />

      <div className="flex-grow flex flex-col min-h-screen overflow-x-hidden">
        <div className="main-container flex flex-col flex-grow">
          <Header theme={theme} toggleTheme={toggleTheme} onOpenChat={handleOpenChat} />

          <main className="w-full px-6 py-5 flex gap-6 flex-grow">

            {/* Left Column */}
            <div className="flex-grow flex flex-col gap-6 min-w-0">

              {/* Dynamic Time-of-Day Greeting & Quote */}
              <div className="pt-1 pb-1">
                <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight" style={{ color: textPri }}>
                  {greeting.title}
                </h1>
                <p className="text-sm sm:text-base font-normal mt-1.5 leading-relaxed" style={{ color: textSec }}>
                  {greeting.quote}
                </p>
              </div>

              {/* Priority Action Point — Apple Hero Card */}
              <section className="relative overflow-hidden rounded-2xl p-6 sm:p-7 border backdrop-blur-xl shrink-0"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.03) 100%), rgba(255, 255, 255, 0.02)'
                    : 'linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(168, 85, 247, 0.02) 100%), #FFFFFF',
                  borderColor: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(99, 102, 241, 0.15)',
                  boxShadow: isDark ? '0 4px 24px -2px rgba(0,0,0,0.3)' : '0 4px 20px -4px rgba(0,0,0,0.06)'
                }}>
                <div className="relative z-10">
                  {loading ? (
                    <div className="space-y-3">
                      <div className="h-4 rounded-full w-32 animate-pulse" style={{ background: surfaceLo }} />
                      <div className="h-6 rounded-full w-3/4 animate-pulse" style={{ background: surfaceLo }} />
                    </div>
                  ) : hasWeak ? (
                    <>
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-3"
                        style={{ background: 'rgba(99,102,241,0.12)', color: '#818CF8' }}>
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                        Priority Focus Area
                      </div>
                      <h1 className="font-headline font-bold leading-snug max-w-2xl"
                        style={{ fontSize: '1.25rem', color: textPri }}>
                        Strengthen your understanding of{' '}
                        <span className="px-2 py-0.5 rounded-lg font-bold" style={{ background: 'rgba(99,102,241,0.15)', color: '#818CF8' }}>
                          {topWeak.topic_name}
                        </span>
                        {' '}— {topWeak.problems_solved} problem{topWeak.problems_solved !== 1 ? 's' : ''} solved so far.
                      </h1>
                      <div className="flex items-center gap-3 mt-5 flex-wrap">
                        <button
                          className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                          style={{ background: '#6366F1', color: '#fff' }}
                          onClick={() => window.open(`https://leetcode.com/tag/${topWeak.topic_slug}/`, '_blank', 'noopener noreferrer')}>
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                          Solve {topWeak.topic_name} on LeetCode
                        </button>
                        <button
                          className="px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80 cursor-pointer"
                          style={{ background: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9', color: textPri, border: `1px solid ${border}` }}
                          onClick={() => navigate('/analytics')}>
                          View Full Analysis
                        </button>
                      </div>
                    </>
                  ) : platforms.length === 0 ? (
                    <>
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-3"
                        style={{ background: 'rgba(99,102,241,0.12)', color: '#818CF8' }}>
                        <span className="material-symbols-outlined text-sm">link</span>
                        Get Started
                      </div>
                      <h1 className="font-headline font-bold leading-snug max-w-2xl"
                        style={{ fontSize: '1.25rem', color: textPri }}>
                        Connect your LeetCode or Codeforces account to get personalised insights.
                      </h1>
                      <div className="flex items-center gap-3 mt-4">
                        <button
                          className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all hover:opacity-90 cursor-pointer"
                          style={{ background: '#6366F1', color: '#fff' }}
                          onClick={() => navigate('/settings')}>
                          <span className="material-symbols-outlined text-sm">settings</span>
                          Connect Platforms
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-3"
                        style={{ background: 'rgba(168,85,247,0.12)', color: '#A855F7' }}>
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        Consistent Performance
                      </div>
                      <h1 className="font-headline font-bold leading-snug max-w-2xl"
                        style={{ fontSize: '1.25rem', color: textPri }}>
                        Solid progress across your connected profiles. Keep solving to elevate your ranking.
                      </h1>
                      <div className="flex items-center gap-3 mt-4">
                        <button
                          className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all hover:opacity-90 cursor-pointer"
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

              {/* Recommended Problems — Apple Grouped Container */}
              <div className="space-y-3">
                <div className="flex items-end justify-between px-1">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight" style={{ color: textPri }}>Recommended Problems</h2>
                    <p className="text-xs font-normal mt-0.5" style={{ color: textSec }}>
                      {hasWeak
                        ? `Targeted practice for ${topWeak.topic_name} and your current focus areas`
                        : 'Curated problems to accelerate your algorithmic pattern recognition'}
                    </p>
                  </div>
                  <button
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90 active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
                    style={{ background: '#6366F1', color: '#FFFFFF' }}
                    onClick={() => navigate('/plan-view')}>
                    <span>Start Daily Plan</span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                </div>

                <div className="rounded-2xl overflow-hidden border backdrop-blur-xl"
                  style={{ background: surface, borderColor: border, boxShadow: isDark ? '0 4px 20px -2px rgba(0,0,0,0.3)' : '0 4px 16px -4px rgba(0,0,0,0.06)' }}>
                  {loading ? (
                    <div className="p-5 space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: surfaceLo }} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {recommendedTasks.map((task, i) => (
                        <div
                          key={i}
                          className={`p-4 sm:px-5 flex items-center justify-between transition-colors hover:bg-white/[0.02] group ${i < recommendedTasks.length - 1 ? 'border-b' : ''
                            }`}
                          style={{
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                          }}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818CF8' }}>
                              <span className="material-symbols-outlined text-lg">{task.icon || 'code'}</span>
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-semibold truncate group-hover:text-indigo-400 transition-colors" style={{ color: textPri }}>
                                {task.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs px-2 py-0.5 rounded font-medium"
                                  style={{
                                    background: task.difficulty.toLowerCase() === 'easy' ? 'rgba(99, 102, 241, 0.12)'
                                      : task.difficulty.toLowerCase() === 'medium' ? 'rgba(168, 85, 247, 0.12)' : 'rgba(192, 132, 252, 0.12)',
                                    color: task.difficulty.toLowerCase() === 'easy' ? '#818CF8'
                                      : task.difficulty.toLowerCase() === 'medium' ? '#A855F7' : '#C084FC',
                                  }}>
                                  {task.difficulty}
                                </span>
                                <span className="text-xs" style={{ color: textSec }}>{task.category}</span>
                                {task.platform && (
                                  <span className="text-xs px-1.5 py-0.5 rounded capitalize" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: textSec }}>
                                    {task.platform}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => window.open(task.href, '_blank', 'noopener noreferrer')}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all hover:opacity-90 active:scale-95 cursor-pointer shrink-0 ml-3"
                            style={{ background: '#6366F1', color: '#FFFFFF' }}>
                            <span>Solve</span>
                            <span className="material-symbols-outlined text-xs">open_in_new</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>



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
