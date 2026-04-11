import requests
import json
from datetime import datetime


# ══════════════════════════════════════════════
# LEETCODE
# ══════════════════════════════════════════════

LEETCODE_GQL = "https://leetcode.com/graphql"
LC_HEADERS = {
    "Content-Type": "application/json",
    "Referer": "https://leetcode.com",
}


def _lc_query(query, variables):
    res = requests.post(
        LEETCODE_GQL,
        json={"query": query, "variables": variables},
        headers=LC_HEADERS,
        timeout=15,
    )
    return res.json().get("data", {})


def fetch_leetcode(handle: str) -> dict:
    # ── Basic stats ──────────────────────────
    basic = _lc_query("""
    query($username: String!) {
        matchedUser(username: $username) {
            submitStats {
                acSubmissionNum { difficulty count }
            }
        }
        userContestRanking(username: $username) {
            rating
            attendedContestsCount
        }
    }
    """, {"username": handle})

    user    = basic.get("matchedUser") or {}
    contest = basic.get("userContestRanking") or {}
    subs    = user.get("submitStats", {}).get("acSubmissionNum", [])

    easy = medium = hard = total = 0
    for s in subs:
        if s["difficulty"] == "Easy":   easy   = s["count"]
        if s["difficulty"] == "Medium": medium = s["count"]
        if s["difficulty"] == "Hard":   hard   = s["count"]
        if s["difficulty"] == "All":    total  = s["count"]

    # ── Topic breakdown ───────────────────────
    tag_data = _lc_query("""
    query($username: String!) {
        matchedUser(username: $username) {
            tagProblemCounts {
                advanced     { tagName problemsSolved }
                intermediate { tagName problemsSolved }
                fundamental  { tagName problemsSolved }
            }
        }
    }
    """, {"username": handle})

    topics = {}
    tag_user = tag_data.get("matchedUser") or {}
    for group in ["fundamental", "intermediate", "advanced"]:
        for item in tag_user.get("tagProblemCounts", {}).get(group, []):
            topics[item["tagName"]] = item["problemsSolved"]

    # ── Heatmap ───────────────────────────────
    cal_data = _lc_query("""
    query($username: String!) {
        matchedUser(username: $username) {
            userCalendar { submissionCalendar }
        }
    }
    """, {"username": handle})

    heatmap = {}
    try:
        raw_cal = cal_data.get("matchedUser", {}).get("userCalendar", {}).get("submissionCalendar", "{}")
        for ts, count in json.loads(raw_cal).items():
            date_str = datetime.utcfromtimestamp(int(ts)).strftime("%Y-%m-%d")
            heatmap[date_str] = count
    except Exception:
        pass

    # ── Contest history ───────────────────────
    ch_data = _lc_query("""
    query($username: String!) {
        userContestRankingHistory(username: $username) {
            attended
            rating
            ranking
            contest { title startTime }
        }
    }
    """, {"username": handle})

    contest_history = []
    for c in ch_data.get("userContestRankingHistory") or []:
        if not c.get("attended"):
            continue
        try:
            contest_history.append({
                "contest_name":  c["contest"]["title"],
                "rating_before": 0,
                "rating_after":  round(c["rating"]),
                "rating_change": 0,
                "rank":          c["ranking"],
                "held_at":       datetime.utcfromtimestamp(
                                     c["contest"]["startTime"]
                                 ).isoformat(),
            })
        except Exception:
            continue

    return {
        "rating":          int(contest.get("rating") or 0),
        "problems_solved": total,
        "contests":        contest.get("attendedContestsCount", 0),
        "easy_solved":     easy,
        "medium_solved":   medium,
        "hard_solved":     hard,
        "topics":          topics,
        "heatmap":         heatmap,
        "contest_history": contest_history,
        "submission_logs": [],
    }


# ══════════════════════════════════════════════
# CODEFORCES
# ══════════════════════════════════════════════

CF_BASE = "https://codeforces.com/api"


def _cf_get(endpoint, params):
    res  = requests.get(f"{CF_BASE}/{endpoint}", params=params, timeout=15)
    data = res.json()
    if data.get("status") != "OK":
        raise ValueError(data.get("comment", "Codeforces API error"))
    return data["result"]


