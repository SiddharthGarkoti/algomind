from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CommunityPost, PostLike
from .serializers import CommunityPostSerializer, CreatePostSerializer


class IsAdminUser(permissions.BasePermission):
    """Allow only users with is_admin=True or Django superusers."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_admin or request.user.is_staff or request.user.is_superuser)
        )


class PostListView(generics.ListAPIView):
    """GET /api/community/posts/ — anyone can read posts."""
    serializer_class   = CommunityPostSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs        = CommunityPost.objects.prefetch_related('likes', 'author')
        post_type = self.request.query_params.get('type')
        if post_type:
            qs = qs.filter(post_type=post_type)
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class CreatePostView(generics.CreateAPIView):
    """POST /api/community/posts/create/ — only admins can post."""
    serializer_class   = CreatePostSerializer
    permission_classes = [IsAdminUser]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class LikePostView(APIView):
    """POST /api/community/posts/<pk>/like/ — toggle like."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            post = CommunityPost.objects.get(pk=pk)
        except CommunityPost.DoesNotExist:
            return Response({'detail': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)

        like, created = PostLike.objects.get_or_create(post=post, user=request.user)
        if not created:
            like.delete()
            return Response({'liked': False, 'like_count': post.like_count})
        return Response({'liked': True, 'like_count': post.like_count})
