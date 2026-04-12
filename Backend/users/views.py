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
        qs      = self.get_queryset()
        data    = NotificationSerializer(qs, many=True).data
        unread  = qs.filter(read=False).count()

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
