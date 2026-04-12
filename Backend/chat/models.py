from django.db import models
from django.conf import settings


class ChatMessage(models.Model):
    """
    Temporary friend-to-friend messages.
    Messages are kept in the DB but the frontend clears them on logout / page close.
    A management command or Celery task can prune messages older than 24h.
    """
    sender    = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    receiver  = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_messages')
    text      = models.TextField()
    read      = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username} → {self.receiver.username}: {self.text[:40]}"
