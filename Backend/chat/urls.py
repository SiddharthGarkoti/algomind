from django.urls import path
from .views import ConversationView, UnreadCountView

urlpatterns = [
    path('unread/',      UnreadCountView.as_view(),  name='chat_unread'),
    path('<int:user_id>/', ConversationView.as_view(), name='chat_conversation'),
]
