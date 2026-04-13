from django.db import models
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, Notification
from .serializers import (
    RegisterSerializer, UserProfileSerializer,
    PublicUserSerializer, NotificationSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user    = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user':    UserProfileSerializer(user).data,
            'refresh': str(refresh),
            'access':  str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            RefreshToken(request.data['refresh']).blacklist()
        except Exception:
            pass
        return Response({'detail': 'Logged out.'})


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class   = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        user  = self.request.user
        today = timezone.now().date()
        if user.last_active != today:
            yesterday    = today - timezone.timedelta(days=1)
            user.streak  = (user.streak + 1) if user.last_active == yesterday else 1
            user.last_active = today
            user.save(update_fields=['streak', 'last_active'])
        return user


class PublicProfileView(generics.RetrieveAPIView):
    queryset           = User.objects.all()
    serializer_class   = PublicUserSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field       = 'username'


class LeaderboardView(APIView):
    """
    GET /api/auth/leaderboard/?limit=50
    Returns top users ranked by rating, with online status omitted (no WS yet).
    When the requesting user is authenticated, injects their own entry.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        limit = min(int(request.query_params.get('limit', 50)), 200)
        top_users = User.objects.order_by('-rating')[:limit]

        result = []
        for rank, user in enumerate(top_users, start=1):
            result.append({
                'rank':     rank,
                'id':       user.id,
                'username': user.username,
                'avatar':   request.build_absolute_uri(user.avatar.url) if user.avatar else None,
                'rating':   user.rating,
                'level':    user.level,
                'streak':   user.streak,
                'is_self':  (request.user.is_authenticated and request.user.id == user.id),
            })

        # If the authenticated user is not in the top list, append their entry
        if request.user.is_authenticated:
            in_list = any(e['is_self'] for e in result)
            if not in_list:
                me   = request.user
                rank = User.objects.filter(rating__gt=me.rating).count() + 1
                result.append({
                    'rank':     rank,
                    'id':       me.id,
                    'username': me.username,
                    'avatar':   request.build_absolute_uri(me.avatar.url) if me.avatar else None,
                    'rating':   me.rating,
                    'level':    me.level,
                    'streak':   me.streak,
                    'is_self':  True,
                })

        return Response({'leaderboard': result, 'total': User.objects.count()})


class UserSearchView(APIView):
    """
    GET /api/auth/search/?q=<query>
    Search users by username (for adding friends).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if len(q) < 2:
            return Response({'results': []})

        users = User.objects.filter(username__icontains=q).exclude(id=request.user.id)[:20]
        return Response({'results': PublicUserSerializer(users, many=True).data})


# ── Notification views ────────────────────────────────────────────────────────

class NotificationListView(generics.ListAPIView):
    """
    GET /api/auth/notifications/?limit=30
    Returns the latest notifications for the authenticated user.
    Includes streak-at-risk system notification if streak > 0 and user
    hasn't solved today (last_active < today).
    """
    serializer_class   = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        limit = min(int(self.request.query_params.get('limit', 30)), 100)
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')[:limit]

    def list(self, request, *args, **kwargs):
        limit   = min(int(request.query_params.get('limit', 30)), 100)
        base_qs = Notification.objects.filter(recipient=request.user).order_by('-created_at')
        unread  = base_qs.filter(read=False).count()   # count BEFORE slicing
        qs      = base_qs[:limit]
        data    = NotificationSerializer(qs, many=True).data

        # Inject a live "streak at risk" system notification if applicable
        user  = request.user
        today = timezone.now().date()
        streak_at_risk = (
            user.streak > 0 and
            user.last_active is not None and
            user.last_active < today
        )

        return Response({
            'notifications': data,
            'unread':        unread,
            'streak_at_risk': streak_at_risk,
        })


class MarkNotificationReadView(APIView):
    """POST /api/auth/notifications/<pk>/read/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        updated = Notification.objects.filter(
            pk=pk, recipient=request.user, read=False
        ).update(read=True)
        return Response({'marked': updated > 0})


class MarkAllNotificationsReadView(APIView):
    """POST /api/auth/notifications/read-all/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        count = Notification.objects.filter(
            recipient=request.user, read=False
        ).update(read=True)
        return Response({'marked': count})


class DeleteNotificationView(APIView):
    """DELETE /api/auth/notifications/<id>/delete/"""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        from .models import Notification
        try:
            notif = Notification.objects.get(pk=pk, recipient=request.user)
            notif.delete()
            return Response({'detail': 'Deleted'}, status=200)
        except Notification.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)