def fetch_codeforces(handle: str) -> dict:
    # ── User info ─────────────────────────────
    user_info = _cf_get("user.info", {"handles": handle})[0]

    # ── Submissions ───────────────────────────
    submissions = _cf_get("user.status", {
        "handle": handle, "from": 1, "count": 10000
    })

    solved     = set()
    topics     = {}
    heatmap    = {}
    sub_logs   = []
    wa = tle = re_c = 0

    for s in submissions:
        prob    = s.get("problem", {})
        verdict = s.get("verdict", "")
        tags    = prob.get("tags", [])
        p_name  = prob.get("name", "")
        ts      = s.get("creationTimeSeconds", 0)
        date_str = datetime.utcfromtimestamp(ts).strftime("%Y-%m-%d")

        # heatmap — count every submission
        heatmap[date_str] = heatmap.get(date_str, 0) + 1

        if verdict == "OK":
            solved.add(p_name)
            for tag in tags:
                topics[tag] = topics.get(tag, 0) + 1
        elif verdict == "WRONG_ANSWER":       wa  += 1
        elif verdict == "TIME_LIMIT_EXCEEDED": tle += 1
        elif verdict == "RUNTIME_ERROR":       re_c += 1

        mapped = {
            "OK":                    "AC",
            "WRONG_ANSWER":          "WA",
            "TIME_LIMIT_EXCEEDED":   "TLE",
            "RUNTIME_ERROR":         "RE",
        }.get(verdict, "CE")

        sub_logs.append({
            "problem_name": p_name,
            "topic":        tags[0] if tags else "",
            "verdict":      mapped,
            "submitted_at": datetime.utcfromtimestamp(ts).isoformat(),
        })

    # ── Contest history ───────────────────────
    contests = []
    try:
        contests = _cf_get("user.rating", {"handle": handle})
    except Exception:
        pass

    contest_history = []
    for c in contests:
        try:
            contest_history.append({
                "contest_name":  c["contestName"],
                "rank":          c["rank"],
                "rating_before": c["oldRating"],
                "rating_after":  c["newRating"],
                "rating_change": c["newRating"] - c["oldRating"],
                "held_at":       datetime.utcfromtimestamp(
                                     c["ratingUpdateTimeSeconds"]
                                 ).isoformat(),
            })
        except Exception:
            continue

    return {
        "rating":          user_info.get("rating", 0),
        "problems_solved": len(solved),
        "contests":        len(contests),
        "easy_solved":     0,
        "medium_solved":   0,
        "hard_solved":     0,
        "topics":          topics,
        "heatmap":         heatmap,
        "contest_history": contest_history,
        "submission_logs": sub_logs,
        "verdicts": {
            "total": len(submissions),
            "WA":    wa,
            "TLE":   tle,
            "RE":    re_c,
        },
    }


# ══════════════════════════════════════════════
# MOCK — CodeChef & HackerRank
# ══════════════════════════════════════════════

def fetch_codechef(handle: str) -> dict:
    import random
    def r(b, s=100): return max(0, b + random.randint(-s, s))
    return {
        "rating": r(1800, 300), "problems_solved": r(200, 80),
        "contests": r(30, 15),  "easy_solved": r(80, 20),
        "medium_solved": r(80, 30), "hard_solved": r(40, 20),
        "topics": {}, "heatmap": {}, "contest_history": [],
        "submission_logs": [],
    }


def fetch_hackerrank(handle: str) -> dict:
    import random
    def r(b, s=100): return max(0, b + random.randint(-s, s))
    return {
        "rating": r(1200, 200), "problems_solved": r(150, 50),
        "contests": r(20, 10),  "easy_solved": r(80, 20),
        "medium_solved": r(50, 20), "hard_solved": r(20, 10),
        "topics": {}, "heatmap": {}, "contest_history": [],
        "submission_logs": [],
    }


# ══════════════════════════════════════════════
# ROUTER
# ══════════════════════════════════════════════

FETCHERS = {
    "leetcode":   fetch_leetcode,
    "codeforces": fetch_codeforces,
    "codechef":   fetch_codechef,
    "hackerrank": fetch_hackerrank,
}


def fetch_stats(platform: str, handle: str) -> dict:
    fetcher = FETCHERS.get(platform)
    if not fetcher:
        raise ValueError(f"Unknown platform: {platform}")
    return fetcher(handle)


# POST  http://127.0.0.1:8000/api/analytics/connect/