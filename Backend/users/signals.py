"""
signals.py — Auto-create Notification records in response to FriendRequest events.
Connected in users/apps.py ready() so they are registered once at startup.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender='friends.FriendRequest')
def on_friend_request_saved(sender, instance, created, **kwargs):
    """
    • When a FriendRequest is *created*  → notify the receiver that someone sent them a request.
    • When a FriendRequest is *accepted* → notify the original sender that it was accepted.
    """
    from users.models import Notification  # local import avoids circular imports

    if created:
        # New friend request — tell the receiver
        sender_user   = instance.sender
        receiver_user = instance.receiver
        initials = (sender_user.username[:2]).upper()
        Notification.objects.create(
            recipient   = receiver_user,
            notif_type  = 'friend_request',
            title       = sender_user.username,
            body        = f'{sender_user.username} sent you a friend request.',
            related_id  = instance.pk,
            avatar_text = initials,
            color       = '#6366F1',
        )

    elif instance.status == 'accepted':
        # Request was accepted — tell the original sender
        sender_user   = instance.sender
        receiver_user = instance.receiver
        initials = (receiver_user.username[:2]).upper()
        # Avoid duplicate "accepted" notifications
        already = Notification.objects.filter(
            recipient  = sender_user,
            notif_type = 'friend_accepted',
            related_id = instance.pk,
        ).exists()
        if not already:
            Notification.objects.create(
                recipient   = sender_user,
                notif_type  = 'friend_accepted',
                title       = receiver_user.username,
                body        = f'{receiver_user.username} accepted your friend request!',
                related_id  = instance.pk,
                avatar_text = initials,
                color       = '#22C55E',
            )
