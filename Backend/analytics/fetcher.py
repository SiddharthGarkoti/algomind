"""
Real platform API fetchers.
LeetCode  — GraphQL API (no auth required for public profiles)
Codeforces — Official REST API (public)
"""
import requests

LEETCODE_GQL = 'https://leetcode.com/graphql'
CF_API       = 'https://codeforces.com/api'

_LC_HEADERS = {
    'Content-Type':    'application/json',
    'Referer':         'https://leetcode.com',
    'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                       '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Origin':          'https://leetcode.com',
    'Accept':          'application/json',
    'Accept-Language':  'en-US,en;q=0.9',
}

# ── LeetCode ──────────────────────────────────────────────────────────────────

def _lc_post(query: str, variables: dict, timeout: int = 15) -> dict:
    """Low-level helper — POST to LeetCode GraphQL, return parsed JSON body.
    Raises RuntimeError on HTTP errors so callers can distinguish from ValueError."""
    r = requests.post(
        LEETCODE_GQL,
        json={'query': query, 'variables': variables},
        headers=_LC_HEADERS,
        timeout=timeout,
    )
    if r.status_code in (403, 429):
        raise RuntimeError(
            f'LeetCode returned HTTP {r.status_code}. '
            'Their API may be rate-limiting server-side requests.'
        )
    r.raise_for_status()
    return r.json()


def validate_leetcode(handle: str) -> bool:
    """Return True if the LeetCode username exists.
    Fail-open on network / API errors — only return False when we receive a
    clear "user not found" response (matchedUser == null)."""
    query = """
    query checkUser($username: String!) {
      matchedUser(username: $username) { username }
    }
    """
    try:
        body = _lc_post(query, {'username': handle}, timeout=12)
        return body.get('data', {}).get('matchedUser') is not None
    except RuntimeError:
        return True     # blocked / rate-limited → fail-open
    except Exception:
        return True     # any other error → fail-open


def fetch_leetcode(handle: str) -> dict:
    """
    Fetch real stats from LeetCode's public GraphQL API.
    Returns dict with: rating, problems_solved, contests, easy/medium/hard_solved,
    topic_stats list.
    Raises ValueError if user not found, RuntimeError on network/parse error.
    """
    query = """
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        submitStats {
          acSubmissionNum {
            difficulty
            count
          }
        }
        tagProblemCounts {
          advanced     { tagName tagSlug problemsSolved }
          intermediate { tagName tagSlug problemsSolved }
          fundamental  { tagName tagSlug problemsSolved }
        }
      }
      userContestRanking(username: $username) {
        rating
        attendedContestsCount
      }
    }
    """
    try:
        body = _lc_post(query, {'username': handle})
        data = body.get('data', {})

        user = data.get('matchedUser')
        if not user:
            raise ValueError(f"LeetCode user '{handle}' not found.")

        # --- solved counts ---
        raw_counts = {
            s['difficulty']: s['count']
            for s in (user.get('submitStats') or {}).get('acSubmissionNum', [])
        }
        easy_solved   = raw_counts.get('Easy',   0)
        medium_solved = raw_counts.get('Medium', 0)
        hard_solved   = raw_counts.get('Hard',   0)
        total_solved  = raw_counts.get('All', easy_solved + medium_solved + hard_solved)

        # --- contest info ---
        contest_info = data.get('userContestRanking') or {}
        rating       = int(contest_info.get('rating') or 0)
        contests     = contest_info.get('attendedContestsCount') or 0

        # --- topic breakdown ---
        topic_counts = user.get('tagProblemCounts') or {}
        topic_stats  = []
        for level in ('fundamental', 'intermediate', 'advanced'):
            for t in (topic_counts.get(level) or []):
                if t.get('problemsSolved', 0) > 0:
                    topic_stats.append({
                        'topic_name':      t['tagName'],
                        'topic_slug':      t['tagSlug'],
                        'problems_solved': t['problemsSolved'],
                    })

        return {
            'rating':          rating,
            'problems_solved': total_solved,
            'contests':        contests,
            'easy_solved':     easy_solved,
            'medium_solved':   medium_solved,
            'hard_solved':     hard_solved,
            'topic_stats':     topic_stats,
        }

    except (ValueError, RuntimeError):
        raise
    except requests.Timeout:
        raise RuntimeError(f"LeetCode API timed out for '{handle}'.")
    except Exception as e:
        raise RuntimeError(f"Failed to fetch LeetCode stats for '{handle}': {e}")


# ── Codeforces ────────────────────────────────────────────────────────────────

def validate_codeforces(handle: str) -> bool:
    """Return True if the Codeforces handle exists.
    Fail-open on network / API errors."""
    try:
        r = requests.get(f'{CF_API}/user.info?handles={handle}', timeout=10)
        data = r.json()
        if data.get('status') == 'FAILED':
            return False
        return data.get('status') == 'OK'
    except Exception:
        return True     # network error → fail-open


