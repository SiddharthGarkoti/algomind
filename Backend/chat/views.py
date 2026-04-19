from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ChatMessage
from .serializers import ChatMessageSerializer

User = get_user_model()


class ConversationView(APIView):
    """
    GET  /api/chat/<user_id>/  — fetch messages between me and user_id
    POST /api/chat/<user_id>/  — send a message to user_id
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        try:
            other = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        msgs = ChatMessage.objects.filter(
            Q(sender=request.user, receiver=other) |
            Q(sender=other, receiver=request.user)
        ).order_by('created_at')

        # Mark unread messages as read
        msgs.filter(receiver=request.user, read=False).update(read=True)

        return Response(ChatMessageSerializer(msgs, many=True).data)

    def post(self, request, user_id):
        try:
            receiver = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        text = (request.data.get('text') or '').strip()
        if not text:
            return Response({'detail': 'Message cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        msg = ChatMessage.objects.create(sender=request.user, receiver=receiver, text=text)

        # Create a bell notification for the receiver so they see it in the notification dropdown
        # Only create if there isn't already an unread one from this sender (avoid spam)
        from users.models import Notification
        already_notified = Notification.objects.filter(
            recipient=receiver,
            notif_type='message',
            read=False,
            avatar_text=request.user.username[:2].upper(),
        ).exists()
        if not already_notified:
            preview = text if len(text) <= 60 else text[:57] + '...'
            Notification.objects.create(
                recipient=receiver,
                notif_type='message',
                title=f'New message from {request.user.username}',
                body=preview,
                avatar_text=request.user.username[:2].upper(),
                color='#6366F1',
            )

        return Response(ChatMessageSerializer(msg).data, status=status.HTTP_201_CREATED)


class UnreadCountView(APIView):
    """GET /api/chat/unread/ — total unread message count for the current user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = ChatMessage.objects.filter(receiver=request.user, read=False).count()
        return Response({'unread': count})