class FriendOnlineStatusView(APIView):
    """
    GET /api/auth/friends/online/
    Returns which friends were active today (last_active == today).
    Also marks the current user as online (updates last_active).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from friends.models import Friendship
        today = timezone.now().date()

        # Get all friendships
        friendships = Friendship.objects.filter(
            models.Q(user1=request.user) | models.Q(user2=request.user)
        ).select_related('user1', 'user2')

        online_friends = []
        for fs in friendships:
            friend = fs.user2 if fs.user1_id == request.user.id else fs.user1
            is_online = (friend.last_active == today)
            online_friends.append({
                'id':        friend.id,
                'username':  friend.username,
                'is_online': is_online,
                'avatar':    request.build_absolute_uri(friend.avatar.url) if friend.avatar else None,
            })

        return Response({'friends': online_friends})


class AIInsightNotificationView(APIView):
    """
    GET /api/auth/ai-insight/
    Returns a dynamic AI-generated insight message for the notification card
    based on real user data (streak, rating, weak areas, friends to beat).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from friends.models import Friendship
        from analytics.models import PlatformProfile
        from users.models import User
        user = request.user
        UserClass = type(user)

        rating = user.rating or 0
        streak = user.streak or 0
        insights = []

        # 1. Top 5 Global Rank Logic
        higher_rated_count = UserClass.objects.filter(rating__gt=rating).count()
        rank = higher_rated_count + 1

        if rank > 5:
            # We are not top 5. Find the gap to the 5th place user.
            top_5 = UserClass.objects.order_by('-rating')[:5]
            if len(top_5) == 5:
                fifth_rating = top_5[4].rating or 0
                gap = fifth_rating - rating
                if gap > 0:
                    insights.append(f"Gain *{gap} rating* to enter the *Top 5*!")
        else:
            insights.append(f"You are ranked *#{rank}* globally! Defend your spot.")

        # 2. Friend Rival Logic
        friendships = Friendship.objects.filter(
            models.Q(user1=request.user) | models.Q(user2=request.user)
        ).select_related('user1', 'user2')
        
        closest_rival = None
        smallest_gap = float('inf')
        
        for fs in friendships:
            friend = fs.user2 if fs.user1_id == user.id else fs.user1
            f_rating = friend.rating or 0
            if f_rating > rating:
                gap = f_rating - rating
                if gap < smallest_gap:
                    smallest_gap = gap
                    closest_rival = friend

        if closest_rival:
            insights.append(f"Gain *{smallest_gap} rating* to beat *{closest_rival.username}*!")

        # 3. Streak Milestone Logic
        milestones = [7, 30, 50, 100, 365]
        next_milestone = next((m for m in milestones if m > streak), None)
        if next_milestone:
            days_left = next_milestone - streak
            insights.append(f"Solve for *{days_left} more days* to hit your *{next_milestone}-day* milestone!")

        # 4. Weak Areas Logic
        for profile in PlatformProfile.objects.filter(user=user)[:1]:
            weak = profile.topic_stats.order_by('problems_solved').first()
            if weak:
                insights.append(f"Master *{weak.topic_name}* to push your *rating*.")

        # Ensure we have at least a few
        if len(insights) < 3:
            insights.append("Solve *1 more* problem to solidify your *knowledge* today!")
            
        return Response({'insights': insights[:4]})


