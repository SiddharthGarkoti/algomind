from django.urls import path
from .views import (
    ConnectPlatformView,
    DashboardView,
    ValidateHandleView,
    WeakAreasView,
    RefreshPlatformView,
    RecentSubmissionsView,
    PreviewStatsView,
)

urlpatterns = [
    path('connect/',                        ConnectPlatformView.as_view(),    name='connect_platform'),
    path('dashboard/',                      DashboardView.as_view(),          name='analytics_dashboard'),
    path('weak-areas/',                     WeakAreasView.as_view(),          name='weak_areas'),
    path('recent-submissions/',             RecentSubmissionsView.as_view(),  name='recent_submissions'),
    path('refresh/<str:platform>/',         RefreshPlatformView.as_view(),    name='refresh_platform'),
    path('validate/<str:platform>/<str:handle>/', ValidateHandleView.as_view(), name='validate_handle'),
    path('preview/<str:platform>/<str:handle>/', PreviewStatsView.as_view(),  name='preview_stats'),
]
