import threading
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PlatformProfile, PlatformStats, TopicStats
from .serializers import ConnectPlatformSerializer, PlatformProfileSerializer
from .fetcher import fetch_stats, validate_handle, RECENT_FETCHERS


class PreviewStatsView(APIView):
    """
    GET /api/analytics/preview/<platform>/<handle>/
    Public (no auth) — returns real live stats without storing anything.
    Used for the guest "Analyze My Profile" preview flow.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, platform, handle):
        supported = ('leetcode', 'codeforces')
        if platform not in supported:
            return Response({'detail': f'Unsupported platform: {platform}'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            raw = fetch_stats(platform, handle)
            raw.pop('topic_stats', None)   # keep response small
            raw['handle'] = handle
            raw['platform_name'] = platform
            return Response(raw)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_404_NOT_FOUND)
        except RuntimeError as e:
            return Response({'detail': str(e)}, status=status.HTTP_502_BAD_GATEWAY)


class ValidateHandleView(APIView):
    """
    GET /api/analytics/validate/<platform>/<handle>/
    Always returns HTTP 200 with {valid: true/false, message: '...'}.
    (Using 200 for both so the frontend can read the body without api.js throwing.)
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, platform, handle):
        supported = ('leetcode', 'codeforces')
        if platform not in supported:
            return Response({'valid': True, 'message': 'Platform not validated server-side.'})

        is_valid = validate_handle(platform, handle)
        if is_valid:
            return Response({'valid': True, 'message': f"'{handle}' found on {platform}."})
        return Response(
            {'valid': False, 'message': f"'{handle}' not found on {platform}. Check your username."},
        )


class ConnectPlatformView(APIView):
    """
    POST /api/analytics/connect/
    Validates handle against real platform API, fetches real stats, saves to DB.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ConnectPlatformSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        platform = serializer.validated_data['platform_name']
        handle   = serializer.validated_data['handle'].strip()

        # --- validate handle exists on platform ---
        if not validate_handle(platform, handle):
            return Response(
                {'detail': f"Handle '{handle}' not found on {platform}. Please check your username."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --- save/update profile (always do this, even if stat fetch fails) ---
        profile, created = PlatformProfile.objects.update_or_create(
            user=request.user,
            platform_name=platform,
            defaults={'handle': handle},
        )

        # --- fetch real stats ---
        fetch_warning = None
        try:
            raw = fetch_stats(platform, handle)
        except ValueError as e:
            # User genuinely not found — remove the profile we just saved
            profile.delete()
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except RuntimeError as e:
            # API blocked or network error — keep the profile handle saved,
            # return 200 with a warning so user knows stats aren't loaded yet.
            fetch_warning = str(e)
            raw = None

        if raw is not None:
            # strip topic_stats before saving to PlatformStats
            topic_stats_raw = raw.pop('topic_stats', [])

            stats, created_stats = PlatformStats.objects.update_or_create(
                profile=profile,
                defaults=raw,
            )

            # --- save topic stats ---
            for ts in topic_stats_raw:
                TopicStats.objects.update_or_create(
                    profile=profile,
                    topic_slug=ts['topic_slug'],
                    defaults={
                        'topic_name':      ts['topic_name'],
                        'problems_solved': ts['problems_solved'],
                    },
                )

            # Recalculate authentic Elo rating based on new platform solves
            request.user.recalculate_rating()

        resp_data = PlatformProfileSerializer(profile).data
        if fetch_warning:
            resp_data['warning'] = fetch_warning

        return Response(
            resp_data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request):
        platform = request.data.get('platform_name') or request.query_params.get('platform_name')
        if not platform:
            return Response({'detail': 'platform_name is required'}, status=status.HTTP_400_BAD_REQUEST)
        count, _ = PlatformProfile.objects.filter(user=request.user, platform_name=platform).delete()
        return Response({'detail': f'Disconnected {platform}', 'deleted': count > 0}, status=status.HTTP_200_OK)


class DashboardView(APIView):
    """
    GET /api/analytics/dashboard/
    Returns all connected platform profiles with real stats + summary.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profiles = list(
            PlatformProfile.objects
            .filter(user=request.user)
            .select_related('stats')
            .prefetch_related('topic_stats')
        )

        data = PlatformProfileSerializer(profiles, many=True).data

        rated_platforms = [p for p in data if p.get('stats') and p['stats'].get('rating', 0) > 0]
        total_problems  = sum(p['stats']['problems_solved'] for p in data if p.get('stats'))
        total_contests  = sum(p['stats']['contests']        for p in data if p.get('stats'))
        avg_rating      = (
            sum(p['stats']['rating'] for p in rated_platforms) // len(rated_platforms)
            if rated_platforms else 0
        )
        platform_current_streaks = [p['stats'].get('streak', 0) for p in data if p.get('stats')]
        platform_max_streaks     = [p['stats'].get('max_streak', p['stats'].get('streak', 0)) for p in data if p.get('stats')]
        total_current_streak = max(platform_current_streaks) if platform_current_streaks else 0
        total_max_streak     = max(platform_max_streaks) if platform_max_streaks else 0

        # Authentic AlgoMind in-app streak (isolated from third-party platform streaks)
        app_streak = request.user.streak or 0

        return Response({
            'platforms': data,
            'summary': {
                'total_problems_solved':   total_problems,
                'total_contests':          total_contests,
                'average_rating':          avg_rating,
                'platforms_connected':     len(data),
                'streak':                  app_streak,
                'max_streak':              app_streak,
                'current_streak':          app_streak,
                'app_streak':              app_streak,
                'platform_current_streak': total_current_streak,
                'platform_max_streak':     total_max_streak,
            },
        })


