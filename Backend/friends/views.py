from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import FriendRequest, Friendship
from .serializers import FriendRequestSerializer, SendRequestSerializer, FriendshipSerializer

User = get_user_model()


class SendFriendRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SendRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        receiver_id = serializer.validated_data['receiver_id']

        if receiver_id == request.user.id:
            return Response({'detail': 'You cannot send a request to yourself.'},
                            status=status.HTTP_400_BAD_REQUEST)

        receiver = User.objects.get(id=receiver_id)

        # Check for existing friendship
        already_friends = Friendship.objects.filter(
            Q(user1=request.user, user2=receiver) |
            Q(user1=receiver,     user2=request.user)
        ).exists()
        if already_friends:
            return Response({'detail': 'You are already friends.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check for duplicate/pending request
        if FriendRequest.objects.filter(sender=request.user, receiver=receiver, status='pending').exists():
            return Response({'detail': 'Friend request already sent.'}, status=status.HTTP_400_BAD_REQUEST)

        # Auto-accept if the receiver had already sent one to us
        reverse = FriendRequest.objects.filter(sender=receiver, receiver=request.user, status='pending').first()
        if reverse:
            reverse.status = 'accepted'
            reverse.save()
            u1, u2 = sorted([request.user.id, receiver.id])
            Friendship.objects.get_or_create(user1_id=u1, user2_id=u2)
            return Response({'detail': 'Friend request auto-accepted — you are now friends!'})

        friend_request = FriendRequest.objects.create(sender=request.user, receiver=receiver)
        return Response(FriendRequestSerializer(friend_request).data, status=status.HTTP_201_CREATED)


class AcceptFriendRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            freq = FriendRequest.objects.get(id=pk, receiver=request.user, status='pending')
        except FriendRequest.DoesNotExist:
            return Response({'detail': 'Request not found or already handled.'}, status=status.HTTP_404_NOT_FOUND)

        freq.status = 'accepted'
        freq.save()

        u1, u2 = sorted([freq.sender.id, freq.receiver.id])
        Friendship.objects.get_or_create(user1_id=u1, user2_id=u2)

        return Response({'detail': 'Friend request accepted.'})


class RejectFriendRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            freq = FriendRequest.objects.get(id=pk, receiver=request.user, status='pending')
        except FriendRequest.DoesNotExist:
            return Response({'detail': 'Request not found or already handled.'}, status=status.HTTP_404_NOT_FOUND)

        freq.status = 'rejected'
        freq.save()
        return Response({'detail': 'Friend request rejected.'})


class PendingRequestsView(generics.ListAPIView):
    serializer_class   = FriendRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FriendRequest.objects.filter(receiver=self.request.user, status='pending').select_related('sender', 'receiver')


class FriendsListView(generics.ListAPIView):
    serializer_class   = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Friendship.objects.filter(
            Q(user1=self.request.user) | Q(user2=self.request.user)
        ).select_related('user1', 'user2')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class RemoveFriendView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, user_id):
        deleted, _ = Friendship.objects.filter(
            Q(user1=request.user, user2_id=user_id) |
            Q(user1_id=user_id,   user2=request.user)
        ).delete()
        if deleted:
            return Response({'detail': 'Friend removed.'})
        return Response({'detail': 'Friendship not found.'}, status=status.HTTP_404_NOT_FOUND)
