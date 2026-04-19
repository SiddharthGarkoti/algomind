import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../utils/api.js';

/* ══════════════════════════════════════════════════════════════════
   TOPIC LIBRARY — keyed by id.
   Each entry has: id, name, level, slugs (LC tag slugs that map here),
   nextId (what comes after mastery), theory, compulsory[], optional[]
   Problems include a `slug` field for LC verification.
══════════════════════════════════════════════════════════════════ */
const ALL_TOPICS = [
  /* ─── Dynamic Programming ─── */
  {
    id: 'dp-1', name: 'Dynamic Programming', level: 'Foundation',
    slugs: ['dynamic-programming'],
    nextId: 'dp-2',
    theory: {
      title: 'Breaking Big Problems Into Smaller Ones',
      body: `Dynamic Programming (DP) solves complex problems by breaking them into overlapping subproblems and storing results to avoid redundant work.

**Two key properties:** Optimal Substructure — an optimal solution builds from optimal sub-solutions. Overlapping Subproblems — the same subproblems recur.

**Two approaches:** Top-down (Memoization) caches recursive calls. Bottom-up (Tabulation) builds iteratively from base cases.

Start by asking: What is the state? What is the recurrence? What are the base cases?`,
      keyIdeas: ['Identify state variables', 'Write the recurrence', 'Handle base cases first', 'Optimize space if needed'],
    },
    compulsory: [
      { id: 'dp-1-a', title: 'Climbing Stairs', difficulty: 'Easy', platform: 'LeetCode', number: 70, slug: 'climbing-stairs', link: 'https://leetcode.com/problems/climbing-stairs/', hint: 'f(n) = f(n-1) + f(n-2). Fibonacci in disguise.', explanation: 'Keep two variables for previous two values — O(1) space.' },
      { id: 'dp-1-b', title: 'House Robber', difficulty: 'Easy', platform: 'LeetCode', number: 198, slug: 'house-robber', link: 'https://leetcode.com/problems/house-robber/', hint: 'At each house: rob it or skip it. dp[i] = max(dp[i-1], dp[i-2]+nums[i]).', explanation: 'Space-optimise with two variables. Classic 1D DP.' },
      { id: 'dp-1-c', title: 'Coin Change', difficulty: 'Medium', platform: 'LeetCode', number: 322, slug: 'coin-change', link: 'https://leetcode.com/problems/coin-change/', hint: 'dp[i] = min coins for amount i. Try every coin denomination.', explanation: 'dp[i] = min(dp[i-coin]+1) for each coin ≤ i. Init Infinity except dp[0]=0.' },
    ],
    optional: [
      { id: 'dp-1-d', title: 'Longest Increasing Subsequence', difficulty: 'Medium', platform: 'LeetCode', number: 300, slug: 'longest-increasing-subsequence', link: 'https://leetcode.com/problems/longest-increasing-subsequence/' },
      { id: 'dp-1-e', title: 'Edit Distance', difficulty: 'Hard', platform: 'LeetCode', number: 72, slug: 'edit-distance', link: 'https://leetcode.com/problems/edit-distance/' },
    ],
  },
  {
    id: 'dp-2', name: 'Advanced DP — 2D & Knapsack', level: 'Advanced',
    slugs: [],
    nextId: 'dp-3',
    theory: {
      title: 'Grid DP, Knapsack & Interval Patterns',
      body: `Once you master 1D DP, the next step is **2D DP** where the state requires two dimensions — classic examples include Unique Paths, Minimum Path Sum, and the 0/1 Knapsack.

**0/1 Knapsack:** For each item decide include or exclude. State: dp[i][w] = max value using first i items with capacity w.

**Interval DP:** Solve sub-intervals first (Burst Balloons, Matrix Chain). The state is dp[l][r].

**Grid DP:** Paths on a grid — movement constraints become recurrences.`,
      keyIdeas: ['2D state for two constraints', 'Knapsack include/exclude pattern', 'Interval DP: solve smaller intervals first', 'Rolling array to cut space'],
    },
    compulsory: [
      { id: 'dp-2-a', title: 'Unique Paths', difficulty: 'Medium', platform: 'LeetCode', number: 62, slug: 'unique-paths', link: 'https://leetcode.com/problems/unique-paths/', hint: 'dp[i][j] = paths from top-left to (i,j). Come from above or left.', explanation: 'dp[i][j] = dp[i-1][j] + dp[i][j-1]. Only one row needed.' },
      { id: 'dp-2-b', title: 'Partition Equal Subset Sum', difficulty: 'Medium', platform: 'LeetCode', number: 416, slug: 'partition-equal-subset-sum', link: 'https://leetcode.com/problems/partition-equal-subset-sum/', hint: '0/1 Knapsack variant. Can we pick a subset summing to total/2?', explanation: 'Boolean DP. dp[j] = true if sum j is achievable. Process items in reverse.' },
      { id: 'dp-2-c', title: 'Longest Common Subsequence', difficulty: 'Medium', platform: 'LeetCode', number: 1143, slug: 'longest-common-subsequence', link: 'https://leetcode.com/problems/longest-common-subsequence/', hint: 'If chars match, dp[i][j] = 1+dp[i-1][j-1]. Else max of up/left.', explanation: 'Classic 2D DP. Can reduce to O(n) space with rolling array.' },
    ],
    optional: [
      { id: 'dp-2-d', title: 'Burst Balloons', difficulty: 'Hard', platform: 'LeetCode', number: 312, slug: 'burst-balloons', link: 'https://leetcode.com/problems/burst-balloons/' },
      { id: 'dp-2-e', title: 'Distinct Subsequences', difficulty: 'Hard', platform: 'LeetCode', number: 115, slug: 'distinct-subsequences', link: 'https://leetcode.com/problems/distinct-subsequences/' },
    ],
  },
  {
    id: 'dp-3', name: 'Expert DP — State Machines & Trees', level: 'Expert',
    slugs: [],
    nextId: null,
    theory: {
      title: 'State Machines, Tree DP & Bitmask DP',
      body: `Expert-level DP uses more complex state representations.

**State Machine DP:** Best Time to Buy/Sell Stock series — model holding/not-holding as states. Transitions encode buy/sell/cooldown actions.

**Tree DP:** Post-order traversal where dp values flow from children to parents. Used in diameter, max path sum, and tree coloring problems.

**Bitmask DP:** Subset enumeration with dp[mask] representing processed elements. O(2^n · n) — feasible for n ≤ 20.`,
      keyIdeas: ['State machine: model transitions explicitly', 'Tree DP: bottom-up via DFS', 'Bitmask for subset states', 'Profile DP for grid tiling'],
    },
    compulsory: [
      { id: 'dp-3-a', title: 'Best Time to Buy and Sell Stock with Cooldown', difficulty: 'Medium', platform: 'LeetCode', number: 309, slug: 'best-time-to-buy-and-sell-stock-with-cooldown', link: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/', hint: 'Three states: held, sold, rest. Transition at each day.', explanation: 'held[i]=max(held[i-1], rest[i-1]-price). sold[i]=held[i-1]+price. rest[i]=max(rest[i-1],sold[i-1]).' },
      { id: 'dp-3-b', title: 'House Robber III', difficulty: 'Medium', platform: 'LeetCode', number: 337, slug: 'house-robber-iii', link: 'https://leetcode.com/problems/house-robber-iii/', hint: 'Tree DP. For each node return [rob_this, skip_this] from DFS.', explanation: 'Post-order DFS. rob=node.val+l[1]+r[1]. skip=max(l)+max(r).' },
      { id: 'dp-3-c', title: 'Minimum Cost to Connect All Points', difficulty: 'Medium', platform: 'LeetCode', number: 1584, slug: 'min-cost-to-connect-points', link: 'https://leetcode.com/problems/min-cost-to-connect-points/', hint: 'Prim\'s MST or Kruskal. This is a graph problem disguised.', explanation: 'Prim\'s with O(n²) is fine here. Pick the nearest unvisited point each step.' },
    ],
    optional: [
      { id: 'dp-3-d', title: 'Traveling Salesman (Bitmask DP)', difficulty: 'Hard', platform: 'LeetCode', number: 847, slug: 'shortest-path-visiting-all-nodes', link: 'https://leetcode.com/problems/shortest-path-visiting-all-nodes/' },
    ],
  },

  /* ─── Arrays ─── */
  {
    id: 'arrays-1', name: 'Arrays & Prefix Sum', level: 'Foundation',
    slugs: ['array'],
    nextId: 'arrays-2',
    theory: {
      title: 'The Bedrock of DSA — Arrays',
      body: `Arrays are the most fundamental data structure. Mastering arrays means mastering **index manipulation**, **prefix sums**, and **in-place tricks**.

**Prefix Sum:** precompute cumulative sums so any subarray sum is O(1). prefix[i] = prefix[i-1] + nums[i-1]. subarray(l,r) = prefix[r] - prefix[l-1].

**Two Pointers:** Use left and right pointers moving inward or same-direction for sorted arrays and sliding windows.

**Kadane's Algorithm:** Max subarray in O(n). maxEnd = max(num, maxEnd+num); ans = max(ans, maxEnd).`,
      keyIdeas: ['Prefix sum for O(1) range queries', 'Two pointers for sorted arrays', 'Kadane for max subarray', 'In-place rotation tricks'],
    },
    compulsory: [
      { id: 'arr-1-a', title: 'Maximum Subarray', difficulty: 'Medium', platform: 'LeetCode', number: 53, slug: 'maximum-subarray', link: 'https://leetcode.com/problems/maximum-subarray/', hint: 'Kadane\'s: track max ending here. Reset if negative.', explanation: 'maxEnd = max(num, maxEnd+num). O(n) time, O(1) space.' },
      { id: 'arr-1-b', title: 'Product of Array Except Self', difficulty: 'Medium', platform: 'LeetCode', number: 238, slug: 'product-of-array-except-self', link: 'https://leetcode.com/problems/product-of-array-except-self/', hint: 'Left prefix products, then right suffix in a second pass. No division.', explanation: 'Two passes. res[i]=leftProduct[i]*rightProduct[i] in O(n), O(1) extra.' },
      { id: 'arr-1-c', title: 'Subarray Sum Equals K', difficulty: 'Medium', platform: 'LeetCode', number: 560, slug: 'subarray-sum-equals-k', link: 'https://leetcode.com/problems/subarray-sum-equals-k/', hint: 'prefix[i]-prefix[j]=k → look for prefix[i]-k in a hashmap.', explanation: 'HashMap counts prefix sums seen so far. O(n) time.' },
    ],
    optional: [
      { id: 'arr-1-d', title: 'Rotate Array', difficulty: 'Medium', platform: 'LeetCode', number: 189, slug: 'rotate-array', link: 'https://leetcode.com/problems/rotate-array/' },
      { id: 'arr-1-e', title: 'Find Minimum in Rotated Sorted Array', difficulty: 'Medium', platform: 'LeetCode', number: 153, slug: 'find-minimum-in-rotated-sorted-array', link: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/' },
    ],
  },
  {
    id: 'arrays-2', name: 'Advanced Arrays — Sorting & Intervals', level: 'Advanced',
    slugs: [],
    nextId: null,
    theory: {
      title: 'Sorting Tricks, Merge Intervals & Matrix',
      body: `Advanced array problems often involve **custom sorting**, **interval merging**, and **2D matrix traversal**.

**Merge Intervals:** Sort by start, then greedily merge overlapping intervals. A classic greedy pattern.

**Matrix Traversal:** Spiral order, diagonal traversal, and in-place rotation all follow clear index patterns.

**Sorting-based tricks:** Dutch National Flag (3-way partition), Custom sort comparators, and Counting Sort for bounded ranges.`,
      keyIdeas: ['Sort intervals by start, merge greedily', 'Matrix spiral: simulate boundaries', 'Dutch flag: 3-way partition', 'Counting sort for bounded values'],
    },
    compulsory: [
      { id: 'arr-2-a', title: 'Merge Intervals', difficulty: 'Medium', platform: 'LeetCode', number: 56, slug: 'merge-intervals', link: 'https://leetcode.com/problems/merge-intervals/', hint: 'Sort by start. If cur.start <= prev.end, merge by updating end.', explanation: 'Sort + single pass greedy merge. O(n log n).' },
      { id: 'arr-2-b', title: 'Sort Colors', difficulty: 'Medium', platform: 'LeetCode', number: 75, slug: 'sort-colors', link: 'https://leetcode.com/problems/sort-colors/', hint: 'Dutch National Flag: lo/mid/hi pointers. One pass.', explanation: 'lo=mid=0, hi=n-1. Swap and advance based on nums[mid].' },
      { id: 'arr-2-c', title: 'Spiral Matrix', difficulty: 'Medium', platform: 'LeetCode', number: 54, slug: 'spiral-matrix', link: 'https://leetcode.com/problems/spiral-matrix/', hint: 'Shrink boundaries: top, bottom, left, right. Process edge, then move boundary in.', explanation: 'Four loops per layer. O(m*n) time.' },
    ],
    optional: [
      { id: 'arr-2-d', title: 'First Missing Positive', difficulty: 'Hard', platform: 'LeetCode', number: 41, slug: 'first-missing-positive', link: 'https://leetcode.com/problems/first-missing-positive/' },
    ],
  },

  /* ─── Graphs ─── */
  {
    id: 'graphs-1', name: 'Graphs & BFS/DFS', level: 'Foundation',
    slugs: ['graph', 'depth-first-search', 'breadth-first-search'],
    nextId: 'graphs-2',
    theory: {
      title: 'Navigating Connections — BFS, DFS & Beyond',
      body: `A graph is nodes connected by edges. **BFS** explores level by level using a queue — finds shortest path in unweighted graphs. **DFS** dives deep using a stack or recursion — great for connectivity, cycles, and topological sort.

**Always track visited nodes** to prevent infinite loops. Use a boolean array or Set.

**Key representations:** Adjacency List (space-efficient) and Adjacency Matrix (O(1) edge lookup).

For weighted shortest paths, use **Dijkstra's algorithm** with a min-heap.`,
      keyIdeas: ['BFS = shortest path (unweighted)', 'DFS = connectivity & cycles', 'Always mark visited first', 'Multi-source BFS for simultaneous starts'],
    },
    compulsory: [
      { id: 'g-1-a', title: 'Number of Islands', difficulty: 'Medium', platform: 'LeetCode', number: 200, slug: 'number-of-islands', link: 'https://leetcode.com/problems/number-of-islands/', hint: 'DFS/BFS from each unvisited land cell. Flood-fill to mark the whole island.', explanation: 'Increment count on each DFS start. Set visited cells to \'0\'.' },
      { id: 'g-1-b', title: 'Rotting Oranges', difficulty: 'Medium', platform: 'LeetCode', number: 994, slug: 'rotting-oranges', link: 'https://leetcode.com/problems/rotting-oranges/', hint: 'Multi-source BFS from all rotten oranges simultaneously. Time = BFS levels.', explanation: 'Seed queue with all rotten cells. Each BFS level = 1 minute.' },
      { id: 'g-1-c', title: 'Course Schedule', difficulty: 'Medium', platform: 'LeetCode', number: 207, slug: 'course-schedule', link: 'https://leetcode.com/problems/course-schedule/', hint: 'Detect cycle in directed graph. DFS with 3 colors: unvisited/in-stack/done.', explanation: 'Topological sort or cycle detection via DFS. Kahn\'s BFS also works.' },
    ],
    optional: [
      { id: 'g-1-d', title: 'Clone Graph', difficulty: 'Medium', platform: 'LeetCode', number: 133, slug: 'clone-graph', link: 'https://leetcode.com/problems/clone-graph/' },
      { id: 'g-1-e', title: 'Word Ladder', difficulty: 'Hard', platform: 'LeetCode', number: 127, slug: 'word-ladder', link: 'https://leetcode.com/problems/word-ladder/' },
    ],
  },
  {
    id: 'graphs-2', name: 'Advanced Graphs — Dijkstra & Union Find', level: 'Advanced',
    slugs: [],
    nextId: null,
    theory: {
      title: 'Weighted Graphs, Shortest Paths & Union-Find',
      body: `**Dijkstra's Algorithm:** Greedy shortest path in weighted graphs. Use a min-heap priority queue. O((V+E) log V).

**Bellman-Ford:** Handles negative weights. Relax all edges V-1 times. Detects negative cycles.

**Union-Find (DSU):** Efficiently tracks connected components. Path compression + rank union gives nearly O(1) per operation.

**Minimum Spanning Tree:** Kruskal's (sort edges + DSU) or Prim's (greedy + heap).`,
      keyIdeas: ['Dijkstra = greedy with min-heap', 'Union-Find with path compression', 'Kruskal\'s = sort edges + DSU', 'Bellman-Ford for negative weights'],
    },
    compulsory: [
      { id: 'g-2-a', title: 'Network Delay Time', difficulty: 'Medium', platform: 'LeetCode', number: 743, slug: 'network-delay-time', link: 'https://leetcode.com/problems/network-delay-time/', hint: 'Dijkstra from source node. Answer is max dist among all reachable nodes.', explanation: 'Min-heap (dist, node). Relax neighbors. O((V+E) log V).' },
      { id: 'g-2-b', title: 'Number of Connected Components', difficulty: 'Medium', platform: 'LeetCode', number: 323, slug: 'number-of-connected-components-in-an-undirected-graph', link: 'https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/', hint: 'Union-Find: merge edges. Count distinct roots.', explanation: 'DSU with path compression. Count components where parent[i] == i.' },
      { id: 'g-2-c', title: 'Redundant Connection', difficulty: 'Medium', platform: 'LeetCode', number: 684, slug: 'redundant-connection', link: 'https://leetcode.com/problems/redundant-connection/', hint: 'Add edges one by one. The first edge that joins two already-connected nodes is redundant.', explanation: 'Union-Find. If find(u)==find(v) before union, return [u,v].' },
    ],
    optional: [
      { id: 'g-2-d', title: 'Cheapest Flights Within K Stops', difficulty: 'Medium', platform: 'LeetCode', number: 787, slug: 'find-the-cheapest-flights-within-k-stops', link: 'https://leetcode.com/problems/find-the-cheapest-flights-within-k-stops/' },
    ],
  },

  /* ─── Binary Search ─── */
  {
    id: 'bsearch-1', name: 'Binary Search', level: 'Foundation',
    slugs: ['binary-search'],
    nextId: 'bsearch-2',
    theory: {
      title: 'Divide and Conquer on Sorted Data',
      body: `Binary search cuts the search space in half each step — O(log n). The classic template:

**left = 0, right = n-1. while left ≤ right: mid = left+(right-left)/2**

The trick is in the boundary update. For "find first true" problems, use **left = mid+1** when condition is false, **right = mid** when true.

**Binary search on answer:** If the answer has a monotone property (e.g., "is X feasible?"), binary search on the answer range directly.`,
      keyIdeas: ['left+(right-left)/2 avoids overflow', 'Know when to use ≤ vs <', 'Binary search on answer value', 'Monotone condition = searchable'],
    },
    compulsory: [
      { id: 'bs-1-a', title: 'Binary Search', difficulty: 'Easy', platform: 'LeetCode', number: 704, slug: 'binary-search', link: 'https://leetcode.com/problems/binary-search/', hint: 'Standard template. Compare mid to target. Shrink left or right.', explanation: 'while(l<=r): mid=l+(r-l)/2. if nums[mid]==target return mid. Else shrink.' },
      { id: 'bs-1-b', title: 'Search in Rotated Sorted Array', difficulty: 'Medium', platform: 'LeetCode', number: 33, slug: 'search-in-rotated-sorted-array', link: 'https://leetcode.com/problems/search-in-rotated-sorted-array/', hint: 'One half is always sorted. Check which half and whether target falls in it.', explanation: 'At each step determine sorted half, check if target is in it, then shrink accordingly.' },
      { id: 'bs-1-c', title: 'Koko Eating Bananas', difficulty: 'Medium', platform: 'LeetCode', number: 875, slug: 'koko-eating-bananas', link: 'https://leetcode.com/problems/koko-eating-bananas/', hint: 'Binary search on eating speed k. Check if speed k finishes all piles in h hours.', explanation: 'Binary search on answer [1, max(piles)]. O(n log max) total.' },
    ],
    optional: [
      { id: 'bs-1-d', title: 'Find Peak Element', difficulty: 'Medium', platform: 'LeetCode', number: 162, slug: 'find-peak-element', link: 'https://leetcode.com/problems/find-peak-element/' },
      { id: 'bs-1-e', title: 'Median of Two Sorted Arrays', difficulty: 'Hard', platform: 'LeetCode', number: 4, slug: 'median-of-two-sorted-arrays', link: 'https://leetcode.com/problems/median-of-two-sorted-arrays/' },
    ],
  },
  {
    id: 'bsearch-2', name: 'Advanced Binary Search on Answer', level: 'Advanced',
    slugs: [],
    nextId: null,
    theory: {
      title: 'Binary Search on Answer & Matrix Search',
      body: `The most powerful application of binary search is **searching on the answer space** rather than array indices.

Recognize the pattern: "minimize the maximum" or "maximize the minimum" almost always means binary search on the answer.

**Feasibility function:** Define check(x) = "is answer x achievable?" If it's monotone (once true, always true), binary search on x.

**2D Binary Search:** Sorted matrix problems — use coordinate-based elimination (Staircase Search) in O(m+n).`,
      keyIdeas: ['Minimize-max / maximize-min = binary search answer', 'Write check() function first', 'Staircase search for 2D matrices', 'Parametric search applications'],
    },
    compulsory: [
      { id: 'bs-2-a', title: 'Capacity to Ship Packages Within D Days', difficulty: 'Medium', platform: 'LeetCode', number: 1011, slug: 'capacity-to-ship-packages-within-d-days', link: 'https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/', hint: 'Binary search on capacity. Check if given capacity ships all in D days.', explanation: 'lo=max(weights), hi=sum(weights). Greedy simulation for check().' },
      { id: 'bs-2-b', title: 'Minimize Maximum Distance to Gas Station', difficulty: 'Hard', platform: 'LeetCode', number: 774, slug: 'minimize-max-distance-to-gas-station', link: 'https://leetcode.com/problems/minimize-max-distance-to-gas-station/', hint: 'Binary search on the max distance. Check how many stations needed for that max distance.', explanation: 'Floating-point binary search. Each gap ceil(gap/ans)-1 extra stations.' },
      { id: 'bs-2-c', title: 'Search a 2D Matrix II', difficulty: 'Medium', platform: 'LeetCode', number: 240, slug: 'search-a-2d-matrix-ii', link: 'https://leetcode.com/problems/search-a-2d-matrix-ii/', hint: 'Start top-right. Go left if too big, go down if too small.', explanation: 'Staircase search. O(m+n). Each step eliminates a row or column.' },
    ],
    optional: [
      { id: 'bs-2-d', title: 'Split Array Largest Sum', difficulty: 'Hard', platform: 'LeetCode', number: 410, slug: 'split-array-largest-sum', link: 'https://leetcode.com/problems/split-array-largest-sum/' },
    ],
  },

  /* ─── Bit Manipulation ─── */
  {
    id: 'bits-1', name: 'Bit Manipulation', level: 'Foundation',
    slugs: ['bit-manipulation'],
    nextId: 'bits-2',
    theory: {
      title: 'Working Directly With Binary',
      body: `Bit manipulation operates on integers at the binary level. It unlocks O(1) or O(log n) solutions.

**Core operators:** AND (&) masks bits, OR (|) sets bits, XOR (^) toggles/cancels, NOT (~) flips. Left shift (<<) = multiply by 2, Right shift (>>) = divide by 2.

**Signature tricks:** n & (n-1) clears the lowest set bit — count set bits or check power of 2. XOR of a number with itself = 0 — find the single non-duplicate in O(n), O(1).`,
      keyIdeas: ['n & (n-1) clears lowest bit', 'XOR cancels duplicates', 'Shift = multiply/divide by 2', 'Masking extracts specific bits'],
    },
    compulsory: [
      { id: 'b-1-a', title: 'Number of 1 Bits', difficulty: 'Easy', platform: 'LeetCode', number: 191, slug: 'number-of-1-bits', link: 'https://leetcode.com/problems/number-of-1-bits/', hint: 'n & (n-1) removes the lowest set bit. Count iterations.', explanation: 'while(n): count++; n=n&(n-1). O(set bits) time.' },
      { id: 'b-1-b', title: 'Single Number', difficulty: 'Easy', platform: 'LeetCode', number: 136, slug: 'single-number', link: 'https://leetcode.com/problems/single-number/', hint: 'XOR all elements. Pairs cancel (a^a=0). Lone element remains.', explanation: 'nums.reduce((acc,n)=>acc^n,0). O(n) time, O(1) space.' },
      { id: 'b-1-c', title: 'Sum of Two Integers', difficulty: 'Medium', platform: 'LeetCode', number: 371, slug: 'sum-of-two-integers', link: 'https://leetcode.com/problems/sum-of-two-integers/', hint: 'XOR = sum without carry. AND<<1 = carry. Repeat until carry is 0.', explanation: 'while(b): carry=(a&b)<<1; a=a^b; b=carry. return a.' },
    ],
    optional: [
      { id: 'b-1-d', title: 'Reverse Bits', difficulty: 'Easy', platform: 'LeetCode', number: 190, slug: 'reverse-bits', link: 'https://leetcode.com/problems/reverse-bits/' },
      { id: 'b-1-e', title: 'Missing Number', difficulty: 'Easy', platform: 'LeetCode', number: 268, slug: 'missing-number', link: 'https://leetcode.com/problems/missing-number/' },
    ],
  },
  {
    id: 'bits-2', name: 'Advanced Bit Tricks & Bitmask', level: 'Advanced',
    slugs: [],
    nextId: null,
    theory: {
      title: 'Bitmask DP & Advanced Tricks',
      body: `Advanced bit manipulation unlocks **bitmask DP** and sophisticated tricks.

**Bitmask DP:** State = a bitmask of which elements are "used". dp[mask] where mask has bit i set if element i is used. Useful for subset enumeration problems when n ≤ 20.

**Useful tricks:** (mask >> i) & 1 checks bit i. mask | (1<<i) sets bit i. mask & ~(1<<i) clears bit i. mask & (mask-1) removes lowest set bit. Iterating all submasks: for(sub=mask; sub>0; sub=(sub-1)&mask).`,
      keyIdeas: ['Enumerate subsets: O(3^n) total', 'mask & (mask-1) for subset tricks', 'Bitmask DP for assignment problems', 'Popcount for Hamming distance'],
    },
    compulsory: [
      { id: 'b-2-a', title: 'Counting Bits', difficulty: 'Easy', platform: 'LeetCode', number: 338, slug: 'counting-bits', link: 'https://leetcode.com/problems/counting-bits/', hint: 'dp[i] = dp[i >> 1] + (i & 1). Built on previously computed values.', explanation: 'One pass, O(n). The MSB trick: dp[i] = dp[i & (i-1)] + 1 also works.' },
      { id: 'b-2-b', title: 'Single Number II', difficulty: 'Medium', platform: 'LeetCode', number: 137, slug: 'single-number-ii', link: 'https://leetcode.com/problems/single-number-ii/', hint: 'Count bits modulo 3. The unique number contributes 1 or 2 to each bit position.', explanation: 'ones = (ones ^ n) & ~twos. twos = (twos ^ n) & ~ones. O(n) O(1).' },
      { id: 'b-2-c', title: 'Shortest Path to Get All Keys', difficulty: 'Hard', platform: 'LeetCode', number: 864, slug: 'shortest-path-to-get-all-keys', link: 'https://leetcode.com/problems/shortest-path-to-get-all-keys/', hint: 'BFS with state = (row, col, keys_bitmask). Keys collected = bits set.', explanation: 'State space O(m*n*2^k). BFS guarantees shortest path.' },
    ],
    optional: [
      { id: 'b-2-d', title: 'Maximum XOR of Two Numbers in an Array', difficulty: 'Medium', platform: 'LeetCode', number: 421, slug: 'maximum-xor-of-two-numbers-in-an-array', link: 'https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/' },
    ],
  },

  /* ─── Two Pointers / Sliding Window ─── */
  {
    id: 'twoptr-1', name: 'Two Pointers & Sliding Window', level: 'Foundation',
    slugs: ['two-pointers', 'sliding-window'],
    nextId: 'twoptr-2',
    theory: {
      title: 'Smart Traversal With Two Pointers',
      body: `Two-pointer techniques eliminate nested loops by using two indices that move intelligently.

**Opposite-direction:** left starts at 0, right at end. Squeeze inward — useful for sorted arrays (Two Sum II, Container With Most Water).

**Same-direction (sliding window):** Both pointers move forward. Expand right to find valid windows, shrink left to optimize. Classic: minimum window substring, longest substring without repeating characters.

**Key insight:** Every element enters and exits the window at most once → O(n) total.`,
      keyIdeas: ['Opposite pointers for sorted data', 'Sliding window: expand right, shrink left', 'Track window state with a hash map', 'O(n) not O(n²) — linear scan'],
    },
    compulsory: [
      { id: 'tp-1-a', title: 'Two Sum II', difficulty: 'Medium', platform: 'LeetCode', number: 167, slug: 'two-sum-ii-input-array-is-sorted', link: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/', hint: 'Sorted input. Start l=0, r=end. Move based on sum vs target.', explanation: 'If sum<target: l++. If sum>target: r--. O(n) time O(1) space.' },
      { id: 'tp-1-b', title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', platform: 'LeetCode', number: 3, slug: 'longest-substring-without-repeating-characters', link: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', hint: 'Sliding window. Expand right, shrink left when duplicate found.', explanation: 'HashMap stores last index. Move left past the duplicate.' },
      { id: 'tp-1-c', title: 'Container With Most Water', difficulty: 'Medium', platform: 'LeetCode', number: 11, slug: 'container-with-most-water', link: 'https://leetcode.com/problems/container-with-most-water/', hint: 'Two pointers. Always move the shorter line inward — only it can improve.', explanation: 'area = min(h[l],h[r])*(r-l). Move shorter pointer. O(n).' },
    ],
    optional: [
      { id: 'tp-1-d', title: '3Sum', difficulty: 'Medium', platform: 'LeetCode', number: 15, slug: '3sum', link: 'https://leetcode.com/problems/3sum/' },
      { id: 'tp-1-e', title: 'Minimum Window Substring', difficulty: 'Hard', platform: 'LeetCode', number: 76, slug: 'minimum-window-substring', link: 'https://leetcode.com/problems/minimum-window-substring/' },
    ],
  },
  {
    id: 'twoptr-2', name: 'Advanced Sliding Window', level: 'Advanced',
    slugs: [],
    nextId: null,
    theory: {
      title: 'Monotonic Deques & Variable Window Patterns',
      body: `Advanced sliding window uses a **monotonic deque** to track max/min in O(1) per step.

**Monotonic Deque:** Keep indices in decreasing (or increasing) order of value. Front always holds the window's max. O(n) total because each index enters/exits once.

**Atmost K pattern:** count(atmost K) - count(atmost K-1) = count(exactly K). Transforms "exactly K" problems into two "atmost K" passes.

**Fixed window:** Some problems fix the window size. Use a deque to track max/min as window slides.`,
      keyIdeas: ['Monotonic deque for window max/min', 'Atmost(k) - atmost(k-1) = exactly(k)', 'Deque stores indices, not values', 'Front = window max/min, purge stale indices'],
    },
    compulsory: [
      { id: 'tp-2-a', title: 'Sliding Window Maximum', difficulty: 'Hard', platform: 'LeetCode', number: 239, slug: 'sliding-window-maximum', link: 'https://leetcode.com/problems/sliding-window-maximum/', hint: 'Monotonic decreasing deque. Front = window max. Remove elements outside window from front.', explanation: 'Deque stores indices. Purge front if out of window. Purge back if smaller than cur.' },
      { id: 'tp-2-b', title: 'Fruit Into Baskets', difficulty: 'Medium', platform: 'LeetCode', number: 904, slug: 'fruit-into-baskets', link: 'https://leetcode.com/problems/fruit-into-baskets/', hint: 'Max length subarray with at most 2 distinct values. Sliding window with a frequency map.', explanation: 'Expand right, shrink left when distinct > 2. Track counts.' },
      { id: 'tp-2-c', title: 'Longest Repeating Character Replacement', difficulty: 'Medium', platform: 'LeetCode', number: 424, slug: 'longest-repeating-character-replacement', link: 'https://leetcode.com/problems/longest-repeating-character-replacement/', hint: 'Window is valid if (len - maxCount) <= k. Expand, shrink, track maxCount.', explanation: 'maxCount only ever increases or stays — allows O(n) shrinking.' },
    ],
    optional: [
      { id: 'tp-2-d', title: 'Subarrays with K Different Integers', difficulty: 'Hard', platform: 'LeetCode', number: 992, slug: 'subarrays-with-k-different-integers', link: 'https://leetcode.com/problems/subarrays-with-k-different-integers/' },
    ],
  },

  /* ─── Trees ─── */
  {
    id: 'trees-1', name: 'Binary Trees & Traversal', level: 'Foundation',
    slugs: ['tree', 'binary-tree'],
    nextId: 'trees-2',
    theory: {
      title: 'Trees — Recursive Thinking at Its Best',
      body: `Binary trees are the natural home of recursive algorithms. Master the three DFS traversals first: **inorder (left-root-right)**, **preorder (root-left-right)**, **postorder (left-right-root)**.

**BFS (level-order):** Queue-based. Process level by level.

**Key recursive pattern:** Solve(node) = combine(Solve(left), Solve(right), node.val). Most tree problems follow this exactly.

**Height/Depth:** Height = 1 + max(height(left), height(right)). Check balance by comparing heights.`,
      keyIdeas: ['Recursive DFS = natural fit', 'Inorder of BST = sorted sequence', 'Height computed bottom-up', 'Level-order via BFS queue'],
    },
    compulsory: [
      { id: 'tr-1-a', title: 'Maximum Depth of Binary Tree', difficulty: 'Easy', platform: 'LeetCode', number: 104, slug: 'maximum-depth-of-binary-tree', link: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', hint: '1 + max(depth(left), depth(right)). Base: null → 0.', explanation: 'Classic recursion. Two lines. DFS naturally.' },
      { id: 'tr-1-b', title: 'Binary Tree Level Order Traversal', difficulty: 'Medium', platform: 'LeetCode', number: 102, slug: 'binary-tree-level-order-traversal', link: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', hint: 'BFS with a queue. For each level, process all nodes before moving to next.', explanation: 'Track level size at the start of each BFS iteration.' },
      { id: 'tr-1-c', title: 'Validate Binary Search Tree', difficulty: 'Medium', platform: 'LeetCode', number: 98, slug: 'validate-binary-search-tree', link: 'https://leetcode.com/problems/validate-binary-search-tree/', hint: 'Pass valid range [min, max] to each node. Tighten on descent.', explanation: 'validate(node, min, max). Left: max=node.val. Right: min=node.val.' },
    ],
    optional: [
      { id: 'tr-1-d', title: 'Lowest Common Ancestor', difficulty: 'Medium', platform: 'LeetCode', number: 236, slug: 'lowest-common-ancestor-of-a-binary-tree', link: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/' },
      { id: 'tr-1-e', title: 'Path Sum', difficulty: 'Easy', platform: 'LeetCode', number: 112, slug: 'path-sum', link: 'https://leetcode.com/problems/path-sum/' },
    ],
  },
  {
    id: 'trees-2', name: 'Advanced Trees — BST & Trie', level: 'Advanced',
    slugs: [],
    nextId: null,
    theory: {
      title: 'BST Operations, Trie & Segment Tree Intro',
      body: `**BST properties:** In-order traversal gives sorted sequence. Search/Insert/Delete are O(h) — O(log n) for balanced trees.

**Trie (Prefix Tree):** Each node represents a character. Efficient for prefix search, autocomplete, and word existence in O(word length).

**Segment Tree:** Range query & point update in O(log n). Build in O(n). Essential for competitive programming with range problems.`,
      keyIdeas: ['BST inorder = sorted array', 'Trie: O(L) search where L = word length', 'Kth smallest in BST: inorder traversal', 'Segment tree for range sum/min/max queries'],
    },
    compulsory: [
      { id: 'tr-2-a', title: 'Kth Smallest Element in a BST', difficulty: 'Medium', platform: 'LeetCode', number: 230, slug: 'kth-smallest-element-in-a-bst', link: 'https://leetcode.com/problems/kth-smallest-element-in-a-bst/', hint: 'Inorder traversal gives sorted order. Count k nodes.', explanation: 'Iterative inorder with a stack. Stop when count == k.' },
      { id: 'tr-2-b', title: 'Implement Trie (Prefix Tree)', difficulty: 'Medium', platform: 'LeetCode', number: 208, slug: 'implement-trie-prefix-tree', link: 'https://leetcode.com/problems/implement-trie-prefix-tree/', hint: 'Node has children[26] and isEnd flag. Insert: create path. Search: follow path.', explanation: 'insert/search/startsWith all traverse the trie node by node.' },
      { id: 'tr-2-c', title: 'Binary Search Tree Iterator', difficulty: 'Medium', platform: 'LeetCode', number: 173, slug: 'binary-search-tree-iterator', link: 'https://leetcode.com/problems/binary-search-tree-iterator/', hint: 'Use a stack to simulate inorder traversal lazily.', explanation: 'Push all left nodes to stack on init. next() pops, then pushes right subtree\'s lefts.' },
    ],
    optional: [
      { id: 'tr-2-d', title: 'Word Search II', difficulty: 'Hard', platform: 'LeetCode', number: 212, slug: 'word-search-ii', link: 'https://leetcode.com/problems/word-search-ii/' },
    ],
  },

  /* ─── Greedy ─── */
  {
    id: 'greedy-1', name: 'Greedy Algorithms', level: 'Foundation',
    slugs: ['greedy'],
    nextId: 'greedy-2',
    theory: {
      title: 'Making Locally Optimal Choices',
      body: `A greedy algorithm makes the **locally optimal choice** at each step, hoping to reach a globally optimal solution.

**When does greedy work?** Problems with the "greedy choice property" and "optimal substructure". The key question: "Does picking the best local choice ever lead us away from the global optimum?"

**Common patterns:** Activity Selection (pick earliest finish time), Fractional Knapsack (best value/weight ratio), Huffman Coding.

**Proof by exchange argument:** Show that swapping any greedy choice for a non-greedy one never improves the solution.`,
      keyIdeas: ['Greedy works when locally optimal = globally optimal', 'Sort + sweep is a common pattern', 'Exchange argument to prove correctness', 'Interval scheduling: sort by end time'],
    },
    compulsory: [
      { id: 'gr-1-a', title: 'Jump Game', difficulty: 'Medium', platform: 'LeetCode', number: 55, slug: 'jump-game', link: 'https://leetcode.com/problems/jump-game/', hint: 'Track max reachable index. If current index > max reachable, return false.', explanation: 'maxReach = max(maxReach, i+nums[i]). If i>maxReach: return false.' },
      { id: 'gr-1-b', title: 'Gas Station', difficulty: 'Medium', platform: 'LeetCode', number: 134, slug: 'gas-station', link: 'https://leetcode.com/problems/gas-station/', hint: 'If total gas >= total cost, a solution exists. Start from the point after the lowest prefix sum.', explanation: 'Track total and current tank. Reset start when current < 0.' },
      { id: 'gr-1-c', title: 'Partition Labels', difficulty: 'Medium', platform: 'LeetCode', number: 763, slug: 'partition-labels', link: 'https://leetcode.com/problems/partition-labels/', hint: 'Last occurrence of each char. Extend partition end as you scan.', explanation: 'end = max(end, lastIndex[c]). When i==end, close partition.' },
    ],
    optional: [
      { id: 'gr-1-d', title: 'Jump Game II', difficulty: 'Medium', platform: 'LeetCode', number: 45, slug: 'jump-game-ii', link: 'https://leetcode.com/problems/jump-game-ii/' },
      { id: 'gr-1-e', title: 'Task Scheduler', difficulty: 'Medium', platform: 'LeetCode', number: 621, slug: 'task-scheduler', link: 'https://leetcode.com/problems/task-scheduler/' },
    ],
  },
  {
    id: 'greedy-2', name: 'Advanced Greedy — Intervals & Heap', level: 'Advanced',
    slugs: [],
    nextId: null,
    theory: {
      title: 'Interval Greedy & Heap-Based Greedy',
      body: `Advanced greedy often combines with **heaps** or complex **interval manipulation**.

**Heap-based greedy:** Use a priority queue to always pick the best available item. Examples: Dijkstra, Prim's MST, Task Scheduling.

**Meeting Rooms pattern:** Sort by start time, use a min-heap of end times to check overlap. Classical O(n log n) solution.

**"Greedy from both ends":** Sometimes scanning from right or from a specific direction reveals a cleaner solution.`,
      keyIdeas: ['Min-heap to track earliest endings', 'Sort by start + min-heap of ends for rooms', 'Greedy direction matters — try both', 'Sweep line for overlapping intervals'],
    },
    compulsory: [
      { id: 'gr-2-a', title: 'Meeting Rooms II', difficulty: 'Medium', platform: 'LeetCode', number: 253, slug: 'meeting-rooms-ii', link: 'https://leetcode.com/problems/meeting-rooms-ii/', hint: 'Sort by start. Min-heap of end times. If heap.min ≤ start, reuse room. Else add room.', explanation: 'Heap size = number of rooms needed. O(n log n).' },
      { id: 'gr-2-b', title: 'Reorganize String', difficulty: 'Medium', platform: 'LeetCode', number: 767, slug: 'reorganize-string', link: 'https://leetcode.com/problems/reorganize-string/', hint: 'Max-heap by count. Alternate the most frequent char with second most.', explanation: 'Pop two chars, append, decrement, push back if count > 0.' },
      { id: 'gr-2-c', title: 'Non-overlapping Intervals', difficulty: 'Medium', platform: 'LeetCode', number: 435, slug: 'non-overlapping-intervals', link: 'https://leetcode.com/problems/non-overlapping-intervals/', hint: 'Sort by end. Greedy keep: if start >= lastEnd, keep it. Otherwise remove.', explanation: 'Minimum removals = n - maximum kept. Classic activity selection.' },
    ],
    optional: [
      { id: 'gr-2-d', title: 'IPO', difficulty: 'Hard', platform: 'LeetCode', number: 502, slug: 'ipo', link: 'https://leetcode.com/problems/ipo/' },
    ],
  },

  /* ─── Backtracking ─── */
  {
    id: 'backtrack-1', name: 'Backtracking', level: 'Foundation',
    slugs: ['backtracking'],
    nextId: 'backtrack-2',
    theory: {
      title: 'Systematic Search With Pruning',
      body: `Backtracking is DFS on a **decision tree**. At each step, try a choice, recurse, then **undo** the choice.

**Template:** solve(state) → for choice in choices: make(choice); if valid: solve(state+choice); undo(choice).

**Pruning:** Cut branches early using constraints. E.g., "remaining sum is negative" in subset sum.

The three classic backtracking types:
- **Permutations:** Order matters, no reuse.
- **Combinations/Subsets:** Order doesn't matter.
- **Constraint satisfaction:** Sudoku, N-Queens.`,
      keyIdeas: ['Always undo after recursion', 'Prune early to cut time', 'Use start index to avoid duplicates in combos', 'Swap-based permutations for in-place'],
    },
    compulsory: [
      { id: 'bt-1-a', title: 'Combination Sum', difficulty: 'Medium', platform: 'LeetCode', number: 39, slug: 'combination-sum', link: 'https://leetcode.com/problems/combination-sum/', hint: 'DFS with start index. Can reuse same element. Stop when sum > target.', explanation: 'backtrack(start, remaining). For each i>=start: add, recurse(i, rem-c[i]), remove.' },
      { id: 'bt-1-b', title: 'Permutations', difficulty: 'Medium', platform: 'LeetCode', number: 46, slug: 'permutations', link: 'https://leetcode.com/problems/permutations/', hint: 'Swap current element with each element from current position to end. Recurse. Swap back.', explanation: 'swap(i,j); backtrack(i+1); swap(i,j). O(n*n!) time.' },
      { id: 'bt-1-c', title: 'Subsets', difficulty: 'Medium', platform: 'LeetCode', number: 78, slug: 'subsets', link: 'https://leetcode.com/problems/subsets/', hint: 'For each element: either include or exclude. DFS with start index.', explanation: 'At each call, add current subset to result. Increment start to avoid reuse.' },
    ],
    optional: [
      { id: 'bt-1-d', title: 'N-Queens', difficulty: 'Hard', platform: 'LeetCode', number: 51, slug: 'n-queens', link: 'https://leetcode.com/problems/n-queens/' },
      { id: 'bt-1-e', title: 'Word Search', difficulty: 'Medium', platform: 'LeetCode', number: 79, slug: 'word-search', link: 'https://leetcode.com/problems/word-search/' },
    ],
  },
  {
    id: 'backtrack-2', name: 'Advanced Backtracking & Pruning', level: 'Advanced',
    slugs: [],
    nextId: null,
    theory: {
      title: 'Hard Constraints & Symmetry Breaking',
      body: `Advanced backtracking requires sophisticated **pruning strategies** and **symmetry breaking**.

**Symmetry breaking:** Avoid exploring equivalent states twice. Sort input, skip duplicate elements at the same recursion level.

**Forward checking:** Before recursing, check if constraints can still be satisfied (Sudoku: pre-check valid placements).

**Dancing Links (Algorithm X):** Knuth's algorithm for exact cover problems — conceptually: backtracking on a sparse matrix.`,
      keyIdeas: ['Sort + skip same-level duplicates', 'Constraint propagation before recursing', 'Break symmetry to cut search space', 'Iterative deepening for depth-limited search'],
    },
    compulsory: [
      { id: 'bt-2-a', title: 'Combination Sum II', difficulty: 'Medium', platform: 'LeetCode', number: 40, slug: 'combination-sum-ii', link: 'https://leetcode.com/problems/combination-sum-ii/', hint: 'Sort input. Skip same element at same recursion level to avoid duplicates.', explanation: 'if(i>start && c[i]==c[i-1]) continue. This prunes duplicate branches.' },
      { id: 'bt-2-b', title: 'Sudoku Solver', difficulty: 'Hard', platform: 'LeetCode', number: 37, slug: 'sudoku-solver', link: 'https://leetcode.com/problems/sudoku-solver/', hint: 'For each empty cell try 1-9. Check row/col/box validity. Recurse. Backtrack if stuck.', explanation: 'Forward checking: validate before placing. Bit sets for O(1) valid digit check.' },
      { id: 'bt-2-c', title: 'Palindrome Partitioning', difficulty: 'Medium', platform: 'LeetCode', number: 131, slug: 'palindrome-partitioning', link: 'https://leetcode.com/problems/palindrome-partitioning/', hint: 'Backtrack: if s[start..i] is a palindrome, add to path and recurse from i+1.', explanation: 'Pre-compute isPalin[i][j] with DP for O(1) palindrome check per call.' },
    ],
    optional: [
      { id: 'bt-2-d', title: 'Expression Add Operators', difficulty: 'Hard', platform: 'LeetCode', number: 282, slug: 'expression-add-operators', link: 'https://leetcode.com/problems/expression-add-operators/' },
    ],
  },

  /* ─── Stack & Monotonic Stack ─── */
  {
    id: 'stack-1', name: 'Stack & Monotonic Stack', level: 'Foundation',
    slugs: ['stack', 'monotonic-stack'],
    nextId: 'stack-2',
    theory: {
      title: 'Stack — Last In, First Out Power',
      body: `The stack is essential for **expression evaluation**, **balanced brackets**, **function call simulation**, and the elegant **monotonic stack** pattern.

**Monotonic Stack:** Maintain a stack in increasing or decreasing order. Each element is pushed/popped at most once → O(n) total. Classic use: Next Greater Element, Largest Rectangle in Histogram.

**Pattern:** For "next greater element" — maintain a decreasing stack. When a larger element arrives, it's the answer for everything it pops.`,
      keyIdeas: ['Monotonic stack → O(n) "next greater"', 'Each element pushes and pops at most once', 'Decreasing stack for next-greater', 'Increasing stack for next-smaller'],
    },
    compulsory: [
      { id: 'st-1-a', title: 'Valid Parentheses', difficulty: 'Easy', platform: 'LeetCode', number: 20, slug: 'valid-parentheses', link: 'https://leetcode.com/problems/valid-parentheses/', hint: 'Push open brackets. On close bracket check top. Mismatch = invalid.', explanation: 'Stack + map of matching pairs. O(n) time, O(n) space.' },
      { id: 'st-1-b', title: 'Daily Temperatures', difficulty: 'Medium', platform: 'LeetCode', number: 739, slug: 'daily-temperatures', link: 'https://leetcode.com/problems/daily-temperatures/', hint: 'Monotonic decreasing stack of indices. When warmer temp found, pop and record distance.', explanation: 'While stack and T[i]>T[stack.top]: pop, ans[popped]=i-popped. Push i.' },
      { id: 'st-1-c', title: 'Largest Rectangle in Histogram', difficulty: 'Hard', platform: 'LeetCode', number: 84, slug: 'largest-rectangle-in-histogram', link: 'https://leetcode.com/problems/largest-rectangle-in-histogram/', hint: 'Monotonic increasing stack. When bar drops, pop and compute rectangle using index gap.', explanation: 'Append 0 at end to flush stack. width = i - stack.top - 1. O(n).' },
    ],
    optional: [
      { id: 'st-1-d', title: 'Min Stack', difficulty: 'Medium', platform: 'LeetCode', number: 155, slug: 'min-stack', link: 'https://leetcode.com/problems/min-stack/' },
      { id: 'st-1-e', title: 'Trapping Rain Water', difficulty: 'Hard', platform: 'LeetCode', number: 42, slug: 'trapping-rain-water', link: 'https://leetcode.com/problems/trapping-rain-water/' },
    ],
  },
  {
    id: 'stack-2', name: 'Advanced Stack — Monotonic & Calculator', level: 'Advanced',
    slugs: [],
    nextId: null,
    theory: {
      title: 'Nested Structures & Expression Evaluation',
      body: `Advanced stack problems involve **nested structures** (decode string, basic calculator) and the **asterick monotonic stack** for 2D problems.

**Expression evaluation:** Two-stack approach (operands + operators) with precedence rules. Or build an AST.

**Maximal Rectangle:** Reduce to "largest rectangle in histogram" row by row. The histogram approach elegantly handles 2D.

**Sum of Subarray Minimums:** Each element contributes to subarrays where it is the minimum. Count using monotonic stack in O(n).`,
      keyIdeas: ['Two stacks for expression evaluation', 'Maximal rectangle = histogram per row', 'Contribution technique with monotonic stack', 'Decode string: stack of (count, built-string) pairs'],
    },
    compulsory: [
      { id: 'st-2-a', title: 'Decode String', difficulty: 'Medium', platform: 'LeetCode', number: 394, slug: 'decode-string', link: 'https://leetcode.com/problems/decode-string/', hint: 'Stack of (count, string_so_far). On ] pop and repeat current string count times.', explanation: 'Push (repeat_count, current_str) on [. On ] pop and multiply.' },
      { id: 'st-2-b', title: 'Maximal Rectangle', difficulty: 'Hard', platform: 'LeetCode', number: 85, slug: 'maximal-rectangle', link: 'https://leetcode.com/problems/maximal-rectangle/', hint: 'Build histogram row by row. Run largest-rectangle-in-histogram on each row.', explanation: 'heights[j] = heights[j]+1 if matrix[i][j]==\'1\' else 0. O(m*n).' },
      { id: 'st-2-c', title: 'Basic Calculator II', difficulty: 'Medium', platform: 'LeetCode', number: 227, slug: 'basic-calculator-ii', link: 'https://leetcode.com/problems/basic-calculator-ii/', hint: 'Process numbers and operators. Push to stack on + or -. Multiply/divide immediately.', explanation: 'On +/-: push ±num. On */: pop, multiply/divide, push result. Sum stack at end.' },
    ],
    optional: [
      { id: 'st-2-d', title: 'Sum of Subarray Minimums', difficulty: 'Medium', platform: 'LeetCode', number: 907, slug: 'sum-of-subarray-minimums', link: 'https://leetcode.com/problems/sum-of-subarray-minimums/' },
    ],
  },

  /* ─── Hash Table ─── */
  {
    id: 'hash-1', name: 'Hash Tables & Frequency Maps', level: 'Foundation',
    slugs: ['hash-table'],
    nextId: 'hash-2',
    theory: {
      title: 'O(1) Lookup With Hash Maps',
      body: `Hash tables provide O(1) average for insert, delete, and lookup. They are the go-to tool for **counting**, **deduplication**, and **fast complement lookup**.

**Frequency map:** count occurrences. Map character/number → count. Fundamental for anagram, top-k, and majority problems.

**Two Sum pattern:** For each element, check if its complement is already in the map. Store index or count.

**Rolling hash:** Used in Rabin-Karp string matching — compute hash incrementally in O(1).`,
      keyIdeas: ['Complement lookup: O(n) instead of O(n²)', 'Frequency map for counting problems', 'Set for O(1) existence checks', 'Handle collisions with chaining or probing'],
    },
    compulsory: [
      { id: 'ht-1-a', title: 'Two Sum', difficulty: 'Easy', platform: 'LeetCode', number: 1, slug: 'two-sum', link: 'https://leetcode.com/problems/two-sum/', hint: 'For each number, check if target-num is in the map. Store index.', explanation: 'map[num]=i. Check map[target-num] before adding. O(n).' },
      { id: 'ht-1-b', title: 'Group Anagrams', difficulty: 'Medium', platform: 'LeetCode', number: 49, slug: 'group-anagrams', link: 'https://leetcode.com/problems/group-anagrams/', hint: 'Sort each string as key. Group same-key strings together.', explanation: 'map[sorted(s)].append(s). O(n*k*log k) where k=max string length.' },
      { id: 'ht-1-c', title: 'Top K Frequent Elements', difficulty: 'Medium', platform: 'LeetCode', number: 347, slug: 'top-k-frequent-elements', link: 'https://leetcode.com/problems/top-k-frequent-elements/', hint: 'Bucket sort by frequency. Frequencies are bounded by n.', explanation: 'Bucket[freq] = [elements]. Scan from n down to 0. O(n).' },
    ],
    optional: [
      { id: 'ht-1-d', title: 'Longest Consecutive Sequence', difficulty: 'Medium', platform: 'LeetCode', number: 128, slug: 'longest-consecutive-sequence', link: 'https://leetcode.com/problems/longest-consecutive-sequence/' },
      { id: 'ht-1-e', title: 'Valid Anagram', difficulty: 'Easy', platform: 'LeetCode', number: 242, slug: 'valid-anagram', link: 'https://leetcode.com/problems/valid-anagram/' },
    ],
  },
  {
    id: 'hash-2', name: 'Advanced Hashing & Design', level: 'Advanced',
    slugs: [],
    nextId: null,
    theory: {
      title: 'LRU Cache, Random Sets & Consistent Hashing',
      body: `Advanced hash problems involve **design** — building data structures from scratch.

**LRU Cache:** Combine a HashMap (O(1) lookup) with a Doubly Linked List (O(1) move-to-front). The classic system-design-in-code interview problem.

**RandomizedSet:** Insert, Delete, GetRandom all O(1). Use HashMap for index + ArrayList for values. On delete: swap with last element.

**Consistent Hashing:** Distribution of keys across nodes. Virtual nodes for balance. Minimal key movement on node addition/removal.`,
      keyIdeas: ['LRU = HashMap + Doubly Linked List', 'RandomizedSet: array + map for O(1) random', 'Delete in O(1): swap with last, update map', 'Design: always start with what ops need O(1)'],
    },
    compulsory: [
      { id: 'ht-2-a', title: 'LRU Cache', difficulty: 'Medium', platform: 'LeetCode', number: 146, slug: 'lru-cache', link: 'https://leetcode.com/problems/lru-cache/', hint: 'HashMap<key, ListNode> + doubly linked list. move-to-front on get/put.', explanation: 'Sentinel head/tail. put: if exists move-to-front; else add front (evict tail if full).' },
      { id: 'ht-2-b', title: 'Insert Delete GetRandom O(1)', difficulty: 'Medium', platform: 'LeetCode', number: 380, slug: 'insert-delete-getrandom-o1', link: 'https://leetcode.com/problems/insert-delete-getrandom-o1/', hint: 'ArrayList of values + HashMap of val→index. Delete: swap with last, update map.', explanation: 'getRandom: list[rand(0, size-1)]. All ops O(1) amortized.' },
      { id: 'ht-2-c', title: 'Time Based Key-Value Store', difficulty: 'Medium', platform: 'LeetCode', number: 981, slug: 'time-based-key-value-store', link: 'https://leetcode.com/problems/time-based-key-value-store/', hint: 'Map<key, list of (timestamp, value)>. Binary search on timestamps for get.', explanation: 'Timestamps are always increasing → binary search for largest ≤ timestamp.' },
    ],
    optional: [
      { id: 'ht-2-d', title: 'All O`one Data Structure', difficulty: 'Hard', platform: 'LeetCode', number: 432, slug: 'all-oone-data-structure', link: 'https://leetcode.com/problems/all-oone-data-structure/' },
    ],
  },

  /* ─── Sorting & Divide/Conquer ─── */
  {
    id: 'sort-1', name: 'Sorting & Divide and Conquer', level: 'Foundation',
    slugs: ['sorting', 'divide-and-conquer', 'merge-sort'],
    nextId: 'sort-2',
    theory: {
      title: 'Sorting Algorithms & Divide & Conquer',
      body: `Sorting is the foundation of many algorithms. Mastering **merge sort** and **quick sort** conceptually is critical.

**Merge Sort:** O(n log n) always. Divide → sort halves → merge. Classic divide and conquer. Stable.

**Quick Sort:** O(n log n) average. Partition around pivot. In-place. Choose random pivot to avoid O(n²) worst case.

**Counting Sort / Radix Sort:** O(n+k) for bounded key ranges. Use when comparison-based O(n log n) is a bottleneck.`,
      keyIdeas: ['Merge sort = reliable O(n log n)', 'Quick sort = fast in practice', 'Count inversions via merge sort', 'Stable vs unstable sorting'],
    },
    compulsory: [
      { id: 'so-1-a', title: 'Sort an Array', difficulty: 'Medium', platform: 'LeetCode', number: 912, slug: 'sort-an-array', link: 'https://leetcode.com/problems/sort-an-array/', hint: 'Implement merge sort or heap sort. No built-ins.', explanation: 'Merge sort: divide at mid, sort halves, merge. O(n log n) guaranteed.' },
      { id: 'so-1-b', title: 'Merge Sorted Array', difficulty: 'Easy', platform: 'LeetCode', number: 88, slug: 'merge-sorted-array', link: 'https://leetcode.com/problems/merge-sorted-array/', hint: 'Fill from the back. Two pointers starting at ends of each array.', explanation: 'p1=m-1, p2=n-1, p=m+n-1. Place larger element at p moving backward. O(m+n).' },
      { id: 'so-1-c', title: 'Count of Smaller Numbers After Self', difficulty: 'Hard', platform: 'LeetCode', number: 315, slug: 'count-of-smaller-numbers-after-self', link: 'https://leetcode.com/problems/count-of-smaller-numbers-after-self/', hint: 'Count inversions using modified merge sort. When merging, count how many right-half elements crossed.', explanation: 'During merge: count right elements placed before left element as inversions.' },
    ],
    optional: [
      { id: 'so-1-d', title: 'Kth Largest Element in an Array', difficulty: 'Medium', platform: 'LeetCode', number: 215, slug: 'kth-largest-element-in-an-array', link: 'https://leetcode.com/problems/kth-largest-element-in-an-array/' },
    ],
  },
  {
    id: 'sort-2', name: 'Advanced Sorting — Custom & QuickSelect', level: 'Advanced',
    slugs: [],
    nextId: null,
    theory: {
      title: 'QuickSelect, Custom Comparators & External Sort',
      body: `**QuickSelect:** Find the kth smallest in O(n) average (O(n²) worst). Partition like QuickSort but only recurse into one side.

**Custom comparators:** Java's Comparator, Python's functools.cmp_to_key, or C++'s lambda comparators let you sort by arbitrary criteria.

**Patience Sorting:** Used to find LIS in O(n log n). Place cards on "piles" greedily — number of piles = LIS length.

**Comparison lower bound:** Any comparison-based sort is Ω(n log n). Beating this requires structure (counting, radix).`,
      keyIdeas: ['QuickSelect: O(n) average kth element', 'Custom sort by (key1, key2) for multi-criteria', 'Patience sort for LIS in O(n log n)', 'External sort for data larger than RAM'],
    },
    compulsory: [
      { id: 'so-2-a', title: 'Wiggle Sort II', difficulty: 'Medium', platform: 'LeetCode', number: 324, slug: 'wiggle-sort-ii', link: 'https://leetcode.com/problems/wiggle-sort-ii/', hint: 'Find median with QuickSelect. 3-way partition (Dutch flag). Place with virtual indexing.', explanation: 'Complex O(n) solution using QuickSelect + 3-way partition + index mapping.' },
      { id: 'so-2-b', title: 'Largest Number', difficulty: 'Medium', platform: 'LeetCode', number: 179, slug: 'largest-number', link: 'https://leetcode.com/problems/largest-number/', hint: 'Custom comparator: compare ab vs ba as strings. Sort descending.', explanation: 'sort key: compare str(a)+str(b) vs str(b)+str(a). Watch for "0000" edge case.' },
      { id: 'so-2-c', title: 'H-Index', difficulty: 'Medium', platform: 'LeetCode', number: 274, slug: 'h-index', link: 'https://leetcode.com/problems/h-index/', hint: 'Sort descending. Find largest h where citations[h-1] >= h.', explanation: 'Or counting sort O(n). Count papers with each citation count, scan from high.' },
    ],
    optional: [
      { id: 'so-2-d', title: 'Find the Duplicate Number', difficulty: 'Medium', platform: 'LeetCode', number: 287, slug: 'find-the-duplicate-number', link: 'https://leetcode.com/problems/find-the-duplicate-number/' },
    ],
  },

  /* ─── Linked List ─── */
  {
    id: 'll-1', name: 'Linked Lists', level: 'Foundation',
    slugs: ['linked-list'],
    nextId: 'll-2',
    theory: {
      title: 'Pointers, Cycles & Two-Pointer Tricks',
      body: `Linked lists shine with **pointer manipulation**. Most problems reduce to: traverse, modify links, or detect patterns.

**Floyd's Cycle Detection:** Slow pointer moves 1 step, fast moves 2. If they meet, there's a cycle. To find the start: move slow to head, advance both 1 step until they meet again.

**Reverse a Linked List:** prev=null, cur=head. While cur: next=cur.next; cur.next=prev; prev=cur; cur=next. Return prev.

**Dummy node trick:** Create a dummy node before head to simplify edge cases at the head.`,
      keyIdeas: ['Floyd\'s: slow+fast pointers for cycle', 'Reverse: prev/cur/next pointers', 'Dummy head for uniform edge handling', 'Find middle: slow moves half as fast'],
    },
    compulsory: [
      { id: 'll-1-a', title: 'Reverse Linked List', difficulty: 'Easy', platform: 'LeetCode', number: 206, slug: 'reverse-linked-list', link: 'https://leetcode.com/problems/reverse-linked-list/', hint: 'Iterative: prev=null. For each node: save next, point back, advance. O(n) O(1).', explanation: 'prev=null;cur=head;while cur: next=cur.next;cur.next=prev;prev=cur;cur=next. return prev.' },
      { id: 'll-1-b', title: 'Linked List Cycle', difficulty: 'Easy', platform: 'LeetCode', number: 141, slug: 'linked-list-cycle', link: 'https://leetcode.com/problems/linked-list-cycle/', hint: 'Floyd\'s cycle detection. Fast=2 steps, slow=1. If they meet, cycle exists.', explanation: 'If fast==null or fast.next==null: no cycle. Return fast==slow after loop.' },
      { id: 'll-1-c', title: 'Merge Two Sorted Lists', difficulty: 'Easy', platform: 'LeetCode', number: 21, slug: 'merge-two-sorted-lists', link: 'https://leetcode.com/problems/merge-two-sorted-lists/', hint: 'Dummy head. Compare l1 and l2. Attach smaller, advance that pointer.', explanation: 'Iterative with dummy node. Attach remaining list at end. O(m+n).' },
    ],
    optional: [
      { id: 'll-1-d', title: 'Remove Nth Node From End', difficulty: 'Medium', platform: 'LeetCode', number: 19, slug: 'remove-nth-node-from-end-of-list', link: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/' },
      { id: 'll-1-e', title: 'Reorder List', difficulty: 'Medium', platform: 'LeetCode', number: 143, slug: 'reorder-list', link: 'https://leetcode.com/problems/reorder-list/' },
    ],
  },
  {
    id: 'll-2', name: 'Advanced Linked Lists — Hard Ops', level: 'Advanced',
    slugs: [],
    nextId: null,
    theory: {
      title: 'Complex List Operations & In-Place Tricks',
      body: `Advanced linked list problems require complex in-place transformations with O(1) space.

**Reverse in groups:** Reverse every k nodes. Identify group, reverse it, connect to previous tail, move to next group.

**Skip+Delete:** For "copy list with random pointer" — interleave original and copy nodes in one pass, set random pointers, split.

**Add Numbers:** Reverse both lists, add digit by digit, handle carry, reverse result.`,
      keyIdeas: ['In-place group reversal with 4 pointers', 'Interleave trick for random pointer copy', 'Handle carry propagation in number addition', 'Flatten multilevel list with recursion or stack'],
    },
    compulsory: [
      { id: 'll-2-a', title: 'Copy List with Random Pointer', difficulty: 'Medium', platform: 'LeetCode', number: 138, slug: 'copy-list-with-random-pointer', link: 'https://leetcode.com/problems/copy-list-with-random-pointer/', hint: 'Interleave: original→copy→original→copy. Set copy.random. Split.', explanation: 'Three passes: interleave, set random pointers, split. O(n) O(1) extra.' },
      { id: 'll-2-b', title: 'Reverse Nodes in k-Group', difficulty: 'Hard', platform: 'LeetCode', number: 25, slug: 'reverse-nodes-in-k-group', link: 'https://leetcode.com/problems/reverse-nodes-in-k-group/', hint: 'Check k nodes exist. Reverse them. Connect prevTail to new head. Recurse for rest.', explanation: 'prevTail.next = reverse(cur, k); new head = recursion result of next group.' },
      { id: 'll-2-c', title: 'LFU Cache', difficulty: 'Hard', platform: 'LeetCode', number: 460, slug: 'lfu-cache', link: 'https://leetcode.com/problems/lfu-cache/', hint: 'HashMap of key→value+freq. HashMap of freq→DLL. Track minFreq.', explanation: 'On access: remove from freq-list, add to (freq+1)-list, update minFreq.' },
    ],
    optional: [
      { id: 'll-2-d', title: 'Sort List', difficulty: 'Medium', platform: 'LeetCode', number: 148, slug: 'sort-list', link: 'https://leetcode.com/problems/sort-list/' },
    ],
  },

  /* ─── Math / Number Theory ─── */
  {
    id: 'math-1', name: 'Math & Number Theory', level: 'Foundation',
    slugs: ['math', 'number-theory'],
    nextId: 'math-2',
    theory: {
      title: 'Primes, GCD & Modular Arithmetic',
      body: `Math problems in DSA cover **number theory**, **combinatorics**, and **geometry basics**.

**GCD & LCM:** Euclidean algorithm: gcd(a,b) = gcd(b, a%b). gcd(a,0)=a. LCM = a*b/gcd(a,b).

**Sieve of Eratosthenes:** Find all primes up to n in O(n log log n).

**Modular Arithmetic:** (a+b)%m = ((a%m)+(b%m))%m. For division: use Fermat's little theorem when m is prime: a^(m-2) mod m.`,
      keyIdeas: ['Euclidean GCD: O(log min(a,b))', 'Sieve of Eratosthenes for primes', '(a*b)%m to prevent overflow', 'Fermat\'s little theorem for modular inverse'],
    },
    compulsory: [
      { id: 'ma-1-a', title: 'Count Primes', difficulty: 'Medium', platform: 'LeetCode', number: 204, slug: 'count-primes', link: 'https://leetcode.com/problems/count-primes/', hint: 'Sieve of Eratosthenes. Mark multiples as composite. O(n log log n).', explanation: 'sieve[i]=true initially. For i≥2 if sieve[i]: mark j=i*i, i*i+i, ... as false.' },
      { id: 'ma-1-b', title: 'Power of Three', difficulty: 'Easy', platform: 'LeetCode', number: 326, slug: 'power-of-three', link: 'https://leetcode.com/problems/power-of-three/', hint: 'Loop: divide by 3. Remainder must always be 0. At end, n must equal 1.', explanation: 'Or: the largest int power of 3 is 1162261467. Check if it\'s divisible by n.' },
      { id: 'ma-1-c', title: 'Ugly Number II', difficulty: 'Medium', platform: 'LeetCode', number: 264, slug: 'ugly-number-ii', link: 'https://leetcode.com/problems/ugly-number-ii/', hint: 'Three pointers for factors 2, 3, 5. Each step pick the minimum next ugly.', explanation: 'dp[i]=min(dp[p2]*2, dp[p3]*3, dp[p5]*5). Advance the pointer that was used.' },
    ],
    optional: [
      { id: 'ma-1-d', title: 'Integer Break', difficulty: 'Medium', platform: 'LeetCode', number: 343, slug: 'integer-break', link: 'https://leetcode.com/problems/integer-break/' },
    ],
  },
  {
    id: 'math-2', name: 'Advanced Math — Combinatorics & Geometry', level: 'Advanced',
    slugs: [],
    nextId: null,
    theory: {
      title: 'Combinatorics, Pascal\'s Triangle & Geometry',
      body: `**Pascal\'s Triangle / Combinatorics:** C(n,k) = C(n-1,k-1)+C(n-1,k). Useful for counting paths, subsets, and probability.

**Fast Power:** a^b mod m in O(log b) using repeated squaring (binary exponentiation).

**Geometry Basics:** Cross product for direction, dot product for angle, convex hull algorithms.

**Catalan Numbers:** Count valid parenthesizations, BST shapes, monotone paths: C(n) = C(2n,n)/(n+1).`,
      keyIdeas: ['Binary exponentiation: O(log n)', 'Pascal\'s row n contains C(n,k) values', 'Cross product sign = turn direction', 'Catalan number for bracket/BST problems'],
    },
    compulsory: [
      { id: 'ma-2-a', title: 'Pow(x, n)', difficulty: 'Medium', platform: 'LeetCode', number: 50, slug: 'powx-n', link: 'https://leetcode.com/problems/powx-n/', hint: 'Fast power: if n is even, x^n = (x^(n/2))^2. Handle n<0 by x=1/x.', explanation: 'Recursive O(log n). Handle n=INT_MIN carefully (overflow on -n).' },
      { id: 'ma-2-b', title: 'Pascal\'s Triangle', difficulty: 'Easy', platform: 'LeetCode', number: 118, slug: 'pascals-triangle', link: 'https://leetcode.com/problems/pascals-triangle/', hint: 'Each element = sum of two above. First and last element of each row = 1.', explanation: 'O(n²) time and space. Build row by row.' },
      { id: 'ma-2-c', title: 'Super Pow', difficulty: 'Medium', platform: 'LeetCode', number: 372, slug: 'super-pow', link: 'https://leetcode.com/problems/super-pow/', hint: 'a^[d1,d2,...,dk] = (a^[d1,...,dk-1])^10 * a^dk. Modular at each step.', explanation: 'Recursive with modular exponentiation. Use 1337 as modulus.' },
    ],
    optional: [
      { id: 'ma-2-d', title: 'Max Points on a Line', difficulty: 'Hard', platform: 'LeetCode', number: 149, slug: 'max-points-on-a-line', link: 'https://leetcode.com/problems/max-points-on-a-line/' },
    ],
  },
];

/* Map: topic slug → entry-point topic id */
const SLUG_TO_ID = {
  'dynamic-programming': 'dp-1',
  'array':               'arrays-1',
  'string':              'twoptr-1',
  'tree':                'trees-1',
  'binary-tree':         'trees-1',
  'graph':               'graphs-1',
  'depth-first-search':  'graphs-1',
  'breadth-first-search':'graphs-1',
  'binary-search':       'bsearch-1',
  'hash-table':          'hash-1',
  'two-pointers':        'twoptr-1',
  'sliding-window':      'twoptr-1',
  'greedy':              'greedy-1',
  'backtracking':        'backtrack-1',
  'stack':               'stack-1',
  'monotonic-stack':     'stack-1',
  'sorting':             'sort-1',
  'merge-sort':          'sort-1',
  'divide-and-conquer':  'sort-1',
  'bit-manipulation':    'bits-1',
  'linked-list':         'll-1',
  'math':                'math-1',
  'number-theory':       'math-1',
  'recursion':           'backtrack-1',
};

/* Default queue if backend has no weak areas */
const DEFAULT_QUEUE = ['dp-1', 'arrays-1', 'graphs-1', 'bsearch-1', 'twoptr-1', 'hash-1', 'trees-1', 'backtrack-1', 'bits-1', 'greedy-1', 'stack-1', 'sort-1', 'll-1'];

const TOPIC_MAP = Object.fromEntries(ALL_TOPICS.map(t => [t.id, t]));
const DIFF_COLOR = { Easy: '#22C55E', Medium: '#F59E0B', Hard: '#EF4444' };

/* ── localStorage helpers ── */
function loadProgress(userId) {
  try {
    const raw = localStorage.getItem(`algomind_plan_v2_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveProgress(userId, data) {
  try { localStorage.setItem(`algomind_plan_v2_${userId}`, JSON.stringify(data)); } catch {}
}

/* ── Build initial topic queue from weak areas ── */
function buildQueue(weakAreas) {
  const seen = new Set();
  const queue = [];

  // Add topics from backend weak areas (sorted weakest first)
  for (const w of weakAreas) {
    const id = SLUG_TO_ID[w.topic_slug] ?? SLUG_TO_ID[w.topic_name?.toLowerCase().replace(/\s+/g, '-')];
    if (id && !seen.has(id)) { seen.add(id); queue.push(id); }
  }

  // Fill with defaults if not enough
  for (const id of DEFAULT_QUEUE) {
    if (!seen.has(id)) { seen.add(id); queue.push(id); }
  }

  return queue;
}

/* ── Extend queue when running low (add advanced versions) ── */
function extendQueue(queue, completedSet) {
  const extra = [];
  const inQueue = new Set(queue);
  // Add nextId of every completed topic not already queued
  for (const id of completedSet) {
    const topic = TOPIC_MAP[id];
    if (topic?.nextId && !inQueue.has(topic.nextId)) {
      inQueue.add(topic.nextId);
      extra.push(topic.nextId);
    }
  }
  // If still not enough, add more default advanced topics
  if (queue.length + extra.length < 5) {
    for (const t of ALL_TOPICS) {
      if (!inQueue.has(t.id)) {
        inQueue.add(t.id);
        extra.push(t.id);
        if (queue.length + extra.length >= 10) break;
      }
    }
  }
  return extra;
}

/* ══════════════════════════════════════════════════════════════════
   ProblemRow
══════════════════════════════════════════════════════════════════ */
function ProblemRow({ problem, isDone, isVerified, onToggle, onVerify, verifying, isDark, border, textPri, textSec, onAsk }) {
  const [drawer, setDrawer] = useState(null);
  const diffColor = DIFF_COLOR[problem.difficulty];

  return (
    <div
      className="rounded-2xl overflow-hidden transition-colors"
      style={{
        background: isVerified
          ? (isDark ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.04)')
          : isDone
            ? (isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.04)')
            : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
        border: `1px solid ${isVerified ? 'rgba(34,197,94,0.25)' : isDone ? 'rgba(99,102,241,0.2)' : border}`,
      }}
    >
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Checkbox — interactive only for optional (onToggle provided); compulsory = LC-verify only */}
        <div
          onClick={onToggle ?? undefined}
          className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${onToggle ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
          style={{
            background: isVerified ? '#22C55E' : isDone ? '#6366F1' : 'transparent',
            border: `2px solid ${isVerified ? '#22C55E' : isDone ? '#6366F1' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)')}`,
          }}
        >
          {(isDone || isVerified) && (
            <span className="material-symbols-outlined text-white" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>check</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold" style={{ color: isDone ? textSec : textPri, textDecoration: isDone && !isVerified ? 'line-through' : 'none' }}>
              {problem.number ? `#${problem.number} · ` : ''}{problem.title}
            </p>
            {isVerified && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>
                LC Verified
              </span>
            )}
          </div>
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
                background: drawer === 'hint' ? 'rgba(99,102,241,0.15)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
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
            style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: textSec, border: `1px solid ${border}` }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            Ask AI
          </button>
          {problem.slug && !isVerified && (
            <button
              onClick={() => onVerify(problem)}
              disabled={verifying === problem.id}
              className="text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-60"
              style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.25)' }}
            >
              {verifying === problem.id
                ? <span className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" />
                : <span className="material-symbols-outlined" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>verified</span>}
              {verifying === problem.id ? 'Checking…' : 'I solved it'}
            </button>
          )}
          <a
            href={problem.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-75 flex items-center gap-1"
            style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.25)' }}
          >
            Solve
            <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>open_in_new</span>
          </a>
        </div>
      </div>

      {/* Drawer */}
      {drawer && (
        <div className="px-5 pb-4" style={{ borderTop: `1px solid ${border}` }}>
          <div className="rounded-xl px-4 py-3 mt-3" style={{ background: isDark ? 'rgba(99,102,241,0.07)' : 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#6366F1' }}>
              {drawer === 'hint' ? 'Hint' : 'Explanation'}
            </p>
            <p className="text-[12px] leading-relaxed" style={{ color: textSec }}>
              {drawer === 'hint' ? problem.hint : problem.explanation}
            </p>
            {drawer === 'hint' && problem.explanation && (
              <button onClick={() => setDrawer('explain')} className="mt-2.5 text-[10px] font-bold hover:opacity-75 transition-opacity" style={{ color: '#6366F1' }}>
                Show full explanation →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Toast
══════════════════════════════════════════════════════════════════ */
function Toast({ msg, ok, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed bottom-6 right-6 z-[500] flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white animate-fade-in"
      style={{ background: ok ? '#22C55E' : '#EF4444', boxShadow: `0 8px 24px -6px ${ok ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}` }}>
      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>{ok ? 'check_circle' : 'info'}</span>
      {msg}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Main Page
══════════════════════════════════════════════════════════════════ */
function PlanViewPage({ theme, toggleTheme }) {
  const isDark   = theme === 'dark';
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id ?? 'guest';

  /* ── State ── */
  const [topicQueue,    setTopicQueue]    = useState([]);   // ordered array of topic ids
  const [currentIdx,    setCurrentIdx]    = useState(0);    // index into topicQueue
  const [completedSet,  setCompletedSet]  = useState(new Set()); // completed topic ids
  const [done,          setDone]          = useState(new Set()); // done problem ids
  const [verified,      setVerified]      = useState(new Set()); // lc-verified problem ids
  const [verifying,     setVerifying]     = useState(null);
  const [toast,         setToast]         = useState(null);
  const [loadingTopics, setLoadingTopics] = useState(true);

  /* ── Load or build progress from backend + localStorage ── */
  useEffect(() => {
    const init = async () => {
      setLoadingTopics(true);
      // Try localStorage first
      const saved = loadProgress(userId);

      if (saved) {
        setTopicQueue(saved.queue ?? []);
        setCurrentIdx(saved.currentIdx ?? 0);
        setCompletedSet(new Set(saved.completed ?? []));
        setDone(new Set(saved.done ?? []));
        setVerified(new Set(saved.verified ?? []));
        setLoadingTopics(false);
        return;
      }

      // First visit — build queue from backend
      let queue = DEFAULT_QUEUE;
      if (isAuthenticated) {
        try {
          const res = await api.get('/analytics/weak-areas/');
          const areas = res?.weak_areas ?? [];
          if (areas.length > 0) queue = buildQueue(areas);
        } catch { /* keep default */ }
      }
      setTopicQueue(queue);
      setCurrentIdx(0);
      setLoadingTopics(false);
      saveProgress(userId, { queue, currentIdx: 0, completed: [], done: [], verified: [] });
    };
    init();
  }, [userId, isAuthenticated]);

  /* ── Persist on change ── */
  const saveRef = useRef(false);
  useEffect(() => {
    if (!saveRef.current) { saveRef.current = true; return; }
    if (topicQueue.length === 0) return;
    saveProgress(userId, {
      queue:      topicQueue,
      currentIdx,
      completed:  [...completedSet],
      done:       [...done],
      verified:   [...verified],
    });
  }, [topicQueue, currentIdx, completedSet, done, verified, userId]);

  /* ── Derived ── */
  const topicId = topicQueue[currentIdx] ?? topicQueue[0] ?? DEFAULT_QUEUE[0];
  const topic   = TOPIC_MAP[topicId] ?? TOPIC_MAP[DEFAULT_QUEUE[0]];

  // Compulsory progress: only LeetCode-verified counts (no manual cheating)
  const compDone    = topic ? topic.compulsory.filter(p => verified.has(p.id)).length : 0;
  const allCompDone = topic ? compDone === topic.compulsory.length : false;

  // Visible strip: current + up to 4 upcoming
  const stripIds = topicQueue.slice(currentIdx, currentIdx + 5);

  /* ── Handlers ── */
  const toggleDone = (id) => setDone(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const verifyProblem = useCallback(async (problem) => {
    if (!isAuthenticated) { setToast({ msg: 'Sign in to verify with LeetCode', ok: false }); return; }
    setVerifying(problem.id);
    try {
      const res = await api.post('/analytics/verify-solved/', { platform: 'leetcode', slug: problem.slug });
      if (res.verified) {
        setVerified(prev => new Set([...prev, problem.id]));
        setDone(prev => new Set([...prev, problem.id]));
        setToast({ msg: `${problem.title} verified on LeetCode!`, ok: true });
      } else {
        setToast({ msg: res.detail ?? 'Not found in recent submissions. Solve on LeetCode first.', ok: false });
      }
    } catch (e) {
      setToast({ msg: e?.detail ?? 'Verification failed. Check your LeetCode handle in Settings.', ok: false });
    } finally {
      setVerifying(null);
    }
  }, [isAuthenticated]);

  const goNext = useCallback(() => {
    if (!allCompDone) return;
    // Mark current topic as completed
    const newCompleted = new Set([...completedSet, topicId]);
    setCompletedSet(newCompleted);

    // Call backend to award 200 rating
    if (isAuthenticated) {
      api.post('/auth/award-plan-completion/', { topic_id: topicId }).catch(() => {});
    }

    // Extend queue if running low
    let newQueue = [...topicQueue];
    if (currentIdx >= newQueue.length - 2) {
      const extra = extendQueue(newQueue, newCompleted);
      newQueue = [...newQueue, ...extra];
      setTopicQueue(newQueue);
    }

    setCurrentIdx(i => i + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [allCompDone, topicId, completedSet, topicQueue, currentIdx]);

  const askAI = useCallback((problem) => {
    const q = encodeURIComponent(`Help me understand and solve LeetCode #${problem.number || ''} "${problem.title}". Can you explain the approach?`);
    navigate(`/chatbot?ask=${q}`);
  }, [navigate]);

  const textPri = isDark ? '#e3e2e5' : '#0F172A';
  const textSec = isDark ? '#908fa0' : '#64748B';
  const border  = isDark ? 'rgba(70,69,84,0.18)' : 'rgba(0,0,0,0.07)';
  const surface = isDark ? '#1b1c1e' : '#FFFFFF';

  /* ── Loading state ── */
  if (loadingTopics || !topic) {
    return (
      <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const rowProps = { isDark, border, textPri, textSec, verifying, onVerify: verifyProblem };
  const isLastInQueue = currentIdx >= topicQueue.length - 1;
  const nextTopic = TOPIC_MAP[topicQueue[currentIdx + 1]];

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="max-w-3xl mx-auto pb-20">

        {/* ── Topic strip ── */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {/* Completed count badge */}
          {completedSet.size > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold"
              style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              {completedSet.size} done
            </div>
          )}
          {stripIds.map((id, i) => {
            const t = TOPIC_MAP[id];
            if (!t) return null;
            const isActive = id === topicId;
            const isPast   = completedSet.has(id);
            return (
              <button
                key={id}
                onClick={() => {
                  const realIdx = topicQueue.indexOf(id);
                  if (realIdx !== -1 && realIdx <= currentIdx) setCurrentIdx(realIdx);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all"
                style={{
                  background: isActive ? '#6366F1' : isPast ? (isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)') : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
                  color: isActive ? '#fff' : isPast ? '#6366F1' : textSec,
                  border: `1px solid ${isActive ? 'transparent' : isPast ? 'rgba(99,102,241,0.25)' : border}`,
                  boxShadow: isActive ? '0 4px 14px -4px rgba(99,102,241,0.55)' : 'none',
                  opacity: i > 0 && !isActive ? 0.6 : 1,
                }}
              >
                {isPast && <span className="material-symbols-outlined" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1", color: '#6366F1' }}>check_circle</span>}
                <span className="opacity-50 mr-0.5">
                  {isPast ? 'Done ·' : `Priority ${currentIdx + i + 1} ·`}
                </span>
                {t.name}
                {t.level !== 'Foundation' && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full ml-1"
                    style={{ background: t.level === 'Expert' ? 'rgba(239,68,68,0.15)' : 'rgba(168,85,247,0.15)', color: t.level === 'Expert' ? '#EF4444' : '#A855F7' }}>
                    {t.level}
                  </span>
                )}
              </button>
            );
          })}
          {topicQueue.length > currentIdx + 5 && (
            <span className="text-[10px] px-2 py-1 rounded-full" style={{ color: textSec, border: `1px dashed ${border}` }}>
              +{topicQueue.length - currentIdx - 5} more
            </span>
          )}
        </div>

        {/* ── Theory ── */}
        <section className="mb-12">
          <div className="flex items-start gap-4 mb-6">
            <div
              className="shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center mt-0.5"
              style={{
                background: isDark ? 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(99,102,241,0.06))' : 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(99,102,241,0.04))',
                border: '1px solid rgba(99,102,241,0.22)',
              }}
            >
              <span className="material-symbols-outlined" style={{ color: '#6366F1', fontSize: '18px' }}>menu_book</span>
            </div>
            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6366F1' }}>Core Concept</p>
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                  style={{ background: topic.level === 'Foundation' ? 'rgba(99,102,241,0.1)' : topic.level === 'Expert' ? 'rgba(239,68,68,0.1)' : 'rgba(168,85,247,0.1)', color: topic.level === 'Foundation' ? '#6366F1' : topic.level === 'Expert' ? '#EF4444' : '#A855F7' }}>
                  {topic.level}
                </span>
              </div>
              <h2 className="text-2xl font-headline font-extrabold tracking-tight" style={{ color: textPri }}>{topic.theory.title}</h2>
            </div>
          </div>

          <div className="rounded-2xl p-6 mb-5" style={{ background: surface, border: `1px solid ${border}`, boxShadow: isDark ? '0 8px 24px -8px rgba(0,0,0,0.35)' : '0 8px 24px -8px rgba(99,102,241,0.07)' }}>
            <p
              className="text-sm leading-[1.95] whitespace-pre-line"
              style={{ color: textSec }}
              dangerouslySetInnerHTML={{
                __html: topic.theory.body.replace(/\*\*(.*?)\*\*/g, `<strong style="color:${textPri};font-weight:700">$1</strong>`),
              }}
            />
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {topic.theory.keyIdeas.map((idea, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: isDark ? 'rgba(99,102,241,0.07)' : 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.14)' }}>
                  <span className="material-symbols-outlined shrink-0" style={{ fontSize: '14px', color: '#6366F1', fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                  <span className="text-[11px] font-medium" style={{ color: textPri }}>{idea}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => navigate('/chatbot')} className="flex items-center gap-2 text-sm font-bold transition-opacity hover:opacity-70" style={{ color: '#6366F1' }}>
            <span className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '15px', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </span>
            Explore more with AI Mentor
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
          </button>
        </section>

        {/* ── Compulsory problems ── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: textSec }}>Compulsory</p>
              <h3 className="text-lg font-headline font-extrabold" style={{ color: textPri }}>Practice Problems</h3>
            </div>
            <span className="text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors"
              style={{ background: allCompDone ? 'rgba(34,197,94,0.1)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'), color: allCompDone ? '#22C55E' : textSec, border: `1px solid ${allCompDone ? 'rgba(34,197,94,0.25)' : border}` }}>
              {compDone}/{topic.compulsory.length} done
            </span>
          </div>

          <div className="space-y-3">
            {topic.compulsory.map(p => (
              <ProblemRow
                key={p.id}
                problem={p}
                isDone={verified.has(p.id)}
                isVerified={verified.has(p.id)}
                onAsk={() => askAI(p)}
                {...rowProps}
              />
            ))}
          </div>

          <p className="mt-3 text-[11px]" style={{ color: textSec }}>
            Click "I solved it" to verify via LeetCode API · Ask AI for guidance
          </p>
        </section>

        {/* ── Optional problems ── */}
        {topic.optional.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-grow h-px" style={{ background: border }} />
              <p className="text-[10px] font-bold uppercase tracking-widest shrink-0" style={{ color: textSec }}>Optional — Push Further</p>
              <div className="flex-grow h-px" style={{ background: border }} />
            </div>
            <div className="space-y-3">
              {topic.optional.map(p => (
                <ProblemRow
                  key={p.id}
                  problem={p}
                  isDone={done.has(p.id)}
                  isVerified={verified.has(p.id)}
                  onToggle={() => toggleDone(p.id)}
                  onAsk={() => askAI(p)}
                  {...rowProps}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Next CTA ── */}
        <div
          className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ background: isDark ? 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(99,102,241,0.04) 100%)' : 'linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(99,102,241,0.02) 100%)', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          <div>
            {!allCompDone && (
              <p className="text-[10px] font-bold mb-1" style={{ color: '#F59E0B' }}>Complete all required problems to continue</p>
            )}
            <p className="text-sm font-bold" style={{ color: textPri }}>
              {isLastInQueue
                ? 'More topics being queued — great progress!'
                : nextTopic
                  ? `Up next: ${nextTopic.name}`
                  : 'All queued topics done!'}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: textSec }}>
              {nextTopic ? nextTopic.level : 'Topics update based on your weak areas'}
            </p>
          </div>

          <button
            onClick={goNext}
            disabled={!allCompDone}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', boxShadow: allCompDone ? '0 8px 20px -6px rgba(99,102,241,0.5)' : 'none', opacity: allCompDone ? 1 : 0.4, cursor: allCompDone ? 'pointer' : 'not-allowed' }}
          >
            Next Topic
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
          </button>
        </div>

      </div>

      {/* Toast */}
      {toast && <Toast msg={toast.msg} ok={toast.ok} onDone={() => setToast(null)} />}
    </DashboardLayout>
  );
}

export default PlanViewPage;
