from .models import Notification


def notify(user, notif_type, title, message):
    Notification.objects.create(
        user=user,
        type=notif_type,
        title=title,
        message=message,
    )


def notify_friend_request(receiver, sender):
    notify(
        user=receiver,
        notif_type='friend_request',
        title='New Friend Request',
        message=f'{sender.username} sent you a friend request.',
    )


def notify_friend_accepted(sender, receiver):
    notify(
        user=sender,
        notif_type='friend_accepted',
        title='Friend Request Accepted',
        message=f'{receiver.username} accepted your friend request.',
    )


def notify_streak_reminder(user):
    notify(
        user=user,
        notif_type='streak_reminder',
        title='Keep your streak alive!',
        message=f'You have a {user.streak} day streak. Log in and practice today to keep it going!',
    )


def notify_leaderboard_overtaken(user, overtaken_by):
    notify(
        user=user,
        notif_type='leaderboard_overtaken',
        title='You have been overtaken!',
        message=f'{overtaken_by.username} just overtook you on the leaderboard. Time to grind!',
    )


def notify_stats_updated(user, platform):
    notify(
        user=user,
        notif_type='stats_updated',
        title='Stats Updated',
        message=f'Your {platform} stats have been refreshed.',
    )


def notify_friend_active(user, friend, platform):
    notify(
        user=user,
        notif_type='friend_active',
        title='Friend is active!',
        message=f'{friend.username} just updated their {platform} stats. Check the leaderboard!',
    )