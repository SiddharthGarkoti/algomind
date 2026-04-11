from django.urls import path
from .views import (ConnectPlatformView, DashboardView,
                    OverviewView, TopicAnalysisView, SubmissionAnalysisView,
                    HeatmapView, ImprovementView, InsightsView,
                    RecommendationsView, FullDashboardView)
from .views import DebugFetchView

urlpatterns = [
    path('connect/',         ConnectPlatformView.as_view(),    name='connect_platform'),
    path('dashboard/',       DashboardView.as_view(),          name='analytics_dashboard'),
    path('overview/',        OverviewView.as_view(),           name='overview'),
    path('topics/',          TopicAnalysisView.as_view(),      name='topic_analysis'),
    path('submissions/',     SubmissionAnalysisView.as_view(), name='submission_analysis'),
    path('heatmap/',         HeatmapView.as_view(),            name='heatmap'),
    path('improvement/',     ImprovementView.as_view(),        name='improvement'),
    path('insights/',        InsightsView.as_view(),           name='insights'),
    path('recommendations/', RecommendationsView.as_view(),    name='recommendations'),
    path('full/',            FullDashboardView.as_view(),      name='full_dashboard'),
    path('debug/', DebugFetchView.as_view(), name='debug_fetch'),
]
