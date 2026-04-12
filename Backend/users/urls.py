from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, LogoutView, ProfileView,
    PublicProfileView, LeaderboardView, UserSearchView,
    NotificationListView, MarkNotificationReadView, MarkAllNotificationsReadView,
)
from .oauth import GitHubBeginView, GitHubCallbackView, GoogleBeginView, GoogleCallbackView

urlpatterns = [
    path('register/',                RegisterView.as_view(),               name='register'),
    path('login/',                   TokenObtainPairView.as_view(),        name='login'),
    path('token/refresh/',           TokenRefreshView.as_view(),           name='token_refresh'),
    path('logout/',                  LogoutView.as_view(),                 name='logout'),
    path('profile/',                 ProfileView.as_view(),                name='profile'),
    path('profile/<str:username>/',  PublicProfileView.as_view(),          name='public_profile'),
    path('leaderboard/',             LeaderboardView.as_view(),            name='leaderboard'),
    path('search/',                  UserSearchView.as_view(),             name='user_search'),
    # OAuth — GitHub
    path('oauth/github/',            GitHubBeginView.as_view(),            name='oauth_github'),
    path('oauth/github/callback/',   GitHubCallbackView.as_view(),         name='oauth_github_callback'),
    # OAuth — Google
    path('oauth/google/',            GoogleBeginView.as_view(),            name='oauth_google'),
    path('oauth/google/callback/',   GoogleCallbackView.as_view(),         name='oauth_google_callback'),
    # Notifications
    path('notifications/',               NotificationListView.as_view(),          name='notifications'),
    path('notifications/read-all/',      MarkAllNotificationsReadView.as_view(),  name='notifications_read_all'),
    path('notifications/<int:pk>/read/', MarkNotificationReadView.as_view(),      name='notification_read'),
]
