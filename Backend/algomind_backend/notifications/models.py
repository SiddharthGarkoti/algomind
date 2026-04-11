from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPES = [
        ('friend_request',        'Friend Request Received'),
        ('friend_accepted',       'Friend Request Accepted'),
        ('streak_reminder',       'Streak Reminder'),
        ('leaderboard_overtaken', 'Overtaken on Leaderboard'),
        ('stats_updated',         'Platform Stats Updated'),
        ('friend_active',         'Friend Active on Platform'),
    ]

    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    type       = models.CharField(max_length=30, choices=TYPES)
    title      = models.CharField(max_length=255)
    message    = models.TextField()
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} | {self.type} | {'read' if self.is_read else 'unread'}"
