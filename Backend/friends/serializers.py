from rest_framework import serializers
from .models import FriendRequest, Friendship
from users.serializers import PublicUserSerializer


class FriendRequestSerializer(serializers.ModelSerializer):
    sender_info   = PublicUserSerializer(source='sender',   read_only=True)
    receiver_info = PublicUserSerializer(source='receiver', read_only=True)

    class Meta:
        model  = FriendRequest
        fields = ['id', 'sender', 'sender_info', 'receiver', 'receiver_info', 'status', 'created_at']
        read_only_fields = ['id', 'sender', 'status', 'created_at']


class SendRequestSerializer(serializers.Serializer):
    receiver_id = serializers.IntegerField()

    def validate_receiver_id(self, value):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("User not found.")
        return value


class FriendshipSerializer(serializers.ModelSerializer):
    friend = serializers.SerializerMethodField()

    class Meta:
        model  = Friendship
        fields = ['id', 'friend', 'created_at']

    def get_friend(self, obj):
        request_user = self.context['request'].user
        friend = obj.user2 if obj.user1 == request_user else obj.user1
        return PublicUserSerializer(friend).data
