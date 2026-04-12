from rest_framework import serializers
from .models import ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_username   = serializers.CharField(source='sender.username',  read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)

    class Meta:
        model  = ChatMessage
        fields = ['id', 'sender', 'sender_username', 'receiver', 'receiver_username',
                  'text', 'read', 'created_at']
        read_only_fields = ['id', 'sender', 'sender_username', 'receiver_username', 'read', 'created_at']
