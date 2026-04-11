from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from django.utils.timezone import make_aware
from datetime import datetime as dt

from .models import PlatformProfile, PlatformStats
from .serializers import ConnectPlatformSerializer, PlatformProfileSerializer
from .mock_fetcher import fetch_stats
from notifications.utils import notify_stats_updated, notify_friend_active
from friends.models import Friendship
from django.db.models import Q
from .models import (PlatformProfile, PlatformStats, TopicStat,
                     SubmissionLog, ActivityLog, ContestHistory)


class ConnectPlatformView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ConnectPlatformSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        platform = serializer.validated_data['platform_name']
        handle   = serializer.validated_data['handle']

        profile, created = PlatformProfile.objects.update_or_create(
            user=request.user,
            platform_name=platform,
            defaults={'handle': handle},
        )

        try:
            raw = fetch_stats(platform, handle)
        except Exception as e:
            return Response({'detail': f'Could not fetch data: {e}'},
                            status=status.HTTP_400_BAD_REQUEST)

        # ── Save basic stats ──────────────────
        PlatformStats.objects.update_or_create(
            profile=profile,
            defaults={
                'rating':          raw['rating'],
                'problems_solved': raw['problems_solved'],
                'contests':        raw['contests'],
                'easy_solved':     raw['easy_solved'],
                'medium_solved':   raw['medium_solved'],
                'hard_solved':     raw['hard_solved'],
            }
        )

        # ── Save topic stats ──────────────────
        for topic_name, count in raw.get('topics', {}).items():
            if not topic_name or count == 0:
                continue
            topic, _ = TopicStat.objects.get_or_create(
                user=request.user,
                topic=topic_name,
                defaults={
                    'problems_solved': count,
                    'total_attempts':  count,
                }
            )
            topic.problems_solved = max(topic.problems_solved, count)
            topic.total_attempts  = max(topic.total_attempts,  count)
            topic.accuracy = round(
                (topic.problems_solved / topic.total_attempts * 100)
                if topic.total_attempts else 0, 1
            )
            topic.strength = (
                'strong' if topic.accuracy >= 80 else
                'weak'   if topic.accuracy <  50 else
                'medium'
            )
            topic.save()

        # ── Save heatmap / activity logs ──────
        for date_str, count in raw.get('heatmap', {}).items():
            try:
                from datetime import datetime as dt
                date = dt.strptime(date_str, '%Y-%m-%d').date()
                ActivityLog.objects.update_or_create(
                    user=request.user,
                    date=date,
                    defaults={
                        'problems_solved': count,
                        'submissions':     count,
                    }
                )
            except Exception:
                continue

        # ── Save contest history ──────────────
        for c in raw.get('contest_history', []):
            try:
                ContestHistory.objects.update_or_create(
                    user=request.user,
                    platform=platform,
                    contest_name=c['contest_name'],
                    defaults={
                        'rank':          c.get('rank', 0),
                        'rating_before': c.get('rating_before', 0),
                        'rating_after':  c.get('rating_after',  0),
                        'rating_change': c.get('rating_change', 0),
                        'held_at':       c['held_at'],
                    }
                )
            except Exception:
                continue

# ── Save submission logs ──────────────────────────────────────────────

        for s in raw.get('submission_logs', []):
            try:
              naive_dt = dt.fromisoformat(s['submitted_at'])
              aware_dt = make_aware(naive_dt)
              SubmissionLog.objects.get_or_create(
              user=request.user,
              platform=platform,
              problem_name=s['problem_name'],
              verdict=s['verdict'],
              submitted_at=aware_dt,
              defaults={'topic': s.get('topic', '')}
              )
            except Exception:
                  continue


        # ── Notifications ─────────────────────
        from notifications.utils import notify_stats_updated, notify_friend_active
        from friends.models import Friendship
        from django.db.models import Q

        notify_stats_updated(request.user, platform)
        friendships = Friendship.objects.filter(
            Q(user1=request.user) | Q(user2=request.user)
        ).select_related('user1', 'user2')
        for f in friendships:
            friend = f.user2 if f.user1 == request.user else f.user1
            notify_friend_active(friend, request.user, platform)

        return Response(
            PlatformProfileSerializer(profile).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

class DashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profiles = (PlatformProfile.objects
                    .filter(user=request.user)
                    .select_related('stats'))

        data = PlatformProfileSerializer(profiles, many=True).data

        # Aggregate totals across platforms
        total_problems = sum(
            p['stats']['problems_solved']
            for p in data if p.get('stats')
        )
        total_contests = sum(
            p['stats']['contests']
            for p in data if p.get('stats')
        )
        avg_rating = (
            sum(p['stats']['rating'] for p in data if p.get('stats')) // len(data)
            if data else 0
        )

        return Response({
            'platforms': data,
            'summary': {
                'total_problems_solved': total_problems,
                'total_contests':        total_contests,
                'average_rating':        avg_rating,
                'platforms_connected':   len(data),
            },
        })


# dashboard usp feature

from django.db.models import Sum, Avg, Max
from .services import (get_overview, get_topic_analysis, get_submission_analysis,
                       get_heatmap, get_improvement, get_ai_insights, get_recommendations)


class OverviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        return Response(get_overview(request.user))


class TopicAnalysisView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        return Response(get_topic_analysis(request.user))


class SubmissionAnalysisView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        return Response(get_submission_analysis(request.user))


class HeatmapView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        days = int(request.query_params.get('days', 182))
        return Response(get_heatmap(request.user, days))


class ImprovementView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        return Response(get_improvement(request.user))


class InsightsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        return Response(get_ai_insights(request.user))


class RecommendationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        return Response(get_recommendations(request.user))


class FullDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        user = request.user
        return Response({
            'overview':        get_overview(user),
            'topics':          get_topic_analysis(user),
            'submissions':     get_submission_analysis(user),
            'heatmap':         get_heatmap(user),
            'improvement':     get_improvement(user),
            'insights':        get_ai_insights(user),
            'recommendations': get_recommendations(user),
        })


# endpoint for dashboard

class DebugFetchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        platform = request.data.get('platform_name')
        handle   = request.data.get('handle')
        try:
            raw = fetch_stats(platform, handle)
            return Response({
                'raw_keys':        list(raw.keys()),
                'topics_count':    len(raw.get('topics', {})),
                'heatmap_count':   len(raw.get('heatmap', {})),
                'contest_count':   len(raw.get('contest_history', [])),
                'sub_logs_count':  len(raw.get('submission_logs', [])),
                'sample_topics':   list(raw.get('topics', {}).items())[:5],
                'sample_heatmap':  list(raw.get('heatmap', {}).items())[:5],
                'sample_contests': raw.get('contest_history', [])[:2],
                'raw_preview':     {k: raw[k] for k in list(raw.keys())[:6]},
            })
        except Exception as e:
            import traceback
            return Response({
                'error':     str(e),
                'traceback': traceback.format_exc()
            })