class MentorAnalysisView(APIView):
    """
    GET /api/auth/mentor-analysis/
    Returns a real AI-generated coach card:
      - specialist: the topic the user is weakest in (used as card subtitle)
      - observation: what the AI noticed about their recent performance
      - insight: a deeper insight about their pattern
      - weakness: the specific gap/misconception
      - direction: one concrete action to take
    Falls back to data-driven hardcoded messages if AI is unavailable.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from analytics.models import TopicStats, PlatformStats, PlatformProfile
        from ai_engine.services import call_ai

        user = request.user

        # Gather all topic stats across all platforms
        all_topic_stats = []
        for profile in PlatformProfile.objects.filter(user=user).prefetch_related('topic_stats', 'stats'):
            for ts in profile.topic_stats.order_by('problems_solved'):
                all_topic_stats.append({
                    'topic': ts.topic_name,
                    'slug':  ts.topic_slug,
                    'solved': ts.problems_solved,
                    'platform': profile.platform_name,
                })

        # Sort: weakest first
        all_topic_stats.sort(key=lambda x: x['solved'])

        # Aggregate easy/medium/hard across platforms
        total_easy = total_medium = total_hard = 0
        for profile in PlatformProfile.objects.filter(user=user):
            try:
                s = profile.stats
                total_easy   += s.easy_solved
                total_medium += s.medium_solved
                total_hard   += s.hard_solved
            except Exception:
                pass

        total_solved = total_easy + total_medium + total_hard
        streak = user.streak
        rating = user.rating

        weak_topics  = [t for t in all_topic_stats if t['solved'] <= 5][:3]
        strong_topics = sorted(all_topic_stats, key=lambda x: -x['solved'])[:2]

        weak_str   = ', '.join(f"{t['topic']} ({t['solved']} solved)" for t in weak_topics) or 'none identified'
        strong_str = ', '.join(f"{t['topic']} ({t['solved']} solved)" for t in strong_topics) or 'none yet'
        specialist = weak_topics[0]['topic'] if weak_topics else (strong_topics[0]['topic'] if strong_topics else 'DSA')

        prompt = (
            f"You are an expert DSA coach reviewing a student's profile.\n"
            f"Student stats: {total_solved} total solved (Easy {total_easy}, Medium {total_medium}, Hard {total_hard}), "
            f"Rating {rating}, {streak}-day streak.\n"
            f"Weak areas (fewest problems solved): {weak_str}.\n"
            f"Strong areas: {strong_str}.\n\n"
            f"Write a short coaching card in JSON with exactly these keys:\n"
            f"  observation: one sentence (max 15 words) about what you noticed\n"
            f"  insight: one sentence (max 15 words) about a pattern you see\n"
            f"  weakness: one sentence (max 15 words) naming the specific gap\n"
            f"  direction: one concrete action (max 12 words)\n"
            f"  specialist: the single weakest topic name (1-3 words)\n"
            f"Be specific and dynamic. Use the actual topic names. Output only valid JSON, no extra text."
        )

        try:
            raw = call_ai('insight', prompt).strip()
            # Strip markdown code fences if present
            if raw.startswith('```'):
                raw = raw.split('```')[1]
                if raw.startswith('json'):
                    raw = raw[4:]
            import json
            data = json.loads(raw.strip())
            # Validate required keys
            for key in ('observation', 'insight', 'weakness', 'direction', 'specialist'):
                if key not in data:
                    raise ValueError(f'Missing key: {key}')
        except Exception:
            # Fallback: data-driven hardcoded messages
            if weak_topics:
                w = weak_topics[0]['topic']
                data = {
                    'specialist': w,
                    'observation': f"You've solved very few {w} problems so far.",
                    'insight': 'Medium problems are your current bottleneck.' if total_medium > total_hard else 'Easy problems dominate your solve history.',
                    'weakness': f'{w} fundamentals need more practice.',
                    'direction': f'Solve 3 {w} problems this week.',
                }
            elif total_solved == 0:
                data = {
                    'specialist': 'Getting Started',
                    'observation': "No problems solved yet — let's change that.",
                    'insight': 'Consistent daily practice builds intuition fast.',
                    'weakness': 'No data yet to pinpoint weaknesses.',
                    'direction': 'Solve one Easy problem today to start.',
                }
            else:
                data = {
                    'specialist': strong_topics[0]['topic'] if strong_topics else 'DSA',
                    'observation': f"You've solved {total_solved} problems — good momentum!",
                    'insight': 'Focus on harder problems to level up your rating.',
                    'weakness': 'Hard problems are underrepresented in your history.',
                    'direction': 'Try one Hard problem to push your limits.',
                }

        return Response(data)
