from django.urls import path
from .views import (NotificationListView, MarkReadView,
                    MarkAllReadView, UnreadCountView, DeleteNotificationView)

urlpatterns = [
    path('',                  NotificationListView.as_view(), name='notifications'),
    path('unread/',           UnreadCountView.as_view(),      name='unread_count'),
    path('mark-all-read/',    MarkAllReadView.as_view(),      name='mark_all_read'),
    path('<int:pk>/read/',    MarkReadView.as_view(),         name='mark_read'),
    path('<int:pk>/delete/',  DeleteNotificationView.as_view(), name='delete_notification'),
]