class WeakAreasView(APIView):
    """
    GET /api/analytics/weak-areas/
    Returns ranked list of weak topics based on solve rate.
    LeetCode data is prioritised; Codeforces tags fill gaps.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profiles = (
            PlatformProfile.objects
            .filter(user=request.user)
            .prefetch_related('topic_stats', 'stats')
        )

        if not profiles.exists():
            return Response({'weak_areas': [], 'message': 'No platforms connected yet.'})

        # Aggregate topic solved counts across platforms
        # Prioritise LeetCode since it has the best tag coverage
        topic_map: dict[str, dict] = {}

        # Process LeetCode first, then fill with Codeforces
        for priority_platform in ('leetcode', 'codeforces'):
            for profile in profiles:
                if profile.platform_name != priority_platform:
                    continue
                for ts in profile.topic_stats.all():
                    slug = ts.topic_slug
                    # Filter out Codeforces meta-tags (e.g. *broken, *special)
                    if slug.startswith('*') or ts.topic_name.startswith('*'):
                        continue
                    if slug not in topic_map:
                        topic_map[slug] = {
                            'topic_name':     ts.topic_name,
                            'topic_slug':     slug,
                            'problems_solved': ts.problems_solved,
                            'platform':       profile.platform_name,
                        }
                    else:
                        topic_map[slug]['problems_solved'] += ts.problems_solved

        # Rank by fewest problems solved (= weakest areas)
        all_topics = sorted(topic_map.values(), key=lambda x: x['problems_solved'])

        # Tag the top 5 as weak areas, the bottom 3 as strengths
        n = len(all_topics)
        weak_count     = min(5, n)
        strength_count = min(3, n)

        for i, t in enumerate(all_topics):
            if i < weak_count:
                t['status'] = 'weak'
            elif i >= n - strength_count:
                t['status'] = 'strength'
            else:
                t['status'] = 'improving'

        return Response({
            'weak_areas': all_topics,
            'total_topics': n,
        })


class RecentSubmissionsView(APIView):
    """
    GET /api/analytics/recent-submissions/
    Returns the last 15 accepted submissions from each connected platform,
    merged and sorted by timestamp (newest first).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profiles = PlatformProfile.objects.filter(user=request.user)
        all_subs = []

        for profile in profiles:
            fetcher = RECENT_FETCHERS.get(profile.platform_name)
            if fetcher:
                subs = fetcher(profile.handle, limit=15)
                all_subs.extend(subs)

        # Sort newest first
        all_subs.sort(key=lambda x: x.get('timestamp', 0), reverse=True)

        return Response({'submissions': all_subs[:20]})


