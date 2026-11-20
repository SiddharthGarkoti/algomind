import logging
import threading
from datetime import timedelta
from django.utils import timezone
from django.core.cache import cache

from .models import PlatformProfile, PlatformStats, TopicStats
from .fetcher import fetch_stats

logger = logging.getLogger(__name__)

DAILY_SYNC_CACHE_KEY = 'algomind_daily_platform_sync_date'


def sync_single_profile(profile: PlatformProfile) -> bool:
    """
    Fetches real-time stats for a single PlatformProfile, updates PlatformStats,
    TopicStats, and recomputes the user's authentic Elo rating.
    """
    if not profile.handle:
        return False

    try:
        raw = fetch_stats(profile.platform_name, profile.handle)
        topic_stats_raw = raw.pop('topic_stats', [])

        PlatformStats.objects.update_or_create(profile=profile, defaults=raw)

        for ts in topic_stats_raw:
            TopicStats.objects.update_or_create(
                profile=profile,
                topic_slug=ts['topic_slug'],
                defaults={
                    'topic_name':      ts['topic_name'],
                    'problems_solved': ts['problems_solved'],
                },
            )

        # Recalculate user's Elo rating
        if profile.user:
            profile.user.recalculate_rating()

        logger.info(f"[DailySync] Successfully updated {profile.platform_name} for @{profile.handle} (user {profile.user.username})")
        return True
    except Exception as e:
        logger.warning(f"[DailySync] Failed to update {profile.platform_name} for @{profile.handle}: {e}")
        return False


def sync_inactive_users_daily(force: bool = False) -> dict:
    """
    Finds all users who have not logged in today, and auto-updates their
    LeetCode (and other platform) profiles once a day.
    Throttled by a daily cache key unless force=True.
    """
    today_str = str(timezone.now().date())
    last_run = cache.get(DAILY_SYNC_CACHE_KEY)

    if not force and last_run == today_str:
        return {'status': 'skipped', 'reason': f'Already completed daily sync for {today_str}', 'synced_count': 0}

    # Set cache to avoid duplicate runs across parallel requests
    cache.set(DAILY_SYNC_CACHE_KEY, today_str, timeout=86400 * 2)

    today = timezone.now().date()
    # Find all platform profiles
    profiles = PlatformProfile.objects.select_related('user', 'stats').all()

    synced_count = 0
    skipped_count = 0

    for profile in profiles:
        user = profile.user
        if not user:
            continue

        # Check if the user has logged in today
        has_logged_in_today = bool(user.last_active and user.last_active.date() == today)

        # Only auto-update users who have NOT logged in today (unless force=True)
        if has_logged_in_today and not force:
            skipped_count += 1
            continue

        # If stats were already updated today, avoid duplicate API calls
        st = getattr(profile, 'stats', None)
        if st and st.last_updated and st.last_updated.date() == today and not force:
            skipped_count += 1
            continue

        success = sync_single_profile(profile)
        if success:
            synced_count += 1

    return {
        'status': 'completed',
        'date': today_str,
        'synced_count': synced_count,
        'skipped_count': skipped_count,
    }


def trigger_daily_sync_background():
    """
    Spawns a daemon thread to run sync_inactive_users_daily without blocking the request.
    """
    today_str = str(timezone.now().date())
    if cache.get(DAILY_SYNC_CACHE_KEY) == today_str:
        return

    thread = threading.Thread(target=sync_inactive_users_daily, kwargs={'force': False}, daemon=True)
    thread.start()
