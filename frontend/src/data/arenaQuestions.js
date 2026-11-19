export const ARENA_QUESTIONS = [
  {
    id: 1,
    number: 83,
    title: 'Majority Element-I',
    slug: 'majority-element',
    diff: 'Easy',
    topic: 'Arrays',
    companies: ['Google', 'Amazon', 'Microsoft', 'Apple', 'Meta'],
    statement: `Given an integer array nums of size n, return the majority element of the array.

The majority element of an array is an element that appears more than ⌊n / 2⌋ times in the array. The array is guaranteed to have a majority element.`,
    hints: [
      'Think about what happens if we sort the array — which index must hold the majority element?',
      'Can you solve it in linear time O(N) with O(1) space using Boyer-Moore Voting Algorithm?',
      'Maintain a candidate and a count. When count reaches zero, pick the current element as new candidate.'
    ],
    examples: [
      {
        input: 'nums = [7, 0, 0, 1, 7, 7, 2, 7, 7]',
        output: '7',
        explanation: 'The number 7 appears 5 times in the 9 sized array, which is > 9/2 = 4.'
      },
      {
        input: 'nums = [1, 1, 1, 2, 1, 2]',
        output: '1',
        explanation: 'The number 1 appears 4 times in the 6 sized array, which is > 6/2 = 3.'
      }
    ],
    constraints: [
      'n == nums.length',
      '1 <= n <= 5 * 10^4',
      '-10^9 <= nums[i] <= 10^9'
    ],
    quiz: {
      question: 'Pick the correct output for the given input:',
      input: 'nums = [-1, -1, -1, -1]',
      options: ['0', '1', '-1', '4'],
      correctIndex: 2,
      explanation: 'All elements in the array are -1, so the majority element is -1.'
    },
    starterCode: {
      cpp: `class Solution {
public:
    int majorityElement(vector<int>& nums) {
        // Your code here
        int candidate = nums[0], count = 0;
        for (int x : nums) {
            if (count == 0) candidate = x;
            count += (x == candidate) ? 1 : -1;
        }
        return candidate;
    }
};`,
      python: `class Solution:
    def majorityElement(self, nums: list[int]) -> int:
        candidate, count = nums[0], 0
        for x in nums:
            if count == 0:
                candidate = x
            count += 1 if x == candidate else -1
        return candidate`,
      java: `class Solution {
    public int majorityElement(int[] nums) {
        int candidate = nums[0], count = 0;
        for (int x : nums) {
            if (count == 0) candidate = x;
            count += (x == candidate) ? 1 : -1;
        }
        return candidate;
    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var majorityElement = function(nums) {
    let candidate = nums[0], count = 0;
    for (const x of nums) {
        if (count === 0) candidate = x;
        count += (x === candidate) ? 1 : -1;
    }
    return candidate;
};`
    },
    testCases: [
      {
        id: 1,
        label: 'Case 1',
        paramName: 'nums',
        inputValue: '[7, 0, 0, 1, 7, 7, 2, 7, 7]',
        expectedOutput: '7',
        rawStdin: '9\n7 0 0 1 7 7 2 7 7'
      },
      {
        id: 2,
        label: 'Case 2',
        paramName: 'nums',
        inputValue: '[1, 1, 1, 2, 1, 2]',
        expectedOutput: '1',
        rawStdin: '6\n1 1 1 2 1 2'
      },
      {
        id: 3,
        label: 'Case 3',
        paramName: 'nums',
        inputValue: '[3, 2, 3]',
        expectedOutput: '3',
        rawStdin: '3\n3 2 3'
      }
    ],
    solution: {
      approach: 'Boyer-Moore Voting Algorithm',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1)',
      explanation: `The Boyer-Moore voting algorithm works on the observation that if we cancel out each occurrence of an element with another different element, the majority element will always remain, because it occurs strictly more than ⌊n/2⌋ times.

1. Maintain two variables: 'candidate' and 'count'.
2. Initialize count to 0.
3. For each number in the array:
   - If count is 0, assign candidate = number.
   - If number == candidate, increment count by 1.
   - Else, decrement count by 1.
4. Return candidate.`
    }
  },
  {
    id: 2,
    number: 1,
    title: 'Two Sum',
    slug: 'two-sum',
    diff: 'Easy',
    topic: 'Arrays',
    companies: ['Google', 'Amazon', 'Meta', 'Microsoft', 'Uber'],
    statement: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.`,
    hints: [
      'A brute force approach checks all pairs in O(N^2) time. Can we do better?',
      'Can a hash map help us check whether target - nums[i] has already been seen in O(1) time?'
    ],
    examples: [
      {
        input: 'nums = [2, 7, 11, 15], target = 9',
        output: '[0, 1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      },
      {
        input: 'nums = [3, 2, 4], target = 6',
        output: '[1, 2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
      }
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ],
    quiz: {
      question: 'For nums = [1, 3, 5] and target = 4, which indices sum to target?',
      input: 'nums = [1, 3, 5], target = 4',
      options: ['[0, 1]', '[1, 2]', '[0, 2]', '[0, 0]'],
      correctIndex: 0,
      explanation: 'nums[0] (1) + nums[1] (3) = 4.'
    },
    starterCode: {
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < (int)nums.size(); ++i) {
            int complement = target - nums[i];
            if (seen.count(complement)) {
                return {seen[complement], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
      python: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[]{seen.get(complement), i};
            }
            seen.put(nums[i], i);
        }
        return new int[]{};
    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const comp = target - nums[i];
        if (seen.has(comp)) return [seen.get(comp), i];
        seen.set(nums[i], i);
    }
    return [];
};`
    },
    testCases: [
      {
        id: 1,
        label: 'Case 1',
        paramName: 'nums, target',
        inputValue: 'nums = [2, 7, 11, 15], target = 9',
        expectedOutput: '[0, 1]',
        rawStdin: '4 9\n2 7 11 15'
      },
      {
        id: 2,
        label: 'Case 2',
        paramName: 'nums, target',
        inputValue: 'nums = [3, 2, 4], target = 6',
        expectedOutput: '[1, 2]',
        rawStdin: '3 6\n3 2 4'
      }
    ],
    solution: {
      approach: 'One-Pass Hash Map',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(N)',
      explanation: `Iterate through the array while keeping a hash map of values mapped to their indices. For each element, look up if (target - num) has already been stored. If so, return [storedIndex, currentIndex].`
    }
  },
  {
    id: 3,
    number: 20,
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    diff: 'Easy',
    topic: 'Stack',
    companies: ['Amazon', 'Microsoft', 'Bloomberg', 'Google'],
    statement: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    hints: [
      'Use a stack to track open brackets.',
      'When you see a closing bracket, check whether the top of the stack matches its corresponding open bracket.'
    ],
    examples: [
      {
        input: 's = "()"',
        output: 'true',
        explanation: 'Simple valid parenthesis pair.'
      },
      {
        input: 's = "()[]{}"',
        output: 'true',
        explanation: 'All brackets closed in matched order.'
      },
      {
        input: 's = "(]"',
        output: 'false',
        explanation: 'Mismatched closing bracket.'
      }
    ],
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only \'()[]{}\'.'
    ],
    quiz: {
      question: 'Is the string s = "{[]}" valid?',
      input: 's = "{[]}"',
      options: ['true', 'false', 'invalid characters', 'null'],
      correctIndex: 0,
      explanation: 'Both inner brackets [] and outer brackets {} close in proper nested order.'
    },
    starterCode: {
      cpp: `class Solution {
public:
    bool isValid(string s) {
        stack<char> st;
        for (char c : s) {
            if (c == '(' || c == '{' || c == '[') st.push(c);
            else {
                if (st.empty()) return false;
                char top = st.top(); st.pop();
                if ((c == ')' && top != '(') ||
                    (c == '}' && top != '{') ||
                    (c == ']' && top != '[')) return false;
            }
        }
        return st.empty();
    }
};`,
      python: `class Solution:
    def isValid(self, s: str) -> bool:
        stack = []
        mapping = {')': '(', '}': '{', ']': '['}
        for c in s:
            if c in mapping:
                if not stack or stack.pop() != mapping[c]:
                    return False
            else:
                stack.append(c)
        return not stack`,
      java: `class Solution {
    public boolean isValid(String s) {
        Deque<Character> st = new ArrayDeque<>();
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '{' || c == '[') st.push(c);
            else {
                if (st.isEmpty()) return false;
                char top = st.pop();
                if (c == ')' && top != '(') return false;
                if (c == '}' && top != '{') return false;
                if (c == ']' && top != '[') return false;
            }
        }
        return st.isEmpty();
    }
}`,
      javascript: `var isValid = function(s) {
    const stack = [];
    const map = { ')': '(', '}': '{', ']': '[' };
    for (const c of s) {
        if (map[c]) {
            if (stack.pop() !== map[c]) return false;
        } else {
            stack.push(c);
        }
    }
    return stack.length === 0;
};`
    },
    testCases: [
      {
        id: 1,
        label: 'Case 1',
        paramName: 's',
        inputValue: 's = "()"',
        expectedOutput: 'true',
        rawStdin: '()'
      },
      {
        id: 2,
        label: 'Case 2',
        paramName: 's',
        inputValue: 's = "()[]{}"',
        expectedOutput: 'true',
        rawStdin: '()[]{}'
      },
      {
        id: 3,
        label: 'Case 3',
        paramName: 's',
        inputValue: 's = "(]"',
        expectedOutput: 'false',
        rawStdin: '(]'
      }
    ],
    solution: {
      approach: 'LIFO Stack Matching',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(N)',
      explanation: 'Use a stack to store open brackets. Whenever a closing bracket appears, check if the stack top is its matching open bracket.'
    }
  },
  {
    id: 4,
    number: 121,
    title: 'Best Time to Buy and Sell Stock',
    slug: 'best-time-to-buy-and-sell-stock',
    diff: 'Easy',
    topic: 'Arrays',
    companies: ['Amazon', 'Apple', 'Meta', 'Google', 'Microsoft'],
    statement: `You are given an array prices where prices[i] is the price of a given stock on the ith day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.`,
    hints: [
      'Track the minimum price seen so far as you iterate.',
      'At each day, the maximum profit if selling today is currentPrice - minPriceSoFar.'
    ],
    examples: [
      {
        input: 'prices = [7, 1, 5, 3, 6, 4]',
        output: '5',
        explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6 - 1 = 5.'
      },
      {
        input: 'prices = [7, 6, 4, 3, 1]',
        output: '0',
        explanation: 'In this case, no transactions are done and the max profit = 0.'
      }
    ],
    constraints: [
      '1 <= prices.length <= 10^5',
      '0 <= prices[i] <= 10^4'
    ],
    quiz: {
      question: 'For prices = [2, 4, 1], what is the maximum profit achievable?',
      input: 'prices = [2, 4, 1]',
      options: ['2', '3', '0', '1'],
      correctIndex: 0,
      explanation: 'Buy at 2, sell at 4, profit is 2. (Cannot sell before buying).'
    },
    starterCode: {
      cpp: `class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int minPrice = INT_MAX, maxP = 0;
        for (int p : prices) {
            minPrice = min(minPrice, p);
            maxP = max(maxP, p - minPrice);
        }
        return maxP;
    }
};`,
      python: `class Solution:
    def maxProfit(self, prices: list[int]) -> int:
        min_p = float('inf')
        max_profit = 0
        for p in prices:
            min_p = min(min_p, p)
            max_profit = max(max_profit, p - min_p)
        return max_profit`,
      java: `class Solution {
    public int maxProfit(int[] prices) {
        int minPrice = Integer.MAX_VALUE, maxP = 0;
        for (int p : prices) {
            minPrice = Math.min(minPrice, p);
            maxP = Math.max(maxP, p - minPrice);
        }
        return maxP;
    }
}`,
      javascript: `var maxProfit = function(prices) {
    let minP = Infinity, maxP = 0;
    for (const p of prices) {
        if (p < minP) minP = p;
        else if (p - minP > maxP) maxP = p - minP;
    }
    return maxP;
};`
    },
    testCases: [
      {
        id: 1,
        label: 'Case 1',
        paramName: 'prices',
        inputValue: 'prices = [7, 1, 5, 3, 6, 4]',
        expectedOutput: '5',
        rawStdin: '6\n7 1 5 3 6 4'
      },
      {
        id: 2,
        label: 'Case 2',
        paramName: 'prices',
        inputValue: 'prices = [7, 6, 4, 3, 1]',
        expectedOutput: '0',
        rawStdin: '5\n7 6 4 3 1'
      }
    ],
    solution: {
      approach: 'Single Pass Dynamic Tracking',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1)',
      explanation: 'Track the running minimum price and compare profit at each step.'
    }
  },
  {
    id: 5,
    number: 53,
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    diff: 'Medium',
    topic: 'Arrays',
    companies: ['Amazon', 'Microsoft', 'Google', 'Apple', 'LinkedIn'],
    statement: `Given an integer array nums, find the subarray with the largest sum, and return its sum.

A subarray is a contiguous non-empty sequence of elements within an array.`,
    hints: [
      "Kadane's Algorithm maintains a running sum. If the running sum drops below zero, reset it to zero.",
      'At each index, decide whether to extend the previous subarray or start fresh from current element.'
    ],
    examples: [
      {
        input: 'nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]',
        output: '6',
        explanation: 'The subarray [4, -1, 2, 1] has the largest sum 6.'
      },
      {
        input: 'nums = [1]',
        output: '1',
        explanation: 'The subarray [1] has the largest sum 1.'
      }
    ],
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^4 <= nums[i] <= 10^4'
    ],
    quiz: {
      question: 'For nums = [5, 4, -1, 7, 8], what is the maximum subarray sum?',
      input: 'nums = [5, 4, -1, 7, 8]',
      options: ['23', '24', '15', '20'],
      correctIndex: 0,
      explanation: 'All elements sum to 5 + 4 - 1 + 7 + 8 = 23.'
    },
    starterCode: {
      cpp: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int maxSum = nums[0], currentSum = 0;
        for (int x : nums) {
            currentSum = max(x, currentSum + x);
            maxSum = max(maxSum, currentSum);
        }
        return maxSum;
    }
};`,
      python: `class Solution:
    def maxSubArray(self, nums: list[int]) -> int:
        cur_sum = max_sum = nums[0]
        for x in nums[1:]:
            cur_sum = max(x, cur_sum + x)
            max_sum = max(max_sum, cur_sum)
        return max_sum`,
      java: `class Solution {
    public int maxSubArray(int[] nums) {
        int cur = nums[0], max = nums[0];
        for (int i = 1; i < nums.length; i++) {
            cur = Math.max(nums[i], cur + nums[i]);
            max = Math.max(max, cur);
        }
        return max;
    }
}`,
      javascript: `var maxSubArray = function(nums) {
    let cur = nums[0], max = nums[0];
    for (let i = 1; i < nums.length; i++) {
        cur = Math.max(nums[i], cur + nums[i]);
        max = Math.max(max, cur);
    }
    return max;
};`
    },
    testCases: [
      {
        id: 1,
        label: 'Case 1',
        paramName: 'nums',
        inputValue: 'nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]',
        expectedOutput: '6',
        rawStdin: '9\n-2 1 -3 4 -1 2 1 -5 4'
      },
      {
        id: 2,
        label: 'Case 2',
        paramName: 'nums',
        inputValue: 'nums = [5, 4, -1, 7, 8]',
        expectedOutput: '23',
        rawStdin: '5\n5 4 -1 7 8'
      }
    ],
    solution: {
      approach: "Kadane's Algorithm",
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1)',
      explanation: 'Keep a running sum. At each index, either append current element to current subarray or start a new subarray.'
    }
  },
  {
    id: 6,
    number: 206,
    title: 'Reverse Linked List',
    slug: 'reverse-linked-list',
    diff: 'Easy',
    topic: 'Linked List',
    companies: ['Microsoft', 'Amazon', 'Apple', 'Meta', 'Google'],
    statement: `Given the head of a singly linked list, reverse the list, and return the reversed list.`,
    hints: [
      'Maintain three pointers: prev, current, and next.',
      'Reverse the pointer direction one node at a time.'
    ],
    examples: [
      {
        input: 'head = [1, 2, 3, 4, 5]',
        output: '[5, 4, 3, 2, 1]',
        explanation: 'The linked list direction is inverted from head to tail.'
      },
      {
        input: 'head = [1, 2]',
        output: '[2, 1]',
        explanation: 'Reversing 1 -> 2 yields 2 -> 1.'
      }
    ],
    constraints: [
      'The number of nodes in the list is the range [0, 5000].',
      '-5000 <= Node.val <= 5000'
    ],
    quiz: {
      question: 'What is the reverse of list head = [3]?',
      input: 'head = [3]',
      options: ['[3]', '[]', '[null]', '[0]'],
      correctIndex: 0,
      explanation: 'A single node list remains [3] when reversed.'
    },
    starterCode: {
      cpp: `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        ListNode* curr = head;
        while (curr != nullptr) {
            ListNode* nxt = curr->next;
            curr->next = prev;
            prev = curr;
            curr = nxt;
        }
        return prev;
    }
};`,
      python: `class Solution:
    def reverseList(self, head):
        prev = None
        curr = head
        while curr:
            nxt = curr.next
            curr.next = prev
            prev = curr
            curr = nxt
        return prev`,
      java: `class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;
        while (curr != null) {
            ListNode nxt = curr.next;
            curr.next = prev;
            prev = curr;
            curr = nxt;
        }
        return prev;
    }
}`,
      javascript: `var reverseList = function(head) {
    let prev = null, curr = head;
    while (curr) {
        const nxt = curr.next;
        curr.next = prev;
        prev = curr;
        curr = nxt;
    }
    return prev;
};`
    },
    testCases: [
      {
        id: 1,
        label: 'Case 1',
        paramName: 'head',
        inputValue: 'head = [1, 2, 3, 4, 5]',
        expectedOutput: '[5, 4, 3, 2, 1]',
        rawStdin: '5\n1 2 3 4 5'
      }
    ],
    solution: {
      approach: 'Iterative 3-Pointer Inversion',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1)',
      explanation: 'Using prev, curr, and nxt pointers, re-link each node to point backward.'
    }
  },
  {
    id: 7,
    number: 3,
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating-characters',
    diff: 'Medium',
    topic: 'Strings',
    companies: ['Amazon', 'Microsoft', 'Meta', 'Google', 'Adobe'],
    statement: `Given a string s, find the length of the longest substring without repeating characters.

