from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LogoutView, ProfileView, EmailLoginView,
    PublicProfileView, LeaderboardView, UserSearchView,
    NotificationListView, MarkNotificationReadView, MarkAllNotificationsReadView, DeleteNotificationView,
    FriendOnlineStatusView, AIInsightNotificationView, MentorAnalysisView,
    SendOTPView, VerifyOTPView,
)
from .oauth import GitHubBeginView, GitHubCallbackView, GoogleBeginView, GoogleCallbackView

urlpatterns = [
    # ... snip OAuth/Auth
    path('register/',                RegisterView.as_view(),               name='register'),
    path('send-otp/',                SendOTPView.as_view(),                name='send_otp'),
    path('verify-otp/',              VerifyOTPView.as_view(),              name='verify_otp'),
    path('login/',                   EmailLoginView.as_view(),             name='login'),
    path('token/refresh/',           TokenRefreshView.as_view(),           name='token_refresh'),
    path('logout/',                  LogoutView.as_view(),                 name='logout'),
    path('profile/',                 ProfileView.as_view(),                name='profile'),
    path('profile/<str:username>/',  PublicProfileView.as_view(),          name='public_profile'),
    path('leaderboard/',             LeaderboardView.as_view(),            name='leaderboard'),
    path('search/',                  UserSearchView.as_view(),             name='user_search'),
    path('oauth/github/',            GitHubBeginView.as_view(),            name='oauth_github'),
    path('oauth/github/callback/',   GitHubCallbackView.as_view(),         name='oauth_github_callback'),
    path('oauth/google/',            GoogleBeginView.as_view(),            name='oauth_google'),
    path('oauth/google/callback/',   GoogleCallbackView.as_view(),         name='oauth_google_callback'),
    # Notifications
    path('notifications/',               NotificationListView.as_view(),          name='notifications'),
    path('notifications/read-all/',      MarkAllNotificationsReadView.as_view(),  name='notifications_read_all'),
    path('notifications/<int:pk>/read/', MarkNotificationReadView.as_view(),      name='notification_read'),
    path('notifications/<int:pk>/delete/', DeleteNotificationView.as_view(),      name='notification_delete'),
    path('friends/online/',              FriendOnlineStatusView.as_view(),        name='friends_online'),
    path('ai-insight/',                  AIInsightNotificationView.as_view(),     name='ai_insight'),
    path('mentor-analysis/',             MentorAnalysisView.as_view(),            name='mentor_analysis'),
]
