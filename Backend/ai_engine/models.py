from django.db import models
from django.conf import settings


class AIRequest(models.Model):
    REQUEST_TYPES = [
        ('hint',    'Hint'),
        ('explain', 'Explain'),
        ('debug',   'Debug'),
    ]
    user         = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ai_requests')
    problem      = models.ForeignKey('dsa.Problem', on_delete=models.SET_NULL, null=True, blank=True)
    request_type = models.CharField(max_length=10, choices=REQUEST_TYPES)
    user_input   = models.TextField()
    ai_response  = models.TextField()
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} | {self.request_type} | {self.created_at:%Y-%m-%d}"