class RefreshPlatformView(APIView):
    """
    POST /api/analytics/refresh/<platform>/
    Re-fetches real stats for a connected platform and updates the DB.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, platform):
        try:
            profile = PlatformProfile.objects.get(user=request.user, platform_name=platform)
        except PlatformProfile.DoesNotExist:
            return Response({'detail': f'{platform} not connected.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            raw = fetch_stats(platform, profile.handle)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except RuntimeError as e:
            return Response({'detail': str(e)}, status=status.HTTP_502_BAD_GATEWAY)

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

        # Recalculate authentic Elo rating
        request.user.recalculate_rating()

        return Response(PlatformProfileSerializer(profile).data)


def _sync_user_platforms_background(user_id):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        user = User.objects.get(id=user_id)
        profiles = PlatformProfile.objects.filter(user=user)
        for profile in profiles:
            if not profile.handle:
                continue
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
            except Exception:
                pass

        # Recalculate authentic Elo rating after all platforms synced
        user.recalculate_rating()
    except Exception:
        pass


class SyncPlatformsView(APIView):
    """
    POST /api/analytics/sync/
    Auto-syncs all connected platform profiles for the authenticated user in a background thread.
    Returns 200 OK instantly (<5ms) without waiting for LeetCode/Codeforces network round-trips.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user_id = request.user.id
        thread = threading.Thread(
            target=_sync_user_platforms_background,
            args=(user_id,),
            daemon=True,
            name=f"platform-sync-user-{user_id}"
        )
        thread.start()

        return Response({
            'status': 'ok',
            'detail': 'Background platform sync dispatched.',
            'rating': request.user.rating,
        }, status=status.HTTP_200_OK)


class VerifySolvedView(APIView):
    """
    POST /api/analytics/verify-solved/
    Body: { platform: 'leetcode', slug: 'climbing-stairs', difficulty: 'easy', is_plan: true }
    Returns { verified: true/false, already_credited: bool, points_awarded: int, new_rating: int, detail: '...' }
    Elo rules: 3 for easy, 4 for medium, 5 for hard.
    Extra 2 points on each if done from platform (+2 -> 5, 6, 7).
    Zero points awarded on resubmission.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        platform   = request.data.get('platform', 'leetcode').lower()
        slug       = request.data.get('slug', '').strip()
        difficulty = (request.data.get('difficulty') or '').strip().lower()
        is_plan    = bool(request.data.get('is_plan', False))

        if not slug:
            return Response({'verified': False, 'detail': 'Slug is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            profile = PlatformProfile.objects.get(user=request.user, platform_name=platform)
        except PlatformProfile.DoesNotExist:
            return Response({'verified': False, 'detail': f'{platform} not connected. Add your handle in Settings.'})

        if platform == 'leetcode':
            from challenges.views import _lc_accepted_slugs
            accepted = _lc_accepted_slugs(profile.handle, limit=100)
            verified = slug in accepted
        elif platform == 'codeforces':
            from challenges.views import _cf_accepted_slugs
            accepted = _cf_accepted_slugs(profile.handle, limit=200)
            verified = slug in accepted
        else:
            return Response({'verified': False, 'detail': 'Unsupported platform.'})

        if verified:
            from .models import VerifiedProblem
            already_done = VerifiedProblem.objects.filter(
                user=request.user,
                platform=platform,
                slug=slug
            ).exists()

            if already_done:
                return Response({
                    'verified': True,
                    'already_credited': True,
                    'points_awarded': 0,
                    'new_rating': request.user.rating,
                    'detail': 'Problem already solved. No points on resubmission.'
                })

            VerifiedProblem.objects.create(
                user=request.user,
                platform=platform,
                slug=slug,
                is_plan=is_plan
            )

            # Determine difficulty if not provided
            if not difficulty or difficulty not in ['easy', 'medium', 'hard']:
                from dsa.models import Problem
                p = Problem.objects.filter(slug=slug).first()
                if p and p.difficulty:
                    difficulty = p.difficulty.lower()
                else:
                    difficulty = 'easy'

            # Solves receive 3 for easy, 4 for medium, 5 for hard (no extra bonus)
            points = request.user.award_question_rating(difficulty)

            return Response({
                'verified': True,
                'already_credited': False,
                'points_awarded': points,
                'new_rating': request.user.rating,
                'detail': f'Verified! +{points} rating points awarded.'
            })

        return Response({'verified': False, 'detail': 'Submission not found on platform.'})
