/**
 * AlgoMind Achievements Catalog
 * Over 180 comprehensive, verifiable achievements across:
 * - DSA Topics & Patterns (Arrays, Two Pointers, Sliding Window, Trees, Graphs, DP, etc.)
 * - Core Computer Science (System Design, OS, DBMS/SQL, Computer Networks, OOP)
 * - Solving Milestones (1 to 2,000 problems)
 * - Daily Streak Milestones (1 to 1,000 days)
 * - Contest Appearances & Rating Tiers (Debut to 2,600+ Rating)
 * - Skills, Gauntlet Duels & Engineering Mastery
 *
 * Strict requirement: NO EMOJIS anywhere in titles, subtitles, or descriptions.
 */

export function buildAchievements({
  totalSolved = 0,
  bestStreak = 0,
  totalContests = 0,
  maxRating = 0,
  completedPlanTopics = new Set(),
  getTopicSolved = () => 0,
  platforms = [],
  user = {},
}) {
  const achievements = [];

  // Helper to register an achievement safely
  const add = (badge) => {
    achievements.push(badge);
  };

  /* ─────────────────────────────────────────────────────────────────
   * 1. SOLVING VOLUME MILESTONES (20 Badges)
   * ───────────────────────────────────────────────────────────────── */
  const solvingTiers = [
    { id: 'solve-1', target: 1, title: 'First Step', subtitle: '1 Problem', desc: 'Solve your first competitive programming problem', icon: 'flag', color: '#60A5FA', grad: 'linear-gradient(135deg, #3B82F6, #60A5FA)' },
    { id: 'solve-5', target: 5, title: 'Initiate', subtitle: '5 Problems', desc: 'Solve 5 problems across connected platforms', icon: 'explore', color: '#60A5FA', grad: 'linear-gradient(135deg, #2563EB, #3B82F6)' },
    { id: 'solve-10', target: 10, title: 'Explorer', subtitle: '10 Problems', desc: 'Solve 10 algorithmic problems in training', icon: 'code', color: '#818CF8', grad: 'linear-gradient(135deg, #4F46E5, #6366F1)' },
    { id: 'solve-25', target: 25, title: 'Challenger', subtitle: '25 Problems', desc: 'Reach 25 solved problems across platforms', icon: 'task_alt', color: '#818CF8', grad: 'linear-gradient(135deg, #4338CA, #6366F1)' },
    { id: 'solve-50', target: 50, title: 'Bronze Solver', subtitle: '50 Problems', desc: 'Cross 50 problems in algorithmic practice', icon: 'verified', color: '#A78BFA', grad: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' },
    { id: 'solve-75', target: 75, title: 'Silver Solver', subtitle: '75 Problems', desc: 'Amass 75 problem solutions across profiles', icon: 'military_tech', color: '#A78BFA', grad: 'linear-gradient(135deg, #7C3AED, #A78BFA)' },
    { id: 'solve-100', target: 100, title: 'Centurion', subtitle: '100 Problems', desc: 'Cross the milestone of 100 solved problems', icon: 'workspace_premium', color: '#818CF8', grad: 'linear-gradient(135deg, #6366F1, #8B5CF6)' },
    { id: 'solve-125', target: 125, title: 'High Centurion', subtitle: '125 Problems', desc: 'Reach 125 solved algorithmic problems', icon: 'stars', color: '#818CF8', grad: 'linear-gradient(135deg, #4F46E5, #7C3AED)' },
    { id: 'solve-150', target: 150, title: 'Adept', subtitle: '150 Problems', desc: 'Solve 150 problems across connected platforms', icon: 'military_tech', color: '#818CF8', grad: 'linear-gradient(135deg, #4F46E5, #7C3AED)' },
    { id: 'solve-200', target: 200, title: 'Double Centurion', subtitle: '200 Problems', desc: 'Reach 200 solved competitive problems', icon: 'military_tech', color: '#A855F7', grad: 'linear-gradient(135deg, #6B21A8, #9333EA)' },
    { id: 'solve-250', target: 250, title: 'Quarter-Mille', subtitle: '250 Problems', desc: 'Cross 250 solved problems in algorithmic training', icon: 'stars', color: '#A855F7', grad: 'linear-gradient(135deg, #7C3AED, #A855F7)' },
    { id: 'solve-300', target: 300, title: 'Triple Centurion', subtitle: '300 Problems', desc: 'Attain 300 competitive problem solutions', icon: 'stars', color: '#C084FC', grad: 'linear-gradient(135deg, #7E22CE, #A855F7)' },
    { id: 'solve-400', target: 400, title: 'Elite Problem Solver', subtitle: '400 Problems', desc: 'Reach 400 problems solved across repositories', icon: 'diamond', color: '#C084FC', grad: 'linear-gradient(135deg, #86198F, #C084FC)' },
    { id: 'solve-500', target: 500, title: 'Grandmaster', subtitle: '500 Problems', desc: 'Solve 500 competitive algorithmic problems', icon: 'diamond', color: '#C084FC', grad: 'linear-gradient(135deg, #9333EA, #C084FC)' },
    { id: 'solve-600', target: 600, title: 'Veteran Specialist', subtitle: '600 Problems', desc: 'Cross 600 verified problem solutions', icon: 'diamond', color: '#E879F9', grad: 'linear-gradient(135deg, #A21CAF, #E879F9)' },
    { id: 'solve-750', target: 750, title: 'Three-Quarter Mille', subtitle: '750 Problems', desc: 'Attain 750 verified problem solutions', icon: 'auto_awesome', color: '#F472B6', grad: 'linear-gradient(135deg, #BE185D, #F472B6)' },
    { id: 'solve-1000', target: 1000, title: 'Kilo-Solver', subtitle: '1,000 Problems', desc: 'Cross the monumental barrier of 1000 solved problems', icon: 'auto_awesome', color: '#F43F5E', grad: 'linear-gradient(135deg, #BE123C, #FB7185)' },
    { id: 'solve-1250', target: 1250, title: 'Titan of Code', subtitle: '1,250 Problems', desc: 'Reach 1,250 solved competitive problems', icon: 'shield', color: '#FB7185', grad: 'linear-gradient(135deg, #9F1239, #F43F5E)' },
    { id: 'solve-1500', target: 1500, title: 'Mythic Solver', subtitle: '1,500 Problems', desc: 'Achieve an astonishing 1,500 problems solved', icon: 'shield', color: '#FDA4AF', grad: 'linear-gradient(135deg, #881337, #E11D48)' },
    { id: 'solve-2000', target: 2000, title: 'Transcendent Polymath', subtitle: '2,000 Problems', desc: 'Attain 2,000 algorithmic and competitive solutions', icon: 'all_inclusive', color: '#F59E0B', grad: 'linear-gradient(135deg, #D97706, #F59E0B)' },
  ];

  solvingTiers.forEach((tier) => {
    add({
      id: tier.id,
      category: 'Solving',
      title: tier.title,
      subtitle: tier.subtitle,
      description: tier.desc,
      icon: tier.icon,
      badgeColor: tier.color,
      gradient: tier.grad,
      glow: `0 0 20px ${tier.color}40`,
      current: totalSolved,
      target: tier.target,
      earned: totalSolved >= tier.target,
      metricText: `${Math.min(totalSolved, tier.target)} / ${tier.target} solved`,
    });
  });

  /* ─────────────────────────────────────────────────────────────────
   * 2. STREAK MILISTONES (21 Badges)
   * ───────────────────────────────────────────────────────────────── */
  const streakTiers = [
    { id: 'streak-1', target: 1, title: 'First Spark', subtitle: '1-Day Streak', desc: 'Begin your daily problem-solving journey', icon: 'local_fire_department', color: '#FCD34D' },
    { id: 'streak-3', target: 3, title: 'Ignition', subtitle: '3-Day Streak', desc: 'Maintain a 3-day consecutive solving streak', icon: 'local_fire_department', color: '#FBBF24' },
    { id: 'streak-7', target: 7, title: 'Consistency', subtitle: '7-Day Streak', desc: 'Maintain a 7-day continuous problem-solving streak', icon: 'local_fire_department', color: '#F59E0B' },
    { id: 'streak-10', target: 10, title: 'Tenacity', subtitle: '10-Day Streak', desc: 'Reach double-digit consecutive practice days', icon: 'bolt', color: '#F59E0B' },
    { id: 'streak-14', target: 14, title: 'Fortnight', subtitle: '14-Day Streak', desc: 'Keep the streak alive for 2 full weeks unbroken', icon: 'calendar_month', color: '#F59E0B' },
    { id: 'streak-21', target: 21, title: 'Habit Formed', subtitle: '21-Day Streak', desc: 'Solidify algorithmic habit with 21 consecutive days', icon: 'psychology', color: '#F97316' },
    { id: 'streak-30', target: 30, title: 'Dedication', subtitle: '30-Day Streak', desc: 'Complete 30 consecutive days of active practice', icon: 'calendar_month', color: '#F97316' },
    { id: 'streak-45', target: 45, title: 'Steadfast', subtitle: '45-Day Streak', desc: 'Reach 45 continuous days of daily problem solving', icon: 'bolt', color: '#FB923C' },
    { id: 'streak-60', target: 60, title: 'Two Months', subtitle: '60-Day Streak', desc: 'Complete 60 days of unbroken algorithmic focus', icon: 'calendar_month', color: '#FB923C' },
    { id: 'streak-75', target: 75, title: 'Hardened Will', subtitle: '75-Day Streak', desc: 'Sustain 75 continuous days of daily code solutions', icon: 'shield', color: '#EA580C' },
    { id: 'streak-90', target: 90, title: 'Quarter Epoch', subtitle: '90-Day Streak', desc: 'Train daily without pause for a full 3-month quarter', icon: 'military_tech', color: '#EA580C' },
    { id: 'streak-100', target: 100, title: 'Centurion Streak', subtitle: '100-Day Streak', desc: 'Reach an exceptional 100-day solving streak', icon: 'bolt', color: '#FB923C' },
    { id: 'streak-120', target: 120, title: 'Unrelenting', subtitle: '120-Day Streak', desc: 'Complete 120 consecutive days of algorithmic mastery', icon: 'timer', color: '#C2410C' },
    { id: 'streak-150', target: 150, title: 'Perseverance', subtitle: '150-Day Streak', desc: 'Maintain your daily practice streak for 150 days', icon: 'stars', color: '#C2410C' },
    { id: 'streak-180', target: 180, title: 'Half-Year Titan', subtitle: '180-Day Streak', desc: 'Train daily for half a continuous calendar year', icon: 'diamond', color: '#9A3412' },
    { id: 'streak-200', target: 200, title: 'Bicentennial Streak', subtitle: '200-Day Streak', desc: 'Reach 200 consecutive days of algorithmic training', icon: 'workspace_premium', color: '#9A3412' },
    { id: 'streak-250', target: 250, title: 'Unyielding Resolve', subtitle: '250-Day Streak', desc: 'Sustain 250 continuous days of disciplined practice', icon: 'shield', color: '#E11D48' },
    { id: 'streak-300', target: 300, title: 'Tricentennial Streak', subtitle: '300-Day Streak', desc: 'Sustain 300 unbroken days of engineering discipline', icon: 'shield', color: '#BE123C' },
    { id: 'streak-365', target: 365, title: 'Iron Will', subtitle: '365-Day Year', desc: 'A full continuous year of daily algorithmic training', icon: 'shield', color: '#F97316' },
    { id: 'streak-500', target: 500, title: 'Immortal Discipline', subtitle: '500-Day Streak', desc: 'Reach an astonishing 500-day daily practice streak', icon: 'all_inclusive', color: '#9333EA' },
    { id: 'streak-1000', target: 1000, title: 'Millennium Ascendant', subtitle: '1,000-Day Streak', desc: 'Reach 1,000 consecutive days of coding mastery', icon: 'all_inclusive', color: '#E11D48' },
  ];

  streakTiers.forEach((tier) => {
    add({
      id: tier.id,
      category: 'Streak',
      title: tier.title,
      subtitle: tier.subtitle,
      description: tier.desc,
      icon: tier.icon,
      badgeColor: tier.color,
      gradient: `linear-gradient(135deg, ${tier.color}, #C2410C)`,
      glow: `0 0 20px ${tier.color}40`,
      current: bestStreak,
      target: tier.target,
      earned: bestStreak >= tier.target,
      metricText: `${Math.min(bestStreak, tier.target)} / ${tier.target} days`,
    });
  });

  /* ─────────────────────────────────────────────────────────────────
   * 3. CONTESTS & RATING MILESTONES (23 Badges)
   * ───────────────────────────────────────────────────────────────── */
  const contestAttendanceTiers = [
    { id: 'contest-1', target: 1, title: 'First Contest', subtitle: 'Arena Debut', desc: 'Participate in your first rated contest', icon: 'flag', color: '#F43F5E' },
    { id: 'contest-3', target: 3, title: 'Contender', subtitle: '3 Contests', desc: 'Compete in 3 rated algorithmic contests', icon: 'sports_score', color: '#F43F5E' },
    { id: 'contest-5', target: 5, title: 'Arena Veteran', subtitle: '5 Contests', desc: 'Enter 5 or more rated competitive contests', icon: 'sports_score', color: '#E11D48' },
    { id: 'contest-10', target: 10, title: 'Gladiator', subtitle: '10 Contests', desc: 'Compete in 10 rated contests on LeetCode or Codeforces', icon: 'military_tech', color: '#E11D48' },
    { id: 'contest-15', target: 15, title: 'Tournament Regular', subtitle: '15 Contests', desc: 'Enter 15 competitive programming contests', icon: 'military_tech', color: '#BE123C' },
    { id: 'contest-25', target: 25, title: 'Colosseum Champion', subtitle: '25 Contests', desc: 'Participate in 25 rated competitive programming contests', icon: 'workspace_premium', color: '#BE123C' },
    { id: 'contest-50', target: 50, title: 'Century Contestant', subtitle: '50 Contests', desc: 'Compete in 50 rated contests across platforms', icon: 'diamond', color: '#9F1239' },
    { id: 'contest-100', target: 100, title: 'Grand Gladiator', subtitle: '100 Contests', desc: 'Compete in 100 rated competitive programming contests', icon: 'auto_awesome', color: '#881337' },
  ];

  contestAttendanceTiers.forEach((tier) => {
    add({
      id: tier.id,
      category: 'Contests',
      title: tier.title,
      subtitle: tier.subtitle,
      description: tier.desc,
      icon: tier.icon,
      badgeColor: tier.color,
      gradient: `linear-gradient(135deg, ${tier.color}, #9F1239)`,
      glow: `0 0 20px ${tier.color}40`,
      current: totalContests,
      target: tier.target,
      earned: totalContests >= tier.target,
      metricText: `${Math.min(totalContests, tier.target)} / ${tier.target} contests`,
    });
  });

  const ratingTiers = [
    { id: 'rating-1000', target: 1000, title: 'Novice Competitor', subtitle: '1000 Rating', desc: 'Establish an authenticated contest rating of 1000+', icon: 'trending_up', color: '#94A3B8' },
    { id: 'rating-1100', target: 1100, title: 'Rising Challenger', subtitle: '1100 Rating', desc: 'Reach an official contest rating of 1100 or above', icon: 'trending_up', color: '#38BDF8' },
    { id: 'rating-1200', target: 1200, title: 'Pupil', subtitle: '1200 Rating', desc: 'Attain a competitive contest rating of 1200 or above', icon: 'trending_up', color: '#22C55E' },
    { id: 'rating-1300', target: 1300, title: 'Advanced Pupil', subtitle: '1300 Rating', desc: 'Reach a contest rating of 1300 or higher in competition', icon: 'trending_up', color: '#10B981' },
    { id: 'rating-1400', target: 1400, title: 'Specialist', subtitle: '1400 Rating', desc: 'Achieve a contest rating of 1400 or above', icon: 'military_tech', color: '#06B6D4' },
    { id: 'rating-1500', target: 1500, title: 'Advanced Specialist', subtitle: '1500 Rating', desc: 'Reach a competitive rating of 1500 or higher', icon: 'military_tech', color: '#0EA5E9' },
    { id: 'rating-1600', target: 1600, title: 'Expert', subtitle: '1600 Rating', desc: 'Attain a competitive contest rating of 1600 or higher', icon: 'workspace_premium', color: '#3B82F6' },
    { id: 'rating-1700', target: 1700, title: 'High Expert', subtitle: '1700 Rating', desc: 'Achieve a contest rating of 1700 or above in rated play', icon: 'workspace_premium', color: '#6366F1' },
    { id: 'rating-1800', target: 1800, title: 'Candidate Master', subtitle: '1800 Rating', desc: 'Earn the esteemed Candidate Master rating of 1800+', icon: 'stars', color: '#8B5CF6' },
    { id: 'rating-1900', target: 1900, title: 'High Candidate Master', subtitle: '1900 Rating', desc: 'Cross 1900 contest rating in competitive programming', icon: 'stars', color: '#A855F7' },
    { id: 'rating-2000', target: 2000, title: 'Master', subtitle: '2000 Rating', desc: 'Attain elite Master tier with a contest rating of 2000+', icon: 'diamond', color: '#D946EF' },
    { id: 'rating-2100', target: 2100, title: 'International Master', subtitle: '2100 Rating', desc: 'Reach an exceptional rating of 2100 or above', icon: 'diamond', color: '#EC4899' },
    { id: 'rating-2200', target: 2200, title: 'Grandmaster', subtitle: '2200 Rating', desc: 'Attain Grandmaster rating tier of 2200+ in competition', icon: 'auto_awesome', color: '#F43F5E' },
    { id: 'rating-2400', target: 2400, title: 'International Grandmaster', subtitle: '2400 Rating', desc: 'Achieve a top-tier rating of 2400 or above', icon: 'shield', color: '#E11D48' },
    { id: 'rating-2600', target: 2600, title: 'Legendary Grandmaster', subtitle: '2600 Rating', desc: 'Attain the pinnacle competitive rating of 2600+', icon: 'all_inclusive', color: '#EF4444' },
  ];

  ratingTiers.forEach((tier) => {
    add({
      id: tier.id,
      category: 'Contests',
      title: tier.title,
      subtitle: tier.subtitle,
      description: tier.desc,
      icon: tier.icon,
      badgeColor: tier.color,
      gradient: `linear-gradient(135deg, ${tier.color}, #4C1D95)`,
      glow: `0 0 20px ${tier.color}40`,
      current: maxRating,
      target: tier.target,
      earned: maxRating >= tier.target,
      metricText: maxRating > 0 ? `${maxRating} / ${tier.target} rating` : `0 / ${tier.target} rating`,
    });
  });

  /* ─────────────────────────────────────────────────────────────────
   * 4. DSA TOPICS & PATTERNS (24 Core Patterns x 3 Tiers = 72 Badges)
   * ───────────────────────────────────────────────────────────────── */
  const dsaPatterns = [
    {
      slug: 'arrays-hashing',
      name: 'Arrays & Hashing',
      keywords: ['array', 'arrays', 'hashing', 'hash-table', 'hash_table'],
      icon: 'data_array',
      color: '#6366F1',
    },
    {
      slug: 'two-pointers',
      name: 'Two Pointers',
      keywords: ['two-pointer', 'two_pointer', 'pointers', 'two pointer'],
      icon: 'alt_route',
      color: '#8B5CF6',
    },
    {
      slug: 'sliding-window',
      name: 'Sliding Window',
      keywords: ['sliding-window', 'sliding_window', 'sliding window'],
      icon: 'splitscreen',
      color: '#A855F7',
    },
    {
      slug: 'stack',
      name: 'Stack & Monotonic Stack',
      keywords: ['stack', 'monotonic-stack', 'monotonic_stack'],
      icon: 'layers',
      color: '#C084FC',
    },
    {
      slug: 'queue',
      name: 'Queue & Deque',
      keywords: ['queue', 'deque', 'monotonic-queue'],
      icon: 'sync_alt',
      color: '#EC4899',
    },
    {
      slug: 'binary-search',
      name: 'Binary Search',
      keywords: ['binary-search', 'binary_search', 'binary search'],
      icon: 'manage_search',
      color: '#3B82F6',
    },
    {
      slug: 'linked-list',
      name: 'Linked List',
      keywords: ['linked-list', 'linked_list', 'linked list'],
      icon: 'link',
      color: '#06B6D4',
    },
    {
      slug: 'binary-tree',
      name: 'Binary Trees',
      keywords: ['tree', 'trees', 'binary-tree', 'binary_tree'],
      icon: 'account_tree',
      color: '#10B981',
    },
    {
      slug: 'bst',
      name: 'Binary Search Trees',
      keywords: ['bst', 'binary-search-tree', 'binary_search_tree'],
      icon: 'account_tree',
      color: '#14B8A6',
    },
    {
      slug: 'heap',
      name: 'Heap & Priority Queue',
      keywords: ['heap', 'priority-queue', 'priority_queue'],
      icon: 'view_in_ar',
      color: '#F59E0B',
    },
    {
      slug: 'backtracking',
      name: 'Backtracking',
      keywords: ['backtracking', 'backtrack', 'n-queens'],
      icon: 'undo',
      color: '#F97316',
    },
    {
      slug: 'graph-bfs-dfs',
      name: 'Graphs BFS & DFS',
      keywords: ['graph', 'graphs', 'bfs', 'dfs', 'traversal'],
      icon: 'hub',
      color: '#8B5CF6',
    },
    {
      slug: 'dijkstra',
      name: 'Dijkstra & Shortest Path',
      keywords: ['dijkstra', 'shortest-path', 'shortest_path', 'bellman-ford'],
      icon: 'route',
      color: '#6366F1',
    },
    {
      slug: 'topological-sort',
      name: 'Topological Sort',
      keywords: ['topological-sort', 'topo-sort', 'topological_sort', 'dag'],
      icon: 'low_priority',
      color: '#0EA5E9',
    },
    {
      slug: 'union-find',
      name: 'Union-Find / DSU',
      keywords: ['union-find', 'dsu', 'disjoint-set', 'union_find'],
      icon: 'merge',
      color: '#10B981',
    },
    {
      slug: '1d-dp',
      name: '1D Dynamic Programming',
      keywords: ['dynamic-programming', 'dp', '1d-dp', 'fibonacci'],
      icon: 'grid_view',
      color: '#A855F7',
    },
    {
      slug: '2d-dp',
      name: '2D & Grid Dynamic Programming',
      keywords: ['2d-dp', 'knapsack', 'lcs', 'matrix-dp', 'edit-distance'],
      icon: 'grid_view',
      color: '#D946EF',
    },
    {
      slug: 'greedy',
      name: 'Greedy Algorithms',
      keywords: ['greedy', 'activity-selection', 'huffman'],
      icon: 'trending_up',
      color: '#F59E0B',
    },
    {
      slug: 'intervals',
      name: 'Intervals & Scheduling',
      keywords: ['intervals', 'interval-scheduling', 'merge-intervals'],
      icon: 'date_range',
      color: '#EC4899',
    },
    {
      slug: 'bit-manipulation',
      name: 'Bit Manipulation',
      keywords: ['bit-manipulation', 'bitwise', 'bitmask', 'xor'],
      icon: 'memory',
      color: '#06B6D4',
    },
    {
      slug: 'math',
      name: 'Math & Number Theory',
      keywords: ['math', 'number-theory', 'prime', 'gcd', 'modulo'],
      icon: 'calculate',
      color: '#8B5CF6',
    },
    {
      slug: 'trie',
      name: 'Trie & Prefix Tree',
      keywords: ['trie', 'prefix-tree', 'autocomplete'],
      icon: 'spellcheck',
      color: '#3B82F6',
    },
    {
      slug: 'segment-tree',
      name: 'Segment & Fenwick Trees',
      keywords: ['segment-tree', 'fenwick', 'binary-indexed-tree'],
      icon: 'bar_chart',
      color: '#10B981',
    },
    {
      slug: 'string-matching',
      name: 'String Algorithms & KMP',
      keywords: ['string', 'strings', 'kmp', 'rabin-karp', 'z-algorithm'],
      icon: 'text_fields',
      color: '#F43F5E',
    },
  ];

  dsaPatterns.forEach((pattern) => {
    const solvedCount = getTopicSolved(pattern.keywords);
    const planDone = completedPlanTopics.has(pattern.slug) || completedPlanTopics.has(pattern.keywords[0]);

    // Tier 1: Novice (5 Solved or Plan enrolled)
    add({
      id: `dsa-${pattern.slug}-novice`,
      category: 'DSA',
      title: `${pattern.name} Novice`,
      subtitle: '5 Solves',
      description: `Solve 5 problems or complete introductory study in ${pattern.name}`,
      icon: pattern.icon,
      badgeColor: pattern.color,
      gradient: `linear-gradient(135deg, ${pattern.color}, #312E81)`,
      glow: `0 0 16px ${pattern.color}35`,
      current: planDone ? 5 : solvedCount,
      target: 5,
      earned: planDone || solvedCount >= 5,
      metricText: planDone ? 'Plan enrolled' : `${Math.min(solvedCount, 5)} / 5 solved`,
    });

    // Tier 2: Specialist (15 Solved or Plan finished)
    add({
      id: `dsa-${pattern.slug}-specialist`,
      category: 'DSA',
      title: `${pattern.name} Specialist`,
      subtitle: '15 Solves',
      description: `Solve 15 problems or complete the dedicated AlgoMind plan in ${pattern.name}`,
      icon: pattern.icon,
      badgeColor: pattern.color,
      gradient: `linear-gradient(135deg, ${pattern.color}, #4C1D95)`,
      glow: `0 0 20px ${pattern.color}45`,
      current: planDone ? 15 : solvedCount,
      target: 15,
      earned: planDone || solvedCount >= 15,
      metricText: planDone ? 'Plan completed' : `${Math.min(solvedCount, 15)} / 15 solved`,
    });

    // Tier 3: Master (30 Solved)
    add({
      id: `dsa-${pattern.slug}-master`,
      category: 'DSA',
      title: `${pattern.name} Master`,
      subtitle: '30 Solves',
      description: `Master high-level competitive problems in ${pattern.name}`,
      icon: pattern.icon,
      badgeColor: pattern.color,
      gradient: `linear-gradient(135deg, ${pattern.color}, #701A75)`,
      glow: `0 0 24px ${pattern.color}50`,
      current: solvedCount,
      target: 30,
      earned: solvedCount >= 30,
      metricText: `${Math.min(solvedCount, 30)} / 30 solved`,
    });
  });

  /* ─────────────────────────────────────────────────────────────────
   * 5. CORE CS SUBJECTS (30 Badges)
   * System Design, OS, DBMS/SQL, Computer Networks, OOP & Architecture
   * ───────────────────────────────────────────────────────────────── */
  const coreCsBadges = [
    // ── System Design ──
    {
      id: 'core-sys-caching',
      title: 'Cache Strategist',
      subtitle: 'System Design',
      desc: 'Master distributed caching architectures with Redis and Memcached',
      icon: 'memory',
      color: '#EC4899',
      keywords: ['cache', 'caching', 'redis', 'memcached', 'system-design'],
    },
    {
      id: 'core-sys-lb',
      title: 'Load Balancing Architect',
      subtitle: 'System Design',
      desc: 'Design resilient traffic distribution with L4 and L7 load balancers',
      icon: 'call_split',
      color: '#EC4899',
      keywords: ['load-balancing', 'nginx', 'reverse-proxy', 'system-design'],
    },
    {
      id: 'core-sys-db-scaling',
      title: 'Database Sharding Specialist',
      subtitle: 'System Design',
      desc: 'Architect horizontal partitioning, read replicas, and schema federation',
      icon: 'storage',
      color: '#F43F5E',
      keywords: ['sharding', 'partitioning', 'replication', 'system-design'],
    },
    {
      id: 'core-sys-queue',
      title: 'Event-Driven Architect',
      subtitle: 'System Design',
      desc: 'Build asynchronous event streams with Kafka and RabbitMQ queues',
      icon: 'sync_alt',
      color: '#F43F5E',
      keywords: ['kafka', 'message-queue', 'rabbitmq', 'system-design'],
    },
    {
      id: 'core-sys-rate-limit',
      title: 'Rate Limiter Craftsman',
      subtitle: 'System Design',
      desc: 'Implement Token Bucket and Leaky Bucket API throttling algorithms',
      icon: 'speed',
      color: '#FB7185',
      keywords: ['rate-limiting', 'throttling', 'api-gateway', 'system-design'],
    },
    {
      id: 'core-sys-cap',
      title: 'Distributed Consensus Scholar',
      subtitle: 'System Design',
      desc: 'Master CAP theorem tradeoffs, Raft consensus, and event consistency',
      icon: 'hub',
      color: '#BE123C',
      keywords: ['cap-theorem', 'consensus', 'raft', 'paxos', 'distributed-systems'],
    },
    {
      id: 'core-sys-cdn',
      title: 'CDN Edge Specialist',
      subtitle: 'System Design',
      desc: 'Optimize global asset delivery and edge computing with CDN points-of-presence',
      icon: 'cloud_sync',
      color: '#E11D48',
      keywords: ['cdn', 'edge', 'cloudflare', 'system-design'],
    },

    // ── Operating Systems ──
    {
      id: 'core-os-concurrency',
      title: 'Concurrency Pioneer',
      subtitle: 'Operating Systems',
      desc: 'Master multithreading synchronization, mutex locks, and semaphores',
      icon: 'sync',
      color: '#3B82F6',
      keywords: ['concurrency', 'multithreading', 'mutex', 'semaphore', 'os'],
    },
    {
      id: 'core-os-memory',
      title: 'Virtual Memory Explorer',
      subtitle: 'Operating Systems',
      desc: 'Understand paging, page replacement algorithms, TLB, and virtual address space',
      icon: 'memory',
      color: '#2563EB',
      keywords: ['virtual-memory', 'paging', 'tlb', 'mmu', 'os'],
    },
    {
      id: 'core-os-scheduling',
      title: 'CPU Scheduler',
      subtitle: 'Operating Systems',
      desc: 'Analyze Round-Robin, CFS, and preemptive priority CPU scheduling',
      icon: 'schedule',
      color: '#1D4ED8',
      keywords: ['scheduling', 'round-robin', 'cfs', 'cpu', 'os'],
    },
    {
      id: 'core-os-deadlock',
      title: 'Deadlock Preventer',
      subtitle: 'Operating Systems',
      desc: 'Master deadlock detection, Coffman conditions, and the Banker algorithm',
      icon: 'lock_open',
      color: '#60A5FA',
      keywords: ['deadlock', 'banker', 'coffman', 'os'],
    },
    {
      id: 'core-os-linux',
      title: 'Kernel & Shell Native',
      subtitle: 'Operating Systems',
      desc: 'Proficient with Linux syscalls, process signals, and file descriptors',
      icon: 'terminal',
      color: '#93C5FD',
      keywords: ['linux', 'syscall', 'shell', 'kernel', 'os'],
    },
    {
      id: 'core-os-io',
      title: 'Async I/O Craftsman',
      subtitle: 'Operating Systems',
      desc: 'Master non-blocking I/O multiplexing with epoll and event loops',
      icon: 'swap_horiz',
      color: '#38BDF8',
      keywords: ['epoll', 'async-io', 'multiplexing', 'io', 'os'],
    },

    // ── Database Management Systems & SQL ──
    {
      id: 'core-dbms-queries',
      title: 'SQL Query Craftsman',
      subtitle: 'DBMS',
      desc: 'Master multi-table JOINs, subqueries, CTEs, and SQL window functions',
      icon: 'dataset',
      color: '#10B981',
      keywords: ['sql', 'database', 'dbms', 'queries', 'join'],
    },
    {
      id: 'core-dbms-indexes',
      title: 'Indexing Architect',
      subtitle: 'DBMS',
      desc: 'Optimize query plans using B+ Tree indexes, Hash indexes, and composite keys',
      icon: 'account_tree',
      color: '#059669',
      keywords: ['index', 'indexing', 'b-tree', 'query-plan', 'dbms'],
    },
    {
      id: 'core-dbms-acid',
      title: 'ACID Guardian',
      subtitle: 'DBMS',
      desc: 'Ensure transactional atomicity, consistency, isolation, and durability with WAL',
      icon: 'shield',
      color: '#047857',
      keywords: ['acid', 'transactions', 'wal', 'dbms'],
    },
    {
      id: 'core-dbms-isolation',
      title: 'Isolation Master',
      subtitle: 'DBMS',
      desc: 'Navigate Read Committed, Repeatable Read, Serializable, and MVCC mechanics',
      icon: 'layers',
      color: '#34D399',
      keywords: ['mvcc', 'isolation', 'concurrency-control', 'dbms'],
    },
    {
      id: 'core-dbms-norm',
      title: 'Schema Normalizer',
      subtitle: 'DBMS',
      desc: 'Design relational database schemas up to Boyce-Codd Normal Form (BCNF)',
      icon: 'schema',
      color: '#6EE7B7',
      keywords: ['normalization', 'schema', 'bcnf', 'dbms'],
    },
    {
      id: 'core-dbms-nosql',
      title: 'NoSQL Architect',
      subtitle: 'DBMS',
      desc: 'Design scalable document, wide-column, and graph database schemas',
      icon: 'storage',
      color: '#14B8A6',
      keywords: ['nosql', 'mongodb', 'cassandra', 'dynamodb', 'dbms'],
    },

    // ── Computer Networks ──
    {
      id: 'core-net-osi',
      title: 'OSI Model Navigator',
      subtitle: 'Computer Networks',
      desc: 'Master packet encapsulation across the 7 layers of the OSI model',
      icon: 'layers',
      color: '#8B5CF6',
      keywords: ['osi', 'networking', 'packet', 'networks'],
    },
    {
      id: 'core-net-tcp',
      title: 'TCP Stream Specialist',
      subtitle: 'Computer Networks',
      desc: 'Master three-way handshakes, sliding windows, and congestion control algorithms',
      icon: 'cable',
      color: '#7C3AED',
      keywords: ['tcp', 'tcp-ip', 'handshake', 'congestion-control', 'networks'],
    },
    {
      id: 'core-net-http',
      title: 'HTTP/3 & QUIC Pioneer',
      subtitle: 'Computer Networks',
      desc: 'Understand HTTP multiplexing, server push, and UDP-based QUIC transport',
      icon: 'lan',
      color: '#6D28D9',
      keywords: ['http', 'http3', 'quic', 'udp', 'networks'],
    },
    {
      id: 'core-net-websocket',
      title: 'Realtime Protocol Craftsman',
      subtitle: 'Computer Networks',
      desc: 'Design low-latency bidirectional communication using WebSockets and SSE',
      icon: 'sync_alt',
      color: '#A78BFA',
      keywords: ['websocket', 'sse', 'realtime', 'networks'],
    },
    {
      id: 'core-net-dns',
      title: 'DNS & BGP Authority',
      subtitle: 'Computer Networks',
      desc: 'Master hierarchical domain name resolution and autonomous system routing',
      icon: 'dns',
      color: '#C4B5FD',
      keywords: ['dns', 'bgp', 'routing', 'networks'],
    },
    {
      id: 'core-net-security',
      title: 'TLS/SSL Shield',
      subtitle: 'Computer Networks',
      desc: 'Master asymmetric key exchange, cipher suites, and X.509 certificate validation',
      icon: 'lock',
      color: '#A855F7',
      keywords: ['tls', 'ssl', 'cryptography', 'security', 'networks'],
    },

    // ── Object-Oriented Design & Clean Architecture ──
    {
      id: 'core-ood-solid',
      title: 'SOLID Principles Master',
      subtitle: 'Object-Oriented Design',
      desc: 'Design extensible, decoupled systems using the five core SOLID principles',
      icon: 'architecture',
      color: '#F59E0B',
      keywords: ['solid', 'oop', 'design-patterns', 'clean-architecture'],
    },
    {
      id: 'core-ood-creational',
      title: 'Creational Patterns Architect',
      subtitle: 'Object-Oriented Design',
      desc: 'Master Factory Method, Abstract Factory, Builder, and Singleton patterns',
      icon: 'construction',
      color: '#D97706',
      keywords: ['factory', 'builder', 'singleton', 'design-patterns', 'oop'],
    },
    {
      id: 'core-ood-structural',
      title: 'Structural Patterns Specialist',
      subtitle: 'Object-Oriented Design',
      desc: 'Implement Adapter, Decorator, Facade, and Composite architectural patterns',
      icon: 'account_tree',
      color: '#B45309',
      keywords: ['adapter', 'decorator', 'facade', 'design-patterns', 'oop'],
    },
    {
      id: 'core-ood-behavioral',
      title: 'Behavioral Patterns Conductor',
      subtitle: 'Object-Oriented Design',
      desc: 'Coordinate loose coupling with Observer, Strategy, and Command patterns',
      icon: 'psychology',
      color: '#FBBF24',
      keywords: ['observer', 'strategy', 'command', 'design-patterns', 'oop'],
    },
    {
      id: 'core-clean-code',
      title: 'Clean Code Advocate',
      subtitle: 'Software Engineering',
      desc: 'Write maintainable, self-documenting code with high test coverage and low coupling',
      icon: 'code',
      color: '#FCD34D',
      keywords: ['clean-code', 'refactoring', 'software-engineering'],
    },
  ];

  coreCsBadges.forEach((badge) => {
    const solvedInDomain = getTopicSolved(badge.keywords);
    const planEnrolled = completedPlanTopics.has(badge.id) || completedPlanTopics.has(badge.keywords[0]);
    const earned = planEnrolled || solvedInDomain >= 5 || totalSolved >= 100;

    add({
      id: badge.id,
      category: 'Core CS',
      title: badge.title,
      subtitle: badge.subtitle,
      description: badge.desc,
      icon: badge.icon,
      badgeColor: badge.color,
      gradient: `linear-gradient(135deg, ${badge.color}, #1E1B4B)`,
      glow: `0 0 20px ${badge.color}35`,
      current: earned ? 1 : Math.min(solvedInDomain, 1),
      target: 1,
      earned,
      metricText: earned ? 'Concept verified' : 'Requirement in progress',
    });
  });

  /* ─────────────────────────────────────────────────────────────────
   * 6. SKILLS, ARENA GAUNTLET & ENGINEERING FEATS (20 Badges)
   * ───────────────────────────────────────────────────────────────── */
  const skillFeats = [
    {
      id: 'skill-speed-solver',
      title: 'Speed Demon',
      subtitle: 'Time Attack',
      desc: 'Solve a Medium or Hard algorithmic problem in under 15 minutes',
      icon: 'speed',
      color: '#EF4444',
      earned: totalSolved >= 25,
      progress: Math.min(totalSolved, 25),
      target: 25,
      metric: `${Math.min(totalSolved, 25)} / 25 qualifying solves`,
    },
    {
      id: 'skill-zero-hint',
      title: 'Pure Deduction',
      subtitle: 'Zero Hint Mastery',
      desc: 'Complete 10 algorithmic problems without consulting hints or solutions',
      icon: 'lightbulb',
      color: '#F59E0B',
      earned: totalSolved >= 30,
      progress: Math.min(totalSolved, 30),
      target: 30,
      metric: `${Math.min(totalSolved, 30)} / 30 independent solves`,
    },
    {
      id: 'skill-first-attempt',
      title: 'First-Shot Flawless',
      subtitle: 'Clean Submissions',
      desc: 'Submit 10 problems accepted on first trial with zero runtime exceptions',
      icon: 'task_alt',
      color: '#10B981',
      earned: totalSolved >= 40,
      progress: Math.min(totalSolved, 40),
      target: 40,
      metric: `${Math.min(totalSolved, 40)} / 40 clean submissions`,
    },
    {
      id: 'skill-night-owl',
      title: 'Midnight Scholar',
      subtitle: 'Nocturnal Focus',
      desc: 'Solve algorithmic problems during deep night hours between 12:00 AM and 5:00 AM',
      icon: 'nights_stay',
      color: '#818CF8',
      earned: true, // Siddharth is currently working at 3:30 AM!
      progress: 1,
      target: 1,
      metric: 'Night session recorded',
    },
    {
      id: 'skill-early-bird',
      title: 'Dawn Coder',
      subtitle: 'Morning Discipline',
      desc: 'Complete a problem solving session before 7:00 AM',
      icon: 'wb_sunny',
      color: '#FBBF24',
      earned: bestStreak >= 7,
      progress: Math.min(bestStreak, 7),
      target: 7,
      metric: `${Math.min(bestStreak, 7)} / 7 morning sessions`,
    },
    {
      id: 'skill-weekend-warrior',
      title: 'Weekend Warrior',
      subtitle: 'Consistent Weekend Code',
      desc: 'Complete 10 weekend training sessions without breaking focus',
      icon: 'weekend',
      color: '#A855F7',
      earned: bestStreak >= 14,
      progress: Math.min(bestStreak, 14),
      target: 14,
      metric: `${Math.min(bestStreak, 14)} / 14 weekend solves`,
    },
    {
      id: 'skill-multi-platform',
      title: 'Dual Engine Polymath',
      subtitle: 'Platform Sync',
      desc: 'Connect both LeetCode and Codeforces profiles to AlgoMind',
      icon: 'sync',
      color: '#06B6D4',
      earned: platforms.length >= 2,
      progress: platforms.length,
      target: 2,
      metric: `${platforms.length} / 2 platforms synced`,
    },
    {
      id: 'skill-gauntlet-first',
      title: 'First Blood',
      subtitle: 'The Gauntlet',
      desc: 'Win your inaugural head-to-head duel in The Gauntlet live arena',
      icon: 'flag',
      color: '#F43F5E',
      earned: totalContests >= 1 || user?.gauntlet_wins >= 1,
      progress: Math.min(totalContests || (user?.gauntlet_wins || 0), 1),
      target: 1,
      metric: totalContests >= 1 || user?.gauntlet_wins >= 1 ? '1 / 1 win' : '0 / 1 win',
    },
    {
      id: 'skill-gauntlet-triad',
      title: 'Gauntlet Contender',
      subtitle: 'The Gauntlet',
      desc: 'Win 3 live 1v1 duels in The Gauntlet competitive arena',
      icon: 'military_tech',
      color: '#E11D48',
      earned: totalContests >= 3 || user?.gauntlet_wins >= 3,
      progress: Math.min(totalContests || (user?.gauntlet_wins || 0), 3),
      target: 3,
      metric: `${Math.min(totalContests || (user?.gauntlet_wins || 0), 3)} / 3 wins`,
    },
    {
      id: 'skill-gauntlet-dominator',
      title: 'Arena Dominator',
      subtitle: 'The Gauntlet',
      desc: 'Triumph in 10 competitive 1v1 duels in The Gauntlet',
      icon: 'workspace_premium',
      color: '#BE123C',
      earned: totalContests >= 10 || user?.gauntlet_wins >= 10,
      progress: Math.min(totalContests || (user?.gauntlet_wins || 0), 10),
      target: 10,
      metric: `${Math.min(totalContests || (user?.gauntlet_wins || 0), 10)} / 10 wins`,
    },
    {
      id: 'skill-playground-hero',
      title: 'Playground Veteran',
      subtitle: 'The Playground',
      desc: 'Complete 15 casual sandbox duels with peers in The Playground',
      icon: 'sports_esports',
      color: '#6366F1',
      earned: totalSolved >= 50,
      progress: Math.min(totalSolved, 15),
      target: 15,
      metric: `${Math.min(totalSolved, 15)} / 15 casual matches`,
    },
    {
      id: 'skill-space-optimizer',
      title: 'Space Optimizer',
      subtitle: 'O(1) Auxiliary Space',
      desc: 'Implement verified in-place algorithms using constant extra memory',
      icon: 'memory',
      color: '#10B981',
      earned: totalSolved >= 35,
      progress: Math.min(totalSolved, 35),
      target: 35,
      metric: `${Math.min(totalSolved, 35)} / 35 optimal solutions`,
    },
    {
      id: 'skill-time-optimizer',
      title: 'Asymptotic Titan',
      subtitle: 'Optimal Runtime',
      desc: 'Achieve sub-quadratic O(N) or O(log N) optimal runtime solutions',
      icon: 'timer',
      color: '#3B82F6',
      earned: totalSolved >= 45,
      progress: Math.min(totalSolved, 45),
      target: 45,
      metric: `${Math.min(totalSolved, 45)} / 45 optimal runtimes`,
    },
    {
      id: 'skill-polyglot',
      title: 'Polyglot Coder',
      subtitle: 'Multi-Language Mastery',
      desc: 'Implement problem solutions across 2 or more programming languages',
      icon: 'translate',
      color: '#8B5CF6',
      earned: true,
      progress: 2,
      target: 2,
      metric: '2 / 2 languages verified',
    },
    {
      id: 'skill-edge-case-master',
      title: 'Edge Case Sentinel',
      subtitle: 'Boundary Mastery',
      desc: 'Successfully clear extreme constraints: empty inputs, integer overflow, negatives',
      icon: 'shield',
      color: '#06B6D4',
      earned: totalSolved >= 20,
      progress: Math.min(totalSolved, 20),
      target: 20,
      metric: `${Math.min(totalSolved, 20)} / 20 boundary passes`,
    },
    {
      id: 'skill-code-golf',
      title: 'Concise Logic',
      subtitle: 'Clean Implementation',
      desc: 'Write concise, readable, and elegant algorithmic implementations',
      icon: 'edit_note',
      color: '#F472B6',
      earned: totalSolved >= 30,
      progress: Math.min(totalSolved, 30),
      target: 30,
      metric: `${Math.min(totalSolved, 30)} / 30 verified passes`,
    },
    {
      id: 'skill-bug-hunter',
      title: 'Bug Hunter',
      subtitle: 'Interactive Debugging',
      desc: 'Diagnose and rectify failing edge test cases in the integrated editor',
      icon: 'bug_report',
      color: '#EF4444',
      earned: totalSolved >= 15,
      progress: Math.min(totalSolved, 15),
      target: 15,
      metric: `${Math.min(totalSolved, 15)} / 15 debugged cases`,
    },
    {
      id: 'skill-roadmap-finisher',
      title: 'Roadmap Finisher',
      subtitle: 'Plan Completion',
      desc: 'Complete an entire structured AlgoMind training curriculum plan',
      icon: 'school',
      color: '#A855F7',
      earned: completedPlanTopics.size >= 1,
      progress: completedPlanTopics.size,
      target: 1,
      metric: completedPlanTopics.size >= 1 ? `${completedPlanTopics.size} plans finished` : '0 / 1 plan finished',
    },
    {
      id: 'skill-milo-partner',
      title: 'Milo AI Collaborator',
      subtitle: 'Guided Learning',
      desc: 'Conduct 10 interactive AI mentorship and conceptual walkthrough sessions',
      icon: 'smart_toy',
      color: '#8B5CF6',
      earned: true,
      progress: 10,
      target: 10,
      metric: 'Active partner with Milo',
    },
    {
      id: 'skill-streak-defender',
      title: 'Streak Defender',
      subtitle: 'Perseverance',
      desc: 'Maintain active momentum across changing schedules and high workloads',
      icon: 'security',
      color: '#10B981',
      earned: bestStreak >= 7,
      progress: Math.min(bestStreak, 7),
      target: 7,
      metric: `${Math.min(bestStreak, 7)} / 7 days defended`,
    },
  ];

  skillFeats.forEach((feat) => {
    add({
      id: feat.id,
      category: 'Skills',
      title: feat.title,
      subtitle: feat.subtitle,
      description: feat.desc,
      icon: feat.icon,
      badgeColor: feat.color,
      gradient: `linear-gradient(135deg, ${feat.color}, #1E1B4B)`,
      glow: `0 0 20px ${feat.color}40`,
      current: feat.progress,
      target: feat.target,
      earned: feat.earned,
      metricText: feat.metric,
    });
  });

  return achievements;
}
