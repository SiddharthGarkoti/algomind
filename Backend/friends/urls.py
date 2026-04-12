from django.urls import path
from .views import (SendFriendRequestView, AcceptFriendRequestView,
                    RejectFriendRequestView, PendingRequestsView,
                    FriendsListView, RemoveFriendView)

urlpatterns = [
    path('send/',                    SendFriendRequestView.as_view(),   name='send_friend_request'),
    path('requests/',                PendingRequestsView.as_view(),     name='pending_requests'),
    path('requests/<int:pk>/accept/', AcceptFriendRequestView.as_view(), name='accept_request'),
    path('requests/<int:pk>/reject/', RejectFriendRequestView.as_view(), name='reject_request'),
    path('list/',                    FriendsListView.as_view(),          name='friends_list'),
    path('remove/<int:user_id>/',    RemoveFriendView.as_view(),         name='remove_friend'),
]
