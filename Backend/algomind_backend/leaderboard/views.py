from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum, Avg, Q
from django.contrib.auth import get_user_model
from analytics.models import PlatformStats, PlatformProfile
from friends.models import Friendship

User = get_user_model()


def get_user_stats(user):
    profiles = PlatformProfile.objects.filter(user=user)
    stats = PlatformStats.objects.filter(profile__in=profiles)

    total_problems = stats.aggregate(t=Sum('problems_solved'))['t'] or 0
    avg_rating     = stats.aggregate(a=Avg('rating'))['a'] or 0
    total_contests = stats.aggregate(c=Sum('contests'))['c'] or 0

    return {
        'id':                    user.id,
        'username':              user.username,
        'avatar':                user.avatar.url if user.avatar else None,
        'streak':                user.streak,
        'total_problems_solved': total_problems,
        'average_rating':        round(avg_rating),
        'total_contests':        total_contests,
        'platforms_connected':   profiles.count(),
    }


def rank_users(users_data):
    ranked = sorted(
        users_data,
        key=lambda x: (
            x['total_problems_solved'],
            x['average_rating'],
            x['streak'],
            x['total_contests'],
        ),
        reverse=True
    )
    for i, user in enumerate(ranked, start=1):
        user['rank'] = i
    return ranked


class GlobalLeaderboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        users = User.objects.all()
        data  = [get_user_stats(u) for u in users]
        ranked = rank_users(data)
        return Response({
            'type':  'global',
            'count': len(ranked),
            'leaderboard': ranked,
        })


class FriendsLeaderboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Get all friends
        friendships = Friendship.objects.filter(
            Q(user1=request.user) | Q(user2=request.user)
        ).select_related('user1', 'user2')

        friend_users = []
        for f in friendships:
            friend = f.user2 if f.user1 == request.user else f.user1
            friend_users.append(friend)

        # Include current user too
        all_users = [request.user] + friend_users
        data      = [get_user_stats(u) for u in all_users]
        ranked    = rank_users(data)

        return Response({
            'type':  'friends',
            'count': len(ranked),
            'leaderboard': ranked,
        })


class MyRankView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        users  = User.objects.all()
        data   = [get_user_stats(u) for u in users]
        ranked = rank_users(data)

        my_rank = next((u for u in ranked if u['id'] == request.user.id), None)
        return Response(my_rank)
