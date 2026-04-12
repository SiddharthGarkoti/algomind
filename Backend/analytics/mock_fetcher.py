"""
Mock external platform API responses.
Replace each function body with real API calls when ready.
"""
import random


def _rand(base, spread=200):
    return max(0, base + random.randint(-spread, spread))


def fetch_leetcode(handle: str) -> dict:
    return {
        'rating':          _rand(1600, 400),
        'problems_solved': _rand(300, 100),
        'contests':        _rand(40, 20),
        'easy_solved':     _rand(120, 30),
        'medium_solved':   _rand(140, 40),
        'hard_solved':     _rand(40, 20),
    }


def fetch_codeforces(handle: str) -> dict:
    return {
        'rating':          _rand(1500, 500),
        'problems_solved': _rand(500, 150),
        'contests':        _rand(60, 30),
        'easy_solved':     _rand(200, 50),
        'medium_solved':   _rand(200, 60),
        'hard_solved':     _rand(100, 40),
    }


def fetch_codechef(handle: str) -> dict:
    return {
        'rating':          _rand(1800, 300),
        'problems_solved': _rand(200, 80),
        'contests':        _rand(30, 15),
        'easy_solved':     _rand(80, 20),
        'medium_solved':   _rand(80, 30),
        'hard_solved':     _rand(40, 20),
    }


def fetch_hackerrank(handle: str) -> dict:
    return {
        'rating':          _rand(1200, 200),
        'problems_solved': _rand(150, 50),
        'contests':        _rand(20, 10),
        'easy_solved':     _rand(80, 20),
        'medium_solved':   _rand(50, 20),
        'hard_solved':     _rand(20, 10),
    }


FETCHERS = {
    'leetcode':   fetch_leetcode,
    'codeforces': fetch_codeforces,
    'codechef':   fetch_codechef,
    'hackerrank': fetch_hackerrank,
}


def fetch_stats(platform: str, handle: str) -> dict:
    fetcher = FETCHERS.get(platform)
    if not fetcher:
        raise ValueError(f"Unknown platform: {platform}")
    return fetcher(handle)