A substring is a contiguous non-empty sequence of characters within a string.`,
    hints: [
      'Use a sliding window with left and right pointers.',
      'Maintain a set or frequency map of characters in the current window.'
    ],
    examples: [
      {
        input: 's = "abcabcbb"',
        output: '3',
        explanation: 'The answer is "abc", with the length of 3.'
      },
      {
        input: 's = "bbbbb"',
        output: '1',
        explanation: 'The answer is "b", with the length of 1.'
      }
    ],
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.'
    ],
    quiz: {
      question: 'For s = "pwwkew", what is the length of the longest substring without repeats?',
      input: 's = "pwwkew"',
      options: ['3', '2', '4', '5'],
      correctIndex: 0,
      explanation: 'The substring is "wke", with length 3.'
    },
    starterCode: {
      cpp: `class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        vector<int> last(256, -1);
        int maxLen = 0, left = 0;
        for (int right = 0; right < (int)s.size(); ++right) {
            if (last[(unsigned char)s[right]] >= left) {
                left = last[(unsigned char)s[right]] + 1;
            }
            last[(unsigned char)s[right]] = right;
            maxLen = max(maxLen, right - left + 1);
        }
        return maxLen;
    }
};`,
      python: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        last = {}
        max_len = left = 0
        for right, c in enumerate(s):
            if c in last and last[c] >= left:
                left = last[c] + 1
            last[c] = right
            max_len = max(max_len, right - left + 1)
        return max_len`,
      java: `class Solution {
    public int lengthOfLongestSubstring(String s) {
        int[] last = new int[256];
        Arrays.fill(last, -1);
        int maxLen = 0, left = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            if (last[c] >= left) left = last[c] + 1;
            last[c] = right;
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }
}`,
      javascript: `var lengthOfLongestSubstring = function(s) {
    const last = new Map();
    let maxLen = 0, left = 0;
    for (let right = 0; right < s.length; right++) {
        const c = s[right];
        if (last.has(c) && last.get(c) >= left) {
            left = last.get(c) + 1;
        }
        last.set(c, right);
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
};`
    },
    testCases: [
      {
        id: 1,
        label: 'Case 1',
        paramName: 's',
        inputValue: 's = "abcabcbb"',
        expectedOutput: '3',
        rawStdin: 'abcabcbb'
      },
      {
        id: 2,
        label: 'Case 2',
        paramName: 's',
        inputValue: 's = "bbbbb"',
        expectedOutput: '1',
        rawStdin: 'bbbbb'
      }
    ],
    solution: {
      approach: 'Sliding Window with Last-Seen Index Map',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(min(N, alphabetSize))',
      explanation: 'Advance the right pointer. If a duplicate character is seen within the current window, contract left to right + 1.'
    }
  },
  {
    id: 8,
    number: 704,
    title: 'Binary Search',
    slug: 'binary-search',
    diff: 'Easy',
    topic: 'Binary Search',
    companies: ['Apple', 'Google', 'Microsoft', 'Amazon'],
    statement: `Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.

You must write an algorithm with O(log n) runtime complexity.`,
    hints: [
      'Use mid = left + (right - left) / 2 to avoid integer overflow.',
      'If nums[mid] == target, return mid; if nums[mid] < target search right; else search left.'
    ],
    examples: [
      {
        input: 'nums = [-1, 0, 3, 5, 9, 12], target = 9',
        output: '4',
        explanation: '9 exists in nums and its index is 4.'
      },
      {
        input: 'nums = [-1, 0, 3, 5, 9, 12], target = 2',
        output: '-1',
        explanation: '2 does not exist in nums so return -1.'
      }
    ],
    constraints: [
      '1 <= nums.length <= 10^4',
      '-10^4 < nums[i], target < 10^4',
      'All integers in nums are unique and sorted in ascending order.'
    ],
    quiz: {
      question: 'For nums = [1, 3, 7, 10] and target = 3, what index is returned?',
      input: 'nums = [1, 3, 7, 10], target = 3',
      options: ['1', '0', '2', '-1'],
      correctIndex: 0,
      explanation: '3 is at index 1.'
    },
    starterCode: {
      cpp: `class Solution {
public:
    int search(vector<int>& nums, int target) {
        int left = 0, right = (int)nums.size() - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }
};`,
      python: `class Solution:
    def search(self, nums: list[int], target: int) -> int:
        left, right = 0, len(nums) - 1
        while left <= right:
            mid = (left + right) // 2
            if nums[mid] == target:
                return mid
            elif nums[mid] < target:
                left = mid + 1
            else:
                right = mid - 1
        return -1`,
      java: `class Solution {
    public int search(int[] nums, int target) {
        int left = 0, right = nums.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }
}`,
      javascript: `var search = function(nums, target) {
    let left = 0, right = nums.length - 1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (nums[mid] === target) return mid;
        if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
};`
    },
    testCases: [
      {
        id: 1,
        label: 'Case 1',
        paramName: 'nums, target',
        inputValue: 'nums = [-1, 0, 3, 5, 9, 12], target = 9',
        expectedOutput: '4',
        rawStdin: '6 9\n-1 0 3 5 9 12'
      },
      {
        id: 2,
        label: 'Case 2',
        paramName: 'nums, target',
        inputValue: 'nums = [-1, 0, 3, 5, 9, 12], target = 2',
        expectedOutput: '-1',
        rawStdin: '6 2\n-1 0 3 5 9 12'
      }
    ],
    solution: {
      approach: 'Classic Logarithmic Binary Search',
      timeComplexity: 'O(log N)',
      spaceComplexity: 'O(1)',
      explanation: 'Halve the search space at each comparison by checking the middle element.'
    }
  },
  {
    id: 9,
    number: 70,
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    diff: 'Easy',
    topic: 'DP',
    companies: ['Amazon', 'Google', 'Apple', 'Meta', 'Adobe'],
    statement: `You are climbing a staircase. It takes n steps to reach the top.

Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?`,
    hints: [
      'To reach step n, you can either take 1 step from n - 1 or 2 steps from n - 2.',
      'This is equivalent to the Fibonacci recurrence: ways(n) = ways(n-1) + ways(n-2).'
    ],
    examples: [
      {
        input: 'n = 2',
        output: '2',
        explanation: 'There are two ways to climb to the top: 1 step + 1 step, or 2 steps.'
      },
      {
        input: 'n = 3',
        output: '3',
        explanation: 'There are three ways: 1+1+1, 1+2, or 2+1.'
      }
    ],
    constraints: [
      '1 <= n <= 45'
    ],
    quiz: {
      question: 'How many ways are there to climb n = 4 steps?',
      input: 'n = 4',
      options: ['5', '4', '6', '8'],
      correctIndex: 0,
      explanation: 'ways(4) = ways(3) + ways(2) = 3 + 2 = 5.'
    },
    starterCode: {
      cpp: `class Solution {
public:
    int climbStairs(int n) {
        if (n <= 2) return n;
        int a = 1, b = 2;
        for (int i = 3; i <= n; ++i) {
            int c = a + b;
            a = b;
            b = c;
        }
        return b;
    }
};`,
      python: `class Solution:
    def climbStairs(self, n: int) -> int:
        if n <= 2:
            return n
        a, b = 1, 2
        for _ in range(3, n + 1):
            a, b = b, a + b
        return b`,
      java: `class Solution {
    public int climbStairs(int n) {
        if (n <= 2) return n;
        int a = 1, b = 2;
        for (int i = 3; i <= n; i++) {
            int c = a + b;
            a = b;
            b = c;
        }
        return b;
    }
}`,
      javascript: `var climbStairs = function(n) {
    if (n <= 2) return n;
    let a = 1, b = 2;
    for (let i = 3; i <= n; i++) {
        const c = a + b;
        a = b;
        b = c;
    }
    return b;
};`
    },
    testCases: [
      {
        id: 1,
        label: 'Case 1',
        paramName: 'n',
        inputValue: 'n = 2',
        expectedOutput: '2',
        rawStdin: '2'
      },
      {
        id: 2,
        label: 'Case 2',
        paramName: 'n',
        inputValue: 'n = 3',
        expectedOutput: '3',
        rawStdin: '3'
      }
    ],
    solution: {
      approach: 'Bottom-Up Constant-Space DP',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1)',
      explanation: 'Base cases ways(1)=1, ways(2)=2. Compute iteratively keeping only the last two results.'
    }
  },
  {
    id: 10,
    number: 15,
    title: '3Sum',
    slug: '3sum',
    diff: 'Medium',
    topic: 'Arrays',
    companies: ['Meta', 'Amazon', 'Apple', 'Google', 'Microsoft'],
    statement: `Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.

Notice that the solution set must not contain duplicate triplets.`,
    hints: [
      'Sort the array first so two pointers can be used.',
      'Fix the first element nums[i] and use two pointers (left and right) to find pairs summing to -nums[i].'
    ],
    examples: [
      {
        input: 'nums = [-1, 0, 1, 2, -1, -4]',
        output: '[[-1, -1, 2], [-1, 0, 1]]',
        explanation: 'nums[0] + nums[1] + nums[2] == 0. Duplicate triplets are omitted.'
      },
      {
        input: 'nums = [0, 1, 1]',
        output: '[]',
        explanation: 'No triplets sum to 0.'
      }
    ],
    constraints: [
      '3 <= nums.length <= 3000',
      '-10^5 <= nums[i] <= 10^5'
    ],
    quiz: {
      question: 'For nums = [0, 0, 0], how many unique triplets sum to 0?',
      input: 'nums = [0, 0, 0]',
      options: ['1', '0', '3', '6'],
      correctIndex: 0,
      explanation: 'The only unique triplet is [[0, 0, 0]].'
    },
    starterCode: {
      cpp: `class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        vector<vector<int>> res;
        sort(nums.begin(), nums.end());
        int n = nums.size();
        for (int i = 0; i < n - 2; ++i) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int l = i + 1, r = n - 1;
            while (l < r) {
                int sum = nums[i] + nums[l] + nums[r];
                if (sum == 0) {
                    res.push_back({nums[i], nums[l], nums[r]});
                    while (l < r && nums[l] == nums[l + 1]) ++l;
                    while (l < r && nums[r] == nums[r - 1]) --r;
                    ++l; --r;
                } else if (sum < 0) ++l;
                else --r;
            }
        }
        return res;
    }
};`,
      python: `class Solution:
    def threeSum(self, nums: list[int]) -> list[list[int]]:
        nums.sort()
        res = []
        for i in range(len(nums) - 2):
            if i > 0 and nums[i] == nums[i - 1]:
                continue
            l, r = i + 1, len(nums) - 1
            while l < r:
                s = nums[i] + nums[l] + nums[r]
                if s == 0:
                    res.append([nums[i], nums[l], nums[r]])
                    while l < r and nums[l] == nums[l + 1]:
                        l += 1
                    while l < r and nums[r] == nums[r - 1]:
                        r -= 1
                    l += 1
                    r -= 1
                elif s < 0:
                    l += 1
                else:
                    r -= 1
        return res`,
      java: `class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        List<List<Integer>> res = new ArrayList<>();
        Arrays.sort(nums);
        for (int i = 0; i < nums.length - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int l = i + 1, r = nums.length - 1;
            while (l < r) {
                int sum = nums[i] + nums[l] + nums[r];
                if (sum == 0) {
                    res.add(Arrays.asList(nums[i], nums[l], nums[r]));
                    while (l < r && nums[l] == nums[l + 1]) l++;
                    while (l < r && nums[r] == nums[r - 1]) r--;
                    l++; r--;
                } else if (sum < 0) l++;
                else r--;
            }
        }
        return res;
    }
}`,
      javascript: `var threeSum = function(nums) {
    nums.sort((a, b) => a - b);
    const res = [];
    for (let i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] === nums[i - 1]) continue;
        let l = i + 1, r = nums.length - 1;
        while (l < r) {
            const sum = nums[i] + nums[l] + nums[r];
            if (sum === 0) {
                res.push([nums[i], nums[l], nums[r]]);
                while (l < r && nums[l] === nums[l + 1]) l++;
                while (l < r && nums[r] === nums[r - 1]) r--;
                l++; r--;
            } else if (sum < 0) l++;
            else r--;
        }
    }
    return res;
};`
    },
    testCases: [
      {
        id: 1,
        label: 'Case 1',
        paramName: 'nums',
        inputValue: 'nums = [-1, 0, 1, 2, -1, -4]',
        expectedOutput: '[[-1, -1, 2], [-1, 0, 1]]',
        rawStdin: '6\n-1 0 1 2 -1 -4'
      }
    ],
    solution: {
      approach: 'Sort + Two Pointers',
      timeComplexity: 'O(N^2)',
      spaceComplexity: 'O(1) excluding output',
      explanation: 'Sort the array. Fix each element and run a two-pointer scan to find matching complementary pairs, skipping duplicates.'
    }
  },
  {
    id: 11,
    number: 175,
    title: 'Department Highest Salary (SQL)',
    slug: 'department-highest-salary',
    diff: 'Medium',
    topic: 'SQL',
    companies: ['Amazon', 'Google', 'Bloomberg', 'Microsoft', 'Oracle'],
    statement: `Find employees who have the highest salary in each of the departments.
Return the result table in any order.

Table: Employee
+--------------+---------+
| Column Name  | Type    |
+--------------+---------+
| id           | int     |
| name         | varchar |
| salary       | int     |
| departmentId | int     |
+--------------+---------+

Table: Department
+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| id          | int     |
| name        | varchar |
+-------------+---------+`,
    hints: [
      'Use a subquery with MAX(salary) grouped by departmentId.',
      'Alternatively, use the DENSE_RANK() window function partitioned by departmentId.',
      'Join Employee with Department on Employee.departmentId = Department.id.'
    ],
    examples: [
      {
        input: 'Employee = [[1, "Joe", 70000, 1], [2, "Jim", 90000, 1], [3, "Henry", 80000, 2]], Department = [[1, "IT"], [2, "Sales"]]',
        output: '+------------+----------+--------+\n| Department | Employee | Salary |\n+------------+----------+--------+\n| IT         | Jim      | 90000  |\n| Sales      | Henry    | 80000  |\n+------------+----------+--------+',
        explanation: 'Jim has the highest salary in IT and Henry has the highest salary in Sales.'
      }
    ],
    constraints: [
      'id is the primary key column for each table.',
      'departmentId is a foreign key of the ID from the Department table.'
    ],
    schema: `
      CREATE TABLE IF NOT EXISTS Employee (id INT PRIMARY KEY, name VARCHAR(50), salary INT, departmentId INT);
      INSERT OR IGNORE INTO Employee VALUES (1, 'Joe', 70000, 1);
      INSERT OR IGNORE INTO Employee VALUES (2, 'Jim', 90000, 1);
      INSERT OR IGNORE INTO Employee VALUES (3, 'Henry', 80000, 2);
      INSERT OR IGNORE INTO Employee VALUES (4, 'Sam', 60000, 2);
      INSERT OR IGNORE INTO Employee VALUES (5, 'Max', 90000, 1);

      CREATE TABLE IF NOT EXISTS Department (id INT PRIMARY KEY, name VARCHAR(50));
      INSERT OR IGNORE INTO Department VALUES (1, 'IT');
      INSERT OR IGNORE INTO Department VALUES (2, 'Sales');
    `,
    starterCode: {
      mysql: `-- MySQL Query
SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary
FROM Employee e
JOIN Department d ON e.departmentId = d.id
WHERE (e.departmentId, e.salary) IN (
    SELECT departmentId, MAX(salary)
    FROM Employee
    GROUP BY departmentId
);`,
      postgres: `-- PostgreSQL Query
SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary
FROM Employee e
JOIN Department d ON e.departmentId = d.id
WHERE (e.departmentId, e.salary) IN (
    SELECT departmentId, MAX(salary)
    FROM Employee
    GROUP BY departmentId
);`,
      oracle: `-- Oracle SQL Query
SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary
FROM Employee e
JOIN Department d ON e.departmentId = d.id
WHERE (e.departmentId, e.salary) IN (
    SELECT departmentId, MAX(salary)
    FROM Employee
    GROUP BY departmentId
);`,
      cpp: `// Write SQL query or C++ simulation`,
      python: `# Python SQLite query solution
import sqlite3
def solve():
    pass`
    },
    testCases: [
      {
        id: 1,
        label: 'Case 1',
        paramName: 'query',
        inputValue: 'SELECT Department, Employee, Salary',
        expectedOutput: 'Jim | 90000 | IT',
        rawStdin: ''
      }
    ],
    solution: {
      approach: 'Window Function or Group By Subquery',
      timeComplexity: 'O(N log N)',
      spaceComplexity: 'O(N)',
      explanation: 'Use a subquery to find the maximum salary for each departmentId, then filter Employee and join Department.'
    }
  },
  {
    id: 12,
    number: 146,
    title: 'LRU Cache (Low-Level Design)',
    slug: 'lru-cache-lld',
    diff: 'Medium',
    topic: 'LLD',
    companies: ['Google', 'Amazon', 'Microsoft', 'Uber', 'Apple'],
    statement: `Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.

Implement the LRUCache class:
• LRUCache(int capacity) Initialize the LRU cache with positive size capacity.
• int get(int key) Return the value of the key if the key exists, otherwise return -1.
• void put(int key, int value) Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.

The functions get and put must each run in O(1) average time complexity.`,
    hints: [
      'Which data structure allows O(1) key lookups? A Hash Map.',
      'Which data structure allows O(1) removals and insertions at boundaries? A Doubly Linked List.',
      'Combine a Hash Map with a Doubly Linked List: the head holds the most recent, and tail holds least recent.'
    ],
    examples: [
      {
        input: '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]',
        output: '[null, null, null, 1, null, -1, null, -1, 3, 4]',
        explanation: 'Cache evicts key 2 when key 3 is added, and evicts key 1 when key 4 is added.'
      }
    ],
    constraints: [
      '1 <= capacity <= 3000',
      '0 <= key <= 10^4',
      '0 <= value <= 10^5',
      'At most 2 * 10^5 calls will be made to get and put.'
    ],
    starterCode: {
      lld_python: `class Node:
    def __init__(self, key: int, val: int):
        self.key, self.val = key, val
        self.prev = self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache = {}
        self.left, self.right = Node(0, 0), Node(0, 0)
        self.left.next, self.right.prev = self.right, self.left

    def _remove(self, node):
        prev, nxt = node.prev, node.next
        prev.next, nxt.prev = nxt, prev

    def _insert(self, node):
        prev, nxt = self.right.prev, self.right
        prev.next = nxt.prev = node
        node.next, node.prev = nxt, prev

    def get(self, key: int) -> int:
        if key in self.cache:
            self._remove(self.cache[key])
            self._insert(self.cache[key])
            return self.cache[key].val
        return -1

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self._remove(self.cache[key])
        self.cache[key] = Node(key, value)
        self._insert(self.cache[key])

        if len(self.cache) > self.cap:
            lru = self.left.next
            self._remove(lru)
            del self.cache[lru.key]`,
      lld_java: `import java.util.*;

class LRUCache {
    class Node {
        int key, val;
        Node prev, next;
        Node(int k, int v) { key = k; val = v; }
    }

    private Map<Integer, Node> map = new HashMap<>();
    private int cap;
    private Node head = new Node(0, 0), tail = new Node(0, 0);

    public LRUCache(int capacity) {
        this.cap = capacity;
        head.next = tail;
        tail.prev = head;
    }

    public int get(int key) {
        if (!map.containsKey(key)) return -1;
        Node node = map.get(key);
        remove(node);
        insert(node);
        return node.val;
    }

    public void put(int key, int value) {
        if (map.containsKey(key)) remove(map.get(key));
        if (map.size() == cap) {
            map.remove(head.next.key);
            remove(head.next);
        }
        Node node = new Node(key, value);
        insert(node);
        map.put(key, node);
    }

    private void remove(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private void insert(Node node) {
        node.prev = tail.prev;
        node.next = tail;
        tail.prev.next = node;
        tail.prev = node;
    }
}`,
      lld_cpp: `#include <unordered_map>
#include <list>
using namespace std;

class LRUCache {
    int capacity;
    list<pair<int, int>> dll;
    unordered_map<int, list<pair<int, int>>::iterator> cache;

public:
    LRUCache(int capacity) : capacity(capacity) {}

    int get(int key) {
        if (cache.find(key) == cache.end()) return -1;
        dll.splice(dll.begin(), dll, cache[key]);
        return cache[key]->second;
    }

    void put(int key, int value) {
        if (cache.find(key) != cache.end()) {
            dll.splice(dll.begin(), dll, cache[key]);
            cache[key]->second = value;
            return;
        }
        if (cache.size() == capacity) {
            int d_key = dll.back().first;
            dll.pop_back();
            cache.erase(d_key);
        }
        dll.emplace_front(key, value);
        cache[key] = dll.begin();
    }
};`,
      python: `class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache = {}`,
      cpp: `// C++ implementation`
    },
    testCases: [
      {
        id: 1,
        label: 'Case 1',
        paramName: 'operations',
        inputValue: '["LRUCache", "put", "put", "get"]',
        expectedOutput: '[null, null, null, 1]',
        rawStdin: '["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]'
      }
    ],
    solution: {
      approach: 'Hash Map + Doubly Linked List',
      timeComplexity: 'O(1) for both get and put',
      spaceComplexity: 'O(capacity)',
      explanation: 'Maintain a doubly linked list of key-value nodes ordered by recency. The hash map stores references to list nodes for O(1) lookup.'
    }
  }
];
