from rest_framework import serializers
from django.db.models import Count
from .models import CommunityPost, PostLike, PostComment
from users.serializers import PublicUserSerializer


class PostCommentSerializer(serializers.ModelSerializer):
    author_info = PublicUserSerializer(source='author', read_only=True)

    class Meta:
        model = PostComment
        fields = ['id', 'author_info', 'body', 'created_at']
        read_only_fields = ['id', 'author_info', 'created_at']


class CommunityPostSerializer(serializers.ModelSerializer):
    author_info   = PublicUserSerializer(source='author', read_only=True)
    tag_list      = serializers.ReadOnlyField()
    like_count    = serializers.IntegerField(source='likes_count', read_only=True, default=0)
    comment_count = serializers.ReadOnlyField()
    liked_by_me   = serializers.SerializerMethodField()

    class Meta:
        model  = CommunityPost
        fields = ['id', 'author_info', 'post_type', 'title', 'body',
                  'tags', 'tag_list', 'like_count', 'comment_count', 'liked_by_me', 'created_at']
        read_only_fields = ['id', 'author_info', 'like_count', 'comment_count', 'liked_by_me', 'created_at']

    def get_liked_by_me(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False


class CreatePostSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CommunityPost
        fields = ['post_type', 'title', 'body', 'tags']