def fetch_codeforces(handle: str) -> dict:
    """
    Fetch real stats from Codeforces public REST API.
    Returns dict with same shape as fetch_leetcode.
    """
    try:
        # 1. Basic user info (rating)
        r = requests.get(f'{CF_API}/user.info?handles={handle}', timeout=10)
        r.raise_for_status()
        info = r.json()
        if info.get('status') != 'OK':
            raise ValueError(
                f"Codeforces handle '{handle}' not found: {info.get('comment', '')}"
            )
        user_info = info['result'][0]
        rating = user_info.get('rating', 0) or 0

        # 2. Accepted submissions (unique problems only)
        sr = requests.get(
            f'{CF_API}/user.status?handle={handle}&from=1&count=5000', timeout=20
        )
        sr.raise_for_status()
        sub_data = sr.json()

        seen_problems: dict = {}
        topic_map: dict[str, int] = {}

        if sub_data.get('status') == 'OK':
            for sub in sub_data['result']:
                if sub.get('verdict') == 'OK':
                    p   = sub['problem']
                    key = f"{p.get('contestId', '')}-{p.get('index', '')}"
                    if key not in seen_problems:
                        seen_problems[key] = p
                        for tag in (p.get('tags') or []):
                            # Skip meta-tags that start with * (e.g. '*broken')
                            if tag and not tag.startswith('*'):
                                topic_map[tag] = topic_map.get(tag, 0) + 1

        # Classify by problem rating
        easy_solved = medium_solved = hard_solved = 0
        for p in seen_problems.values():
            r_val = p.get('rating') or 0
            if r_val <= 1200:
                easy_solved   += 1
            elif r_val <= 2000:
                medium_solved += 1
            else:
                hard_solved   += 1

        # 3. Contest count
        contests = 0
        try:
            cr = requests.get(f'{CF_API}/user.rating?handle={handle}', timeout=10)
            cr.raise_for_status()
            cr_data = cr.json()
            if cr_data.get('status') == 'OK':
                contests = len(cr_data['result'])
        except Exception:
            pass

        topic_stats = [
            {
                'topic_name':      tag,
                'topic_slug':      tag.replace(' ', '-').lower(),
                'problems_solved': cnt,
            }
            for tag, cnt in sorted(topic_map.items(), key=lambda x: -x[1])
        ]

        return {
            'rating':          rating,
            'problems_solved': len(seen_problems),
            'contests':        contests,
            'easy_solved':     easy_solved,
            'medium_solved':   medium_solved,
            'hard_solved':     hard_solved,
            'topic_stats':     topic_stats,
        }

    except (ValueError, RuntimeError):
        raise
    except requests.Timeout:
        raise RuntimeError(f"Codeforces API timed out for '{handle}'.")
    except Exception as e:
        raise RuntimeError(f"Failed to fetch Codeforces stats for '{handle}': {e}")


# ── Recent Submissions ────────────────────────────────────────────────────────

def fetch_recent_leetcode(handle: str, limit: int = 15) -> list:
    """Fetch the N most recent accepted submissions from LeetCode."""
    query = """
    query recentSubmissions($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        title
        titleSlug
        timestamp
        lang
      }
    }
    """
    try:
        body = _lc_post(query, {'username': handle, 'limit': limit})
        subs = body.get('data', {}).get('recentAcSubmissionList') or []
        return [
            {
                'title':     s['title'],
                'slug':      s['titleSlug'],
                'timestamp': int(s['timestamp']),
                'language':  s['lang'],
                'platform':  'leetcode',
                'url':       f"https://leetcode.com/problems/{s['titleSlug']}/",
            }
            for s in subs
        ]
    except Exception:
        return []


def fetch_recent_codeforces(handle: str, limit: int = 15) -> list:
    """Fetch the N most recent accepted submissions from Codeforces."""
    try:
        r = requests.get(
            f'{CF_API}/user.status?handle={handle}&from=1&count=50',
            timeout=15,
        )
        r.raise_for_status()
        data = r.json()
        if data.get('status') != 'OK':
            return []

        seen, results = set(), []
        for sub in data['result']:
            if sub.get('verdict') != 'OK':
                continue
            p   = sub['problem']
            key = f"{p.get('contestId','')}-{p.get('index','')}"
            if key in seen:
                continue
            seen.add(key)
            results.append({
                'title':     p.get('name', 'Unknown'),
                'slug':      key,
                'timestamp': sub.get('creationTimeSeconds', 0),
                'language':  sub.get('programmingLanguage', ''),
                'platform':  'codeforces',
                'url':       f"https://codeforces.com/problemset/problem/{p.get('contestId','')}/{p.get('index','')}",
            })
            if len(results) >= limit:
                break
        return results
    except Exception:
        return []


# ── Dispatcher ────────────────────────────────────────────────────────────────

FETCHERS   = {'leetcode': fetch_leetcode,   'codeforces': fetch_codeforces}
VALIDATORS = {'leetcode': validate_leetcode, 'codeforces': validate_codeforces}

RECENT_FETCHERS = {
    'leetcode':   fetch_recent_leetcode,
    'codeforces': fetch_recent_codeforces,
}


def fetch_stats(platform: str, handle: str) -> dict:
    fetcher = FETCHERS.get(platform)
    if not fetcher:
        raise ValueError(f"Unsupported platform: {platform}")
    return fetcher(handle)


def validate_handle(platform: str, handle: str) -> bool:
    validator = VALIDATORS.get(platform)
    if not validator:
        return True   # unknown platforms pass through
    return validator(handle)
