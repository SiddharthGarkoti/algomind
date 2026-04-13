"""
Curated problem pool for AI shuffle.
Each entry: (title, slug, platform, url, difficulty)
"""

PROBLEM_POOL = [
    # ── Easy ─────────────────────────────────────────────────────────
    ('Two Sum',                         'two-sum',                        'leetcode', 'https://leetcode.com/problems/two-sum/',                          'easy'),
    ('Valid Parentheses',               'valid-parentheses',              'leetcode', 'https://leetcode.com/problems/valid-parentheses/',                 'easy'),
    ('Climbing Stairs',                 'climbing-stairs',                'leetcode', 'https://leetcode.com/problems/climbing-stairs/',                   'easy'),
    ('Best Time to Buy Stock',          'best-time-to-buy-and-sell-stock','leetcode', 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',   'easy'),
    ('Maximum Depth of Binary Tree',    'maximum-depth-of-binary-tree',   'leetcode', 'https://leetcode.com/problems/maximum-depth-of-binary-tree/',      'easy'),
    ('Reverse Linked List',             'reverse-linked-list',            'leetcode', 'https://leetcode.com/problems/reverse-linked-list/',               'easy'),
    ('Merge Sorted Array',              'merge-sorted-array',             'leetcode', 'https://leetcode.com/problems/merge-sorted-array/',                'easy'),
    ('Valid Anagram',                   'valid-anagram',                  'leetcode', 'https://leetcode.com/problems/valid-anagram/',                     'easy'),
    ('Binary Search',                   'binary-search',                  'leetcode', 'https://leetcode.com/problems/binary-search/',                     'easy'),
    ('Invert Binary Tree',              'invert-binary-tree',             'leetcode', 'https://leetcode.com/problems/invert-binary-tree/',                'easy'),
    ('Single Number',                   'single-number',                  'leetcode', 'https://leetcode.com/problems/single-number/',                     'easy'),
    ('Contains Duplicate',              'contains-duplicate',             'leetcode', 'https://leetcode.com/problems/contains-duplicate/',                'easy'),
    ('Linked List Cycle',               'linked-list-cycle',              'leetcode', 'https://leetcode.com/problems/linked-list-cycle/',                 'easy'),
    ('Implement Queue using Stacks',    'implement-queue-using-stacks',   'leetcode', 'https://leetcode.com/problems/implement-queue-using-stacks/',      'easy'),
    ('First Bad Version',               'first-bad-version',              'leetcode', 'https://leetcode.com/problems/first-bad-version/',                 'easy'),
    # ── Medium ───────────────────────────────────────────────────────
    ('Add Two Numbers',                 'add-two-numbers',                'leetcode', 'https://leetcode.com/problems/add-two-numbers/',                   'medium'),
    ('Longest Substring No Repeat',     'longest-substring-without-repeating-characters','leetcode','https://leetcode.com/problems/longest-substring-without-repeating-characters/','medium'),
    ('Container With Most Water',       'container-with-most-water',      'leetcode', 'https://leetcode.com/problems/container-with-most-water/',         'medium'),
    ('3Sum',                            '3sum',                           'leetcode', 'https://leetcode.com/problems/3sum/',                              'medium'),
    ('Remove Nth Node From End',        'remove-nth-node-from-end-of-list','leetcode','https://leetcode.com/problems/remove-nth-node-from-end-of-list/', 'medium'),
    ('Binary Tree Level Order',         'binary-tree-level-order-traversal','leetcode','https://leetcode.com/problems/binary-tree-level-order-traversal/','medium'),
    ('Number of Islands',               'number-of-islands',              'leetcode', 'https://leetcode.com/problems/number-of-islands/',                 'medium'),
    ('Coin Change',                     'coin-change',                    'leetcode', 'https://leetcode.com/problems/coin-change/',                       'medium'),
    ('Product of Array Except Self',    'product-of-array-except-self',   'leetcode', 'https://leetcode.com/problems/product-of-array-except-self/',      'medium'),
    ('Search in Rotated Sorted Array',  'search-in-rotated-sorted-array', 'leetcode', 'https://leetcode.com/problems/search-in-rotated-sorted-array/',    'medium'),
    ('Maximum Subarray',                'maximum-subarray',               'leetcode', 'https://leetcode.com/problems/maximum-subarray/',                  'medium'),
    ('Jump Game',                       'jump-game',                      'leetcode', 'https://leetcode.com/problems/jump-game/',                         'medium'),
    ('Merge Intervals',                 'merge-intervals',                'leetcode', 'https://leetcode.com/problems/merge-intervals/',                   'medium'),
    ('Unique Paths',                    'unique-paths',                   'leetcode', 'https://leetcode.com/problems/unique-paths/',                      'medium'),
    ('Permutations',                    'permutations',                   'leetcode', 'https://leetcode.com/problems/permutations/',                      'medium'),
    ('Subsets',                         'subsets',                        'leetcode', 'https://leetcode.com/problems/subsets/',                           'medium'),
    ('Combination Sum',                 'combination-sum',                'leetcode', 'https://leetcode.com/problems/combination-sum/',                   'medium'),
    ('Decode Ways',                     'decode-ways',                    'leetcode', 'https://leetcode.com/problems/decode-ways/',                       'medium'),
    ('House Robber',                    'house-robber',                   'leetcode', 'https://leetcode.com/problems/house-robber/',                      'medium'),
    ('Lowest Common Ancestor of BST',   'lowest-common-ancestor-of-a-binary-search-tree','leetcode','https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/','medium'),
    ('Kth Largest Element',             'kth-largest-element-in-an-array','leetcode', 'https://leetcode.com/problems/kth-largest-element-in-an-array/',  'medium'),
    ('Top K Frequent Elements',         'top-k-frequent-elements',        'leetcode', 'https://leetcode.com/problems/top-k-frequent-elements/',           'medium'),
    ('Daily Temperatures',              'daily-temperatures',             'leetcode', 'https://leetcode.com/problems/daily-temperatures/',                'medium'),
    ('Task Scheduler',                  'task-scheduler',                 'leetcode', 'https://leetcode.com/problems/task-scheduler/',                    'medium'),
    ('Course Schedule',                 'course-schedule',                'leetcode', 'https://leetcode.com/problems/course-schedule/',                   'medium'),
    ('Rotate Image',                    'rotate-image',                   'leetcode', 'https://leetcode.com/problems/rotate-image/',                      'medium'),
    ('Spiral Matrix',                   'spiral-matrix',                  'leetcode', 'https://leetcode.com/problems/spiral-matrix/',                     'medium'),
    ('Group Anagrams',                  'group-anagrams',                 'leetcode', 'https://leetcode.com/problems/group-anagrams/',                    'medium'),
    ('Evaluate Reverse Polish Notation','evaluate-reverse-polish-notation','leetcode','https://leetcode.com/problems/evaluate-reverse-polish-notation/',  'medium'),
    ('Gas Station',                     'gas-station',                    'leetcode', 'https://leetcode.com/problems/gas-station/',                       'medium'),
    # ── Hard ─────────────────────────────────────────────────────────
    ('Median of Two Sorted Arrays',     'median-of-two-sorted-arrays',    'leetcode', 'https://leetcode.com/problems/median-of-two-sorted-arrays/',       'hard'),
    ('Trapping Rain Water',             'trapping-rain-water',            'leetcode', 'https://leetcode.com/problems/trapping-rain-water/',               'hard'),
    ('Longest Valid Parentheses',       'longest-valid-parentheses',      'leetcode', 'https://leetcode.com/problems/longest-valid-parentheses/',         'hard'),
    ('Word Ladder',                     'word-ladder',                    'leetcode', 'https://leetcode.com/problems/word-ladder/',                       'hard'),
    ('Merge K Sorted Lists',            'merge-k-sorted-lists',           'leetcode', 'https://leetcode.com/problems/merge-k-sorted-lists/',              'hard'),
    ('Find Median from Data Stream',    'find-median-from-data-stream',   'leetcode', 'https://leetcode.com/problems/find-median-from-data-stream/',      'hard'),
    ('Sliding Window Maximum',          'sliding-window-maximum',         'leetcode', 'https://leetcode.com/problems/sliding-window-maximum/',            'hard'),
    ('Minimum Window Substring',        'minimum-window-substring',       'leetcode', 'https://leetcode.com/problems/minimum-window-substring/',          'hard'),
    ('Basic Calculator',                'basic-calculator',               'leetcode', 'https://leetcode.com/problems/basic-calculator/',                  'hard'),
    ('N-Queens',                        'n-queens',                       'leetcode', 'https://leetcode.com/problems/n-queens/',                          'hard'),
    ('Edit Distance',                   'edit-distance',                  'leetcode', 'https://leetcode.com/problems/edit-distance/',                     'hard'),
    ('Longest Increasing Subsequence',  'longest-increasing-subsequence', 'leetcode', 'https://leetcode.com/problems/longest-increasing-subsequence/',    'hard'),
]


# Topic tags per slug — used for filter-based shuffle
SLUG_TOPICS = {
    'two-sum': ['array', 'hash-table'],
    'valid-parentheses': ['stack', 'string'],
    'climbing-stairs': ['dynamic-programming'],
    'best-time-to-buy-and-sell-stock': ['array', 'dynamic-programming'],
    'maximum-depth-of-binary-tree': ['tree', 'binary-tree'],
    'reverse-linked-list': ['linked-list'],
    'merge-sorted-array': ['array', 'two-pointers'],
    'valid-anagram': ['string', 'hash-table'],
    'binary-search': ['binary-search', 'array'],
    'invert-binary-tree': ['tree', 'binary-tree'],
    'single-number': ['array', 'bit-manipulation'],
    'contains-duplicate': ['array', 'hash-table'],
    'linked-list-cycle': ['linked-list', 'two-pointers'],
    'implement-queue-using-stacks': ['stack', 'queue'],
    'first-bad-version': ['binary-search'],
    'add-two-numbers': ['linked-list', 'math'],
    'longest-substring-without-repeating-characters': ['string', 'sliding-window', 'hash-table'],
    'container-with-most-water': ['array', 'two-pointers', 'greedy'],
    '3sum': ['array', 'two-pointers'],
    'remove-nth-node-from-end-of-list': ['linked-list', 'two-pointers'],
    'binary-tree-level-order-traversal': ['tree', 'bfs'],
    'number-of-islands': ['graph', 'bfs', 'dfs'],
    'coin-change': ['dynamic-programming', 'array'],
    'product-of-array-except-self': ['array', 'prefix-sum'],
    'search-in-rotated-sorted-array': ['binary-search', 'array'],
    'maximum-subarray': ['array', 'dynamic-programming'],
    'jump-game': ['array', 'greedy'],
    'merge-intervals': ['array', 'sorting'],
    'unique-paths': ['dynamic-programming', 'math'],
    'permutations': ['array', 'backtracking'],
    'subsets': ['array', 'backtracking'],
    'combination-sum': ['array', 'backtracking'],
    'decode-ways': ['string', 'dynamic-programming'],
    'house-robber': ['array', 'dynamic-programming'],
    'lowest-common-ancestor-of-a-binary-search-tree': ['tree', 'bst'],
    'kth-largest-element-in-an-array': ['array', 'heap'],
    'top-k-frequent-elements': ['array', 'hash-table', 'heap'],
    'daily-temperatures': ['array', 'stack', 'monotonic-stack'],
    'task-scheduler': ['array', 'greedy', 'heap'],
    'course-schedule': ['graph', 'topological-sort', 'dfs'],
    'rotate-image': ['array', 'matrix'],
    'spiral-matrix': ['array', 'matrix'],
    'group-anagrams': ['array', 'hash-table', 'string'],
    'evaluate-reverse-polish-notation': ['array', 'stack'],
    'gas-station': ['array', 'greedy'],
    'median-of-two-sorted-arrays': ['array', 'binary-search'],
    'trapping-rain-water': ['array', 'two-pointers', 'stack'],
    'longest-valid-parentheses': ['string', 'stack', 'dynamic-programming'],
    'word-ladder': ['bfs', 'graph', 'string'],
    'merge-k-sorted-lists': ['linked-list', 'heap', 'divide-and-conquer'],
    'find-median-from-data-stream': ['heap', 'data-stream'],
    'sliding-window-maximum': ['array', 'sliding-window', 'deque'],
    'minimum-window-substring': ['string', 'sliding-window', 'hash-table'],
    'basic-calculator': ['string', 'stack', 'math'],
    'n-queens': ['backtracking'],
    'edit-distance': ['string', 'dynamic-programming'],
    'longest-increasing-subsequence': ['array', 'dynamic-programming', 'binary-search'],
}

# Canonical topic display names → slug aliases
TOPIC_ALIASES = {
    'Array': ['array'],
    'String': ['string'],
    'Dynamic Programming': ['dynamic-programming'],
    'Tree': ['tree', 'binary-tree', 'bst'],
    'Graph': ['graph', 'bfs', 'dfs', 'topological-sort'],
    'Linked List': ['linked-list'],
    'Binary Search': ['binary-search'],
    'Stack': ['stack'],
    'Hash Table': ['hash-table'],
    'Two Pointers': ['two-pointers'],
    'Greedy': ['greedy'],
    'Backtracking': ['backtracking'],
    'Heap': ['heap'],
    'Sliding Window': ['sliding-window'],
    'Matrix': ['matrix'],
    'Math': ['math'],
    'Bit Manipulation': ['bit-manipulation'],
    'Sorting': ['sorting'],
}

# All selectable topic names for the UI
ALL_TOPIC_NAMES = sorted(TOPIC_ALIASES.keys())


def shuffle_for_party(solved_slugs: set, count: int = 4,
                      topics: list = None, difficulties: list = None) -> list:
    """
    Return `count` problems the party members haven't solved yet.
    Optional filters: topics (display names) and difficulties (easy/medium/hard).
    """
    import random as rnd

    # Build allowed slug-sets for topic filter
    allowed_topic_slugs = None
    if topics:
        allowed_topic_slugs = set()
        for t in topics:
            for alias in TOPIC_ALIASES.get(t, [t.lower()]):
                allowed_topic_slugs.add(alias)

    allowed_diffs = set(difficulties) if difficulties else {'easy', 'medium', 'hard'}

    by_diff = {'easy': [], 'medium': [], 'hard': []}
    for p in PROBLEM_POOL:
        title, slug, platform, url, diff = p
        if slug in solved_slugs:
            continue
        if diff not in allowed_diffs:
            continue
        if allowed_topic_slugs:
            prob_topics = set(SLUG_TOPICS.get(slug, []))
            if not prob_topics.intersection(allowed_topic_slugs):
                continue
        by_diff[diff].append(p)

    for k in by_diff:
        rnd.shuffle(by_diff[k])

    easy_n   = max(1, count // 4)
    hard_n   = max(1, count // 4)
    medium_n = count - easy_n - hard_n

    # Respect difficulty filter distribution
    if 'easy' not in allowed_diffs:
        medium_n += easy_n; easy_n = 0
    if 'hard' not in allowed_diffs:
        medium_n += hard_n; hard_n = 0

    selected = []
    selected += by_diff['easy'][:easy_n]
    selected += by_diff['medium'][:medium_n]
    selected += by_diff['hard'][:hard_n]

    # Fill remaining slots from any available
    if len(selected) < count:
        pool = [p for p in (by_diff['easy'] + by_diff['medium'] + by_diff['hard']) if p not in selected]
        selected += pool[:count - len(selected)]

    rnd.shuffle(selected)
    return selected[:count]
