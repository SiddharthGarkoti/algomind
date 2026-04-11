from django.urls import path
from .views import GlobalLeaderboardView, FriendsLeaderboardView, MyRankView

urlpatterns = [
    path('global/',  GlobalLeaderboardView.as_view(), name='global_leaderboard'),
    path('friends/', FriendsLeaderboardView.as_view(), name='friends_leaderboard'),
    path('me/',      MyRankView.as_view(),             name='my_rank'),
]