from django.urls import path
from .views import HintView, ExplainView, DebugView, GeneratePlanView

urlpatterns = [
    path('hint/',          HintView.as_view(),         name='ai_hint'),
    path('explain/',       ExplainView.as_view(),       name='ai_explain'),
    path('debug/',         DebugView.as_view(),         name='ai_debug'),
    path('generate-plan/', GeneratePlanView.as_view(),  name='ai_generate_plan'),
]
