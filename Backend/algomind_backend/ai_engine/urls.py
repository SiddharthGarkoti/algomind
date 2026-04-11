from django.urls import path
from .views import HintView, ExplainView, DebugView

urlpatterns = [
    path('hint/',    HintView.as_view(),    name='ai_hint'),
    path('explain/', ExplainView.as_view(), name='ai_explain'),
    path('debug/',   DebugView.as_view(),   name='ai_debug'),
]
