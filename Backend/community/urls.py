from django.urls import path
from .views import PostListView, CreatePostView, LikePostView

urlpatterns = [
    path('posts/',           PostListView.as_view(),   name='community_posts'),
    path('posts/create/',    CreatePostView.as_view(), name='community_create'),
    path('posts/<int:pk>/like/', LikePostView.as_view(), name='community_like'),
